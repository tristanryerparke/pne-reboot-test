import sys
import uuid
from inspect import isclass

from devtools import debug as d

from .types_analysis import get_type_repr


def make_constructor(cls, type_name):
    def constructor(**kwargs):
        return cls(**kwargs)

    constructor.__name__ = f"construct_{type_name}"
    return constructor


def create_const_deconst_models(types):
    from ..schema import FunctionSchema, UserModel

    model_schemas = []
    model_callables = {}

    for type_name, type_def in types.items():
        python_class = type_def["class"]
        d(python_class)

        # find user_models
        if isclass(python_class):
            if issubclass(python_class, UserModel):
                construct = False
                deconstruct = False
                if hasattr(python_class, "_deconstruct_node"):
                    deconstruct = True
                if hasattr(python_class, "_construct_node"):
                    construct = True

                    # Get the module namespace for this class
                    module_name = python_class.__module__
                    module = sys.modules.get(module_name)
                    module_ns = vars(module) if module else {}

                    # Extract field names and types from the UserModel
                    arguments = {}
                    for field_name, field_info in python_class.model_fields.items():
                        if field_info.annotation is not None:
                            arg_entry = {
                                "type": get_type_repr(
                                    field_info.annotation,
                                    module_ns,
                                    short_repr=True,
                                )
                            }
                            # Check if field has a default value
                            # Use is_required() to check if field has no default
                            from pydantic_core import PydanticUndefined

                            if field_info.default is not PydanticUndefined:
                                arg_entry["value"] = field_info.default
                            elif field_info.default_factory is not None:
                                # Field has a default_factory, we can't serialize it
                                arg_entry["value"] = None
                            else:
                                arg_entry["value"] = None
                            arguments[field_name] = arg_entry

                    # Create the output - a single output returning the constructed UserModel
                    outputs = {
                        "return": {
                            "type": get_type_repr(
                                python_class, module_ns, short_repr=True
                            )
                        }
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

                    # Add to return collections
                    model_schemas.append(const_model)
                    model_callables[callable_id] = constructor_func

                    d(const_model)

                print(f"construct: {construct}, deconstruct: {deconstruct}")

    return model_schemas, model_callables
