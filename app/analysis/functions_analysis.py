import inspect
import os
import typing
import uuid
from typing import Any, Callable, Dict, Tuple

from app.schema import FunctionSchema, MultipleOutputs

from .types_analysis import analyze_type, get_type_repr, merge_types_dict


def analyze_function(
    func_obj: Callable,
    file_path: str,
    module_ns: Dict[str, Any],
) -> Tuple[str, FunctionSchema, Callable, Dict[str, Any]]:
    """Analyze a function and return its ID, schema, callable, and found types"""

    # Inspect the function
    sig = inspect.signature(func_obj)
    type_hints = typing.get_type_hints(func_obj, module_ns, module_ns)

    # Local dict for types found in this function
    found_types: Dict[str, Any] = {}

    # Get the input arguments schema of the function and register the types
    arguments = {}
    for arg in sig.parameters.values():
        ann = type_hints.get(arg.name, arg.annotation)
        # You need to type annotate!
        if ann is inspect.Parameter.empty:
            raise Exception(f"Parameter {arg.name} has no annotation")
        arg_entry = {"type": get_type_repr(ann, module_ns, short_repr=True)}
        if arg.default is not inspect.Parameter.empty:
            arg_entry["value"] = arg.default
        else:
            arg_entry["value"] = None
        arguments[arg.name] = arg_entry

        # Analyze the argument type and merge with found types
        arg_types = analyze_type(ann, file_path, module_ns)
        merge_types_dict(found_types, arg_types)

    # Handle return type and detect multiple outputs
    ret_ann = type_hints.get("return", sig.return_annotation)
    if ret_ann is inspect.Signature.empty:
        raise Exception(f"Function {func_obj.__name__} has no return annotation")

    # Detect output fields from subclasses of MultipleOutputs return type
    # Having the output_style flag lets a user potentially have an output (of multiple)
    # named "return" without breaking the app
    outputs = {}
    if inspect.isclass(ret_ann) and issubclass(ret_ann, MultipleOutputs):
        # Get the model fields using Pydantic's model_fields
        output_style = "multiple"
        for field_name, field_info in ret_ann.model_fields.items():
            if field_info.annotation is not None:
                output_entry = {
                    "type": get_type_repr(
                        field_info.annotation, module_ns, short_repr=True
                    )
                }
                outputs[field_name] = output_entry

                # Analyze the output field type and merge with found types
                field_types = analyze_type(field_info.annotation, file_path, module_ns)
                merge_types_dict(found_types, field_types)

    # Basic single output
    else:
        output_style = "single"
        outputs["return"] = {"type": get_type_repr(ret_ann, module_ns, short_repr=True)}

    # Analyze the return type and merge found types
    ret_types = analyze_type(ret_ann, file_path, module_ns)
    merge_types_dict(found_types, ret_types)

    callable_id = str(uuid.uuid4())

    return (
        callable_id,
        FunctionSchema(
            name=func_obj.__name__,
            callable_id=callable_id,
            category=os.path.splitext(file_path)[0].replace(os.sep, ".").split("."),
            doc=inspect.getdoc(func_obj),
            arguments=arguments,
            output_style=output_style,
            outputs=outputs,
        ),
        func_obj,
        found_types,
    )
