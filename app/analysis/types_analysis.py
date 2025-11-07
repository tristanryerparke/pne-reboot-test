import inspect
import os
import typing
from typing import Any, Dict, Set

from app.schema import MultipleOutputs, UserModel


def get_type_repr(tp, module_ns, short_repr=True):
    """get a string representation of a type"""
    if short_repr:
        for name, val in module_ns.items():
            if val is tp and name.isidentifier():
                return name
    if hasattr(tp, "__origin__"):
        origin: Any = tp.__origin__
        # print(origin)
        if origin is typing.Union:
            return {
                "anyOf": [
                    get_type_repr(arg, module_ns, short_repr) for arg in tp.__args__
                ]
            }
        elif origin in (list, typing.List):
            return {
                "type": "array",
                "items": get_type_repr(tp.__args__[0], module_ns, short_repr),
            }
        else:
            raise ValueError("Unknown origin", tp)
    if hasattr(tp, "__name__"):
        return tp.__name__
    return str(tp)


def add_type_to_types_dict(
    tp: Any,
    file_path: str,
    module_ns: Dict[str, Any],
    types_dict: Dict[str, Dict[str, Any]],
    found_types: Set[Any],
):
    """Add a type to the types_dict.

    Args:
        tp: The type to analyze and add
        file_path: Path to the Python file being analyzed
        module_ns: Namespace of the module
        types_dict: Dictionary to store type information
        found_types: Set of types already processed (for deduplication)
    """
    if tp in found_types:
        return
    found_types.add(tp)

    # Skip types that derive from MultipleOutputs
    if (
        inspect.isclass(tp)
        and issubclass(tp, MultipleOutputs)
        and tp is not MultipleOutputs
    ):
        return

    # Builtin
    if inspect.isclass(tp) and tp.__module__ == "builtins":
        tname = tp.__name__

        if tname not in types_dict:
            types_dict[tname] = {"class": tp, "kind": "builtin"}
    # User Model (detected by UserModel derivation)
    elif inspect.isclass(tp) and issubclass(tp, UserModel) and tp is not UserModel:
        for name, val in module_ns.items():
            if val is tp and name.isidentifier():
                entry = {
                    "class": tp,
                    "kind": "user_model",
                    "category": os.path.splitext(file_path)[0]
                    .replace(os.sep, ".")
                    .split("."),
                }
                if hasattr(tp, "__annotations__") and tp.__annotations__:
                    entry["properties"] = {
                        field: get_type_repr(ftype, module_ns, short_repr=True)
                        for field, ftype in tp.__annotations__.items()
                    }
                    # Recursively add field types to types_dict
                    for field_type in tp.__annotations__.values():
                        add_type_to_types_dict(
                            field_type, file_path, module_ns, types_dict, found_types
                        )
                types_dict[name] = entry
                break
    # Other user classes (not derived from UserModel)
    elif inspect.isclass(tp):
        for name, val in module_ns.items():
            if val is tp and name.isidentifier():
                entry = {
                    "class": tp,
                    "kind": "user_class",
                    "category": os.path.splitext(file_path)[0]
                    .replace(os.sep, ".")
                    .split("."),
                }
                if hasattr(tp, "__annotations__") and tp.__annotations__:
                    entry["properties"] = {
                        field: get_type_repr(ftype, module_ns, short_repr=True)
                        for field, ftype in tp.__annotations__.items()
                    }
                    # Recursively add field types to types_dict
                    for field_type in tp.__annotations__.values():
                        add_type_to_types_dict(
                            field_type, file_path, module_ns, types_dict, found_types
                        )
                types_dict[name] = entry
                break
    # User alias (including typing.Union, etc. if defined as an alias in the module)
    else:
        for name, val in module_ns.items():
            if val is tp and name.isidentifier():
                if not inspect.isclass(val):
                    # Use short_repr=False to expand unions
                    types_dict[name] = {
                        "class": tp,
                        "kind": "user_alias",
                        "type": get_type_repr(tp, module_ns, short_repr=False),
                        "category": os.path.splitext(file_path)[0]
                        .replace(os.sep, ".")
                        .split("."),
                    }
                    # Recursively add constituent types from the alias
                    if hasattr(tp, "__args__"):
                        for arg in tp.__args__:
                            add_type_to_types_dict(
                                arg, file_path, module_ns, types_dict, found_types
                            )
                    break
    # Recursively add types for generics/aliases
    if hasattr(tp, "__origin__") and hasattr(tp, "__args__"):
        for arg in tp.__args__:
            add_type_to_types_dict(arg, file_path, module_ns, types_dict, found_types)
