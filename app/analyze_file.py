import importlib
import importlib.util
import inspect
import os
import sys
import typing
from types import ModuleType
from typing import Any, Dict, List, Tuple

from pydantic import create_model

from app.schema import MultipleOutputs


def create_request_model(func, module_ns):
    """Create a Pydantic model for function parameters to ensure JSON body usage."""
    sig = inspect.signature(func)
    type_hints = typing.get_type_hints(func, module_ns, module_ns)

    fields = {}
    for param_name, param in sig.parameters.items():
        param_type = type_hints.get(param_name, str)
        if param.default != inspect.Parameter.empty:
            fields[param_name] = (param_type, param.default)
        else:
            fields[param_name] = (param_type, ...)

    return create_model(f"NodeParams_{func.__name__.title()}", **fields)


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


def analyze_file(file_path: str):
    """Analyze a file for functions that can be turned into nodes.
    Also collects the input and output types of the functions and returns them.

    Args:
        file_path: The actual file path to the Python file to analyze.
        Example: 'folder_with_func/file_with_func_pydantic.py'

    Returns:
        A tuple of two dictionaries:
        - functions_info: A dictionary of function information.
        - types_dict: A dictionary of type information.
    """

    # Import the module from file path
    module_name = os.path.splitext(os.path.basename(file_path))[0]
    try:
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load spec for {file_path}")

        module: ModuleType = importlib.util.module_from_spec(spec)
        # Add to sys.modules to handle potential circular imports
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
    except Exception as e:
        print(f"Module '{file_path}' could not be imported: {e}")
        return {}, {}

    # Get the namespace of the module
    module_ns: Dict[str, Any] = vars(module)

    # Find all functions in the module
    funcs = {
        name: obj
        for name, obj in inspect.getmembers(module, inspect.isfunction)
        if obj.__module__ == module_name or obj.__module__ == module.__name__
    }
    types_dict: Dict[str, Dict[str, Any]] = {}  # Dictionary to store type information
    functions_info: Dict[str, Dict[str, Any]] = {}
    seen_types = set()  # Avoids adding the same type multiple times

    def add_type_to_types_dict(tp):
        """Add a type to the types_dict"""
        if tp in seen_types:
            return
        seen_types.add(tp)

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
        # User class
        elif inspect.isclass(tp):
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
                            add_type_to_types_dict(field_type)
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
                                add_type_to_types_dict(arg)
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
        func_entry["category"] = (
            os.path.splitext(file_path)[0].replace(os.sep, ".").split(".")
        )  # Convert file path to module-like category

        # Create request model for the function
        func_entry["request_model"] = create_request_model(func_obj, module_ns)

        # Get the docstring of the function
        doc = inspect.getdoc(func_obj)
        if doc is not None:
            func_entry["doc"] = doc

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
            add_type_to_types_dict(ann)
        func_entry["arguments"] = arguments

        # Handle return type and detect multiple outputs
        ret_ann = type_hints.get("return", sig.return_annotation)
        if ret_ann is inspect.Signature.empty:
            raise Exception(f"Function {func_name} has no return annotation")

        # Detect output fields from MultipleOutputs return type
        func_entry["outputs"] = {}

        if inspect.isclass(ret_ann) and issubclass(ret_ann, MultipleOutputs):
            # Get the model fields using Pydantic's model_fields
            func_entry["output_style"] = "multiple"
            for field_name, field_info in ret_ann.model_fields.items():
                if field_info.annotation is not None:
                    output_entry = {
                        "type": get_type_repr(
                            field_info.annotation, module_ns, short_repr=True
                        )
                    }
                    func_entry["outputs"][field_name] = output_entry
                    add_type_to_types_dict(field_info.annotation)
        else:
            func_entry["output_style"] = "single"
            func_entry["outputs"]["return"] = {
                "type": get_type_repr(ret_ann, module_ns, short_repr=True)
            }

        add_type_to_types_dict(ret_ann)

        # Add the function to the functions_info dictionary
        functions_info[func_name] = func_entry

    return functions_info, types_dict


def analyze_files(
    py_files: List[str], base_dir: str
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Analyze multiple Python files and accumulate results without duplicates.

    Args:
        py_files: List of Python file paths to analyze
        base_dir: Base directory for calculating module names

    Returns:
        Tuple of (accumulated_functions_info, accumulated_types_dict)
    """
    accumulated_functions = {}
    accumulated_types = {}

    # Add the base directory to sys.path
    if base_dir not in sys.path:
        sys.path.insert(0, base_dir)

    for py_file in py_files:
        print(f"Analyzing {py_file}:")

        try:
            functions_info, types_dict = analyze_file(py_file)

            # Merge functions_info, avoiding duplicates
            for func_key, func_data in functions_info.items():
                if func_key not in accumulated_functions:
                    accumulated_functions[func_key] = func_data

            # Merge types_dict, avoiding duplicates
            for type_key, type_data in types_dict.items():
                if type_key not in accumulated_types:
                    accumulated_types[type_key] = type_data

        except Exception as e:
            print(f"Error analyzing {py_file}: {e}")

    return accumulated_functions, accumulated_types


def find_python_files(target_path: str) -> List[str]:
    """Find all Python files to analyze.

    Args:
        target_path: Path to a file or directory

    Returns:
        List of Python file paths to analyze
    """
    py_files = []

    if os.path.isdir(target_path):
        # Recursively find all .py files in the directory
        for root, dirs, files in os.walk(target_path):
            for file in files:
                if file.endswith(".py"):
                    py_files.append(os.path.join(root, file))
    else:
        # Single file
        py_files = [target_path]

    return py_files


def get_all_functions_and_types(search_path: str):
    py_files = find_python_files(search_path)
    all_functions, all_types = analyze_files(py_files, search_path)
    return all_functions, all_types
