import inspect
import os
import types
import typing
from typing import Any, Dict, Set

from app.schema import MultipleOutputs, UserModel


def merge_types_dict(master_types, incoming_types):
    """Merge incoming types into a master types dictionary."""
    for type_name, type_schema in incoming_types.items():
        if type_name not in master_types:
            master_types[type_name] = type_schema


def get_type_repr(tp, module_ns, short_repr=True):
    """get a string representation of a type"""
    if short_repr:
        for name, val in module_ns.items():
            if val is tp and name.isidentifier():
                return name
    # Handle types.UnionType (int | float style)
    if isinstance(tp, types.UnionType):
        return {
            "anyOf": [get_type_repr(arg, module_ns, short_repr) for arg in tp.__args__]
        }
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


def analyze_type(
    tp: Any,
    file_path: str,
    module_ns: Dict[str, Any],
) -> Dict[str, Dict[str, Any]]:
    """Analyze a type and return a dict of type schemas for it and all constituent types."""
    types_dict: Dict[str, Dict[str, Any]] = {}
    found_types_set: Set[Any] = set()

    def _add_type_recursive(t: Any):
        """Internal recursive function to build types_dict."""
        if t in found_types_set:
            return
        found_types_set.add(t)

        # Skip types that derive from MultipleOutputs
        if (
            inspect.isclass(t)
            and issubclass(t, MultipleOutputs)
            and t is not MultipleOutputs
        ):
            return

        # Builtin
        if inspect.isclass(t) and t.__module__ == "builtins":
            tname = t.__name__
            if tname not in types_dict:
                types_dict[tname] = {"kind": "builtin", "class": t}
        # User Model (detected by UserModel derivation)
        elif inspect.isclass(t) and issubclass(t, UserModel) and t is not UserModel:
            for name, val in module_ns.items():
                if val is t and name.isidentifier():
                    if name not in types_dict:
                        entry = {
                            "kind": "user_model",
                            "class": t,
                            "category": os.path.splitext(file_path)[0]
                            .replace(os.sep, ".")
                            .split("."),
                        }
                        if hasattr(t, "__annotations__") and t.__annotations__:
                            entry["properties"] = {
                                field: get_type_repr(ftype, module_ns, short_repr=True)
                                for field, ftype in t.__annotations__.items()
                            }
                            # Recursively add field types
                            for field_type in t.__annotations__.values():
                                _add_type_recursive(field_type)
                        types_dict[name] = entry
                    break
        # Other user classes (not derived from UserModel)
        elif inspect.isclass(t):
            for name, val in module_ns.items():
                if val is t and name.isidentifier():
                    if name not in types_dict:
                        entry = {
                            "kind": "user_class",
                            "class": t,
                            "category": os.path.splitext(file_path)[0]
                            .replace(os.sep, ".")
                            .split("."),
                        }
                        if hasattr(t, "__annotations__") and t.__annotations__:
                            entry["properties"] = {
                                field: get_type_repr(ftype, module_ns, short_repr=True)
                                for field, ftype in t.__annotations__.items()
                            }
                            # Recursively add field types
                            for field_type in t.__annotations__.values():
                                _add_type_recursive(field_type)
                        types_dict[name] = entry
                    break
        # User alias (including typing.Union, etc. if defined as an alias in the module)
        else:
            for name, val in module_ns.items():
                if val is t and name.isidentifier():
                    if not inspect.isclass(val):
                        if name not in types_dict:
                            # Use short_repr=False to expand unions
                            types_dict[name] = {
                                "kind": "user_alias",
                                "class": t,
                                "type": get_type_repr(t, module_ns, short_repr=False),
                                "category": os.path.splitext(file_path)[0]
                                .replace(os.sep, ".")
                                .split("."),
                            }
                            # Recursively add constituent types from the alias
                            if hasattr(t, "__args__"):
                                for arg in t.__args__:
                                    _add_type_recursive(arg)
                        break

        # Recursively add types for generics/aliases
        if hasattr(t, "__origin__") and hasattr(t, "__args__"):
            for arg in t.__args__:
                _add_type_recursive(arg)

    _add_type_recursive(tp)
    return types_dict
