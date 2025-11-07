import importlib
import importlib.util
import inspect
import os
import sys
from types import ModuleType
from typing import Any, Dict, List, Set, Tuple

from app.analysis.functions_analysis import analyze_function
from app.analysis.types_analysis import add_type_to_types_dict


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


def analyze_file(
    file_path: str, types_dict: Dict[str, Dict[str, Any]], found_types: Set[Any]
):
    """Analyze a single file for functions that can be turned into nodes.
    Also collects the input and output types of the functions and returns them.

    Args:
        file_path: The actual file path to the Python file to analyze.
        types_dict: Accumulated dictionary of type information across all files
        found_types: Set of types already processed for deduplication

    Returns:
        A dictionary of function information.
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
        return {}

    # Get the namespace of the module
    module_ns: Dict[str, Any] = vars(module)

    # Find all functions in the module
    funcs = {
        name: obj
        for name, obj in inspect.getmembers(module, inspect.isfunction)
        if obj.__module__ == module_name or obj.__module__ == module.__name__
    }

    functions_info: Dict[str, Dict[str, Any]] = {}

    # Analyze each function and construct a dictionary of function information
    for func_name, func_obj in funcs.items():
        func_entry = analyze_function(
            func_name, func_obj, file_path, module_ns, types_dict, found_types
        )
        # Add the function to the functions_info dictionary
        functions_info[func_name] = func_entry

    return functions_info


def analyze_files(
    py_files: List[str], base_dir: str
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Analyze multiple Python files and accumulate results.

    Types are deduplicated across files, but functions are not.

    Args:
        py_files: List of Python file paths to analyze
        base_dir: Base directory for calculating module names

    Returns:
        Tuple of (accumulated_functions_info, accumulated_types_dict)
    """
    # Initialize accumulation structures
    found_types: Set[Any] = set()
    accumulated_functions = {}
    accumulated_types = {}

    # Add the base directory to sys.path
    if base_dir not in sys.path:
        sys.path.insert(0, base_dir)

    for py_file in py_files:
        print(f"Analyzing {py_file}:")

        try:
            # Pass accumulated types_dict and found_types to each file analysis
            functions_info = analyze_file(py_file, accumulated_types, found_types)

            # Add all functions (no deduplication for functions)
            accumulated_functions.update(functions_info)

        except Exception as e:
            print(f"Error analyzing {py_file}: {e}")

    return accumulated_functions, accumulated_types


def get_all_functions_and_types(search_path: str):
    """Convenience function to find and analyze all Python files in a path.

    Args:
        search_path: Path to a file or directory to analyze

    Returns:
        Tuple of (all_functions, all_types) dictionaries
    """
    py_files = find_python_files(search_path)
    all_functions, all_types = analyze_files(py_files, search_path)
    return all_functions, all_types
