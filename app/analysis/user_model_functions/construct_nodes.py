import sys
import uuid

from devtools import debug as d

from ..types_analysis import get_type_repr


def make_constructor(cls, type_name):
    def constructor(**kwargs):
        return cls(**kwargs)

    constructor.__name__ = f"construct_{type_name}"
    return constructor


def create_construct_node(
    python_class, type_name, type_def, field_names, field_types, module_ns
):
    from pydantic_core import PydanticUndefined

    from ...schema import FunctionSchema

    # Build arguments for constructor
    arguments = {}
    for field_name, field_info in python_class.model_fields.items():
        if field_info.annotation is not None:
            arg_entry = {"type": field_types[field_name]}

            # Check if field has a default value
            if field_info.default is not PydanticUndefined:
                arg_entry["value"] = field_info.default
            elif field_info.default_factory is not None:
                arg_entry["value"] = None
            else:
                arg_entry["value"] = None
            arguments[field_name] = arg_entry

    # Create the output - a single output returning the constructed UserModel
    outputs = {
        "return": {"type": get_type_repr(python_class, module_ns, short_repr=True)}
    }

    callable_id = str(uuid.uuid4())

    const_model = FunctionSchema(
        name=f"construct-{type_name}",
        callable_id=callable_id,
        category=type_def["category"],
        doc=f"Construct a {type_name} instance",
        arguments=arguments,
        output_style="single",
        outputs=outputs,
        return_value_name=None,
    )

    # Create the callable constructor function
    constructor_func = make_constructor(python_class, type_name)

    d(const_model)

    return const_model, callable_id, constructor_func
