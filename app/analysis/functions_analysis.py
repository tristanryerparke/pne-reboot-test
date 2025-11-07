import inspect
import os
import typing
from typing import Any, Callable, Dict, Set

from app.analysis.types_analysis import add_type_to_types_dict, get_type_repr
from app.schema import FunctionAsNode, MultipleOutputs


def analyze_function(
    func_name: str,
    func_obj: Callable,
    file_path: str,
    module_ns: Dict[str, Any],
    types_dict: Dict[str, Dict[str, Any]],
    found_types: Set[Any],
) -> FunctionAsNode:
    """Analyze a single function and extract its metadata.

    Args:
        func_name: Name of the function
        func_obj: The function object to analyze
        file_path: Path to the file containing the function
        module_ns: Namespace of the module
        types_dict: Dictionary to store type information
        found_types: Set of types already processed for deduplication

    Returns:
        FunctionAsNode instance containing function metadata
    """
    sig = inspect.signature(func_obj)
    type_hints = typing.get_type_hints(func_obj, module_ns, module_ns)

    # Convert file path to module-like category
    category = os.path.splitext(file_path)[0].replace(os.sep, ".").split(".")

    # Get the docstring of the function
    doc = inspect.getdoc(func_obj)

    # Get the input arguments of the function
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
        add_type_to_types_dict(ann, file_path, module_ns, types_dict, found_types)

    # Handle return type and detect multiple outputs
    ret_ann = type_hints.get("return", sig.return_annotation)
    if ret_ann is inspect.Signature.empty:
        raise Exception(f"Function {func_name} has no return annotation")

    # Detect output fields from subclasses of MultipleOutputs return type
    # Having the output_style flag lets a user potentially have an output
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
                add_type_to_types_dict(
                    field_info.annotation, file_path, module_ns, types_dict, found_types
                )
    # Basic single output
    else:
        output_style = "single"
        outputs["return"] = {"type": get_type_repr(ret_ann, module_ns, short_repr=True)}

    add_type_to_types_dict(ret_ann, file_path, module_ns, types_dict, found_types)

    return FunctionAsNode(
        name=func_name,
        callable=func_obj,
        category=category,
        doc=doc,
        arguments=arguments,
        output_style=output_style,
        outputs=outputs,
    )
