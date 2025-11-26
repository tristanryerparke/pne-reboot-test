import inspect
import os
import types
import typing
from typing import Any, Dict, Set

from app.cache import is_cached_value
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
            "anyOf": [
                get_type_repr(param, module_ns, short_repr) for param in tp.__args__
            ]
        }
    # Handle regular unions and user aliases (Union[int, float], Number = int | float)
    if hasattr(tp, "__origin__"):
        origin: Any = tp.__origin__
        # print(origin)
        if origin is typing.Union:
            return {
                "anyOf": [
                    get_type_repr(param, module_ns, short_repr) for param in tp.__args__
                ]
            }
        elif origin in (list, typing.List):
            return {
                "structure_type": "list",
                "items": get_type_repr(tp.__args__[0], module_ns, short_repr),
            }
        elif origin in (dict, typing.Dict):
            return {
                "structure_type": "dict",
                "items": get_type_repr(tp.__args__[1], module_ns, short_repr),
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

    # Get absolute and relative file paths
    abs_file_path = os.path.abspath(file_path)
    try:
        rel_file_path = os.path.relpath(abs_file_path, os.getcwd())
    except ValueError:
        # If on different drives on Windows, use absolute path
        rel_file_path = abs_file_path

    def _add_type_recursive(t: Any):
        """Internal recursive function to build types_dict."""

        # Skip types that have already been processed
        if t in found_types_set:
            return
        found_types_set.add(t)

        # Skip types that derive from our special class MultipleOutputs
        if (
            inspect.isclass(t)
            and issubclass(t, MultipleOutputs)
            and t is not MultipleOutputs
        ):
            return

        # Special handling for typing.Any
        if t is typing.Any:
            if "Any" not in types_dict:
                types_dict["Any"] = {"kind": "builtin", "_class": t}
            return

        # Handle types.UnionType (int | float syntax) - must come before builtin check
        if isinstance(t, types.UnionType):
            # Recursively add each constituent type of the union
            for arg in t.__args__:
                _add_type_recursive(arg)
            return

        # Cached types (detected by _is_cached_type marker)
        if inspect.isclass(t) and hasattr(t, "_is_cached_type"):
            # Try to find the name in the module namespace first
            type_name = None
            for name, val in module_ns.items():
                if val is t and name.isidentifier():
                    type_name = name
                    break

            # If not found in module_ns, use the class's __name__
            if type_name is None:
                type_name = t.__name__

            if type_name not in types_dict:
                types_dict[type_name] = {
                    "kind": "cached",
                    "_class": t,
                    "category": os.path.splitext(rel_file_path)[0]
                    .replace(os.sep, "/")
                    .split("/"),
                }
            return

        # Builtin type
        if inspect.isclass(t) and t.__module__ == "builtins":
            tname = t.__name__
            if tname not in types_dict:
                types_dict[tname] = {"kind": "builtin", "_class": t}

        # User Model types(detected by derivation from our special UserModel class)
        elif inspect.isclass(t) and issubclass(t, UserModel) and t is not UserModel:
            for name, val in module_ns.items():
                if val is t and name.isidentifier():
                    if name not in types_dict:
                        entry = {
                            "kind": "user_model",
                            "_class": t,
                            "category": os.path.splitext(rel_file_path)[0]
                            .replace(os.sep, "/")
                            .split("/"),
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

        # Throw error on other user classes (not derived from UserModel)
        elif inspect.isclass(t):
            for name, val in module_ns.items():
                if val is t and name.isidentifier():
                    raise ValueError(
                        f"Class '{name}' is not derived from UserModel. "
                        f"All user-defined classes must inherit from UserModel."
                    )

        # Lists and dicts of user-defined types (e.g., list[int], dict[str, float])
        if hasattr(t, "__origin__") and hasattr(t, "__args__"):
            origin = getattr(t, "__origin__", None)
            # We only expect list/typing.List and dict/typing.Dict here; other generics should be handled above
            if origin in (list, typing.List):
                for arg in getattr(t, "__args__", ()):
                    _add_type_recursive(arg)
            elif origin in (dict, typing.Dict):
                for arg in getattr(t, "__args__", ()):
                    _add_type_recursive(arg)
            else:
                raise ValueError(f"No way to build a schema for this type: {origin}")

    _add_type_recursive(tp)
    return types_dict
