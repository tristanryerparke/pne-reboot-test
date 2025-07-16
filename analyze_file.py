import sys
import importlib
import inspect
import typing
from typing import Dict, Any
from types import ModuleType


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


def analyze_module(module_filepath: str):
    """Analyze a file for functions that can be turned into nodes.
    Also collects the input and output types of the functions and returns them.

    Args:
        module_filepath: The path to the module to analyze.
        Example: 'my_folder.my_module.py'

    Returns:
        A tuple of two dictionaries:
        - functions_info: A dictionary of function information.
        - types_dict: A dictionary of type information.
    """

    # Import the module
    module_name: str = module_filepath.replace(".py", "")
    try:
        module: ModuleType = importlib.import_module(module_name)
    except ModuleNotFoundError:
        print(f"Module '{module_name}' not found.")
        sys.exit(1)

    # Get the namespace of the module
    module_ns: Dict[str, Any] = vars(module)

    # Find all functions in the module
    funcs = {
        name: obj
        for name, obj in inspect.getmembers(module, inspect.isfunction)
        if obj.__module__ == module_name
    }
    types_dict: Dict[str, Dict[str, Any]] = {}  # Dictionary to store type information
    functions_info: Dict[str, Dict[str, Any]] = {}
    seen_types = set()  # Avoids adding the same type multiple times

    def add_type_to_types_dict(tp):
        """Add a type to the types_dict"""
        if tp in seen_types:
            return
        seen_types.add(tp)
        # Builtin
        if inspect.isclass(tp) and tp.__module__ == "builtins":
            tname = tp.__name__

            if tname not in types_dict:
                types_dict[tname] = {"class": tp, "kind": "builtin"}
        # User class
        elif inspect.isclass(tp):
            for name, val in module_ns.items():
                if val is tp and name.isidentifier():
                    entry = {
                        "class": tp,
                        "kind": "user_model",
                        "category": module_filepath.split("."),
                    }
                    if hasattr(tp, "__annotations__") and tp.__annotations__:
                        entry["properties"] = {
                            field: get_type_repr(ftype, module_ns, short_repr=True)
                            for field, ftype in tp.__annotations__.items()
                        }
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
                            "category": module_filepath.split("."),
                        }
                        break
        # Recursively add types for generics/aliases
        if hasattr(tp, "__origin__") and hasattr(tp, "__args__"):
            for arg in tp.__args__:
                add_type_to_types_dict(arg)

    # Analyze each function and construct a dictionary of function information
    for func_name, func_obj in funcs.items():
        sig = inspect.signature(func_obj)
        type_hints = typing.get_type_hints(func_obj, module_ns, module_ns)
        func_entry: Dict[str, Any] = {}
        func_entry["callable"] = func_obj
        func_entry["category"] = module_filepath.split(
            "."
        )  # This lets us sort in the frontend

        # Get the docstring of the function
        doc = inspect.getdoc(func_obj)
        if doc is not None:
            func_entry["doc"] = doc

        # Get the input arguments of the function
        arguments = {}
        for arg in sig.parameters.values():
            ann = type_hints.get(arg.name, arg.annotation)
            if ann is inspect.Parameter.empty:
                raise Exception(f"Parameter {arg.name} has no annotation")
            arg_entry = {"type": get_type_repr(ann, module_ns, short_repr=True)}
            if arg.default is not inspect.Parameter.empty:
                arg_entry["default_value"] = arg.default
            arguments[arg.name] = arg_entry
            add_type_to_types_dict(ann)
        func_entry["arguments"] = arguments

        # Handle return type
        ret_ann = type_hints.get("return", sig.return_annotation)
        if ret_ann is inspect.Signature.empty:
            raise Exception(f"Function {func_name} has no return annotation")
        func_entry["return"] = {
            "type": get_type_repr(ret_ann, module_ns, short_repr=True)
        }
        add_type_to_types_dict(ret_ann)

        # Add the function to the functions_info dictionary
        functions_info[func_name] = func_entry

    return functions_info, types_dict
