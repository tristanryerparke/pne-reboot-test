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


def make_deconstructor(cls, type_name, field_names):
    def deconstructor(instance):
        # Extract field values and return as dict
        result = {
            field_name: getattr(instance, field_name) for field_name in field_names
        }
        # Wrap in a MultipleOutputs class for returning
        from ..schema import MultipleOutputs

        # Create a dynamic MultipleOutputs subclass
        outputs_class = type(
            f"{type_name}DeconstructOutputs",
            (MultipleOutputs,),
            {
                "__annotations__": {
                    field_name: getattr(instance, field_name).__class__
                    for field_name in field_names
                }
            },
        )
        return outputs_class(**result)

    deconstructor.__name__ = f"deconstruct_{type_name}"
    return deconstructor


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
                # Get the module namespace for this class
                module_name = python_class.__module__
                module = sys.modules.get(module_name)
                module_ns = vars(module) if module else {}

                # Extract field names and types from the UserModel (used by both construct/deconstruct)
                field_names = []
                field_types = {}
                for field_name, field_info in python_class.model_fields.items():
                    if field_info.annotation is not None:
                        field_names.append(field_name)
                        field_types[field_name] = get_type_repr(
                            field_info.annotation,
                            module_ns,
                            short_repr=True,
                        )

                # Handle construction node
                if (
                    hasattr(python_class, "_construct_node")
                    and python_class._construct_node
                ):
                    # Build arguments for constructor
                    arguments = {}
                    from pydantic_core import PydanticUndefined

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
                        doc=f"Construct a {type_name} instance from its field values",
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

                # Handle deconstruction node
                if (
                    hasattr(python_class, "_deconstruct_node")
                    and python_class._deconstruct_node
                ):
                    # Build arguments for deconstructor (single input: the instance)
                    arguments = {
                        "instance": {
                            "type": get_type_repr(
                                python_class, module_ns, short_repr=True
                            ),
                            "value": None,
                        }
                    }

                    # Create multiple outputs - one for each field
                    outputs = {
                        field_name: {"type": field_types[field_name]}
                        for field_name in field_names
                    }

                    callable_id = str(uuid.uuid4())

                    deconst_model = FunctionSchema(
                        name=f"deconstruct-{type_name}",
                        callable_id=callable_id,
                        category=type_def["category"],
                        doc=f"Deconstruct a {type_name} instance into its field values",
                        arguments=arguments,
                        output_style="multiple",
                        outputs=outputs,
                        return_value_name=None,
                    )

                    # Create the callable deconstructor function
                    deconstructor_func = make_deconstructor(
                        python_class, type_name, field_names
                    )

                    # Add to return collections
                    model_schemas.append(deconst_model)
                    model_callables[callable_id] = deconstructor_func

                    d(deconst_model)

    return model_schemas, model_callables
