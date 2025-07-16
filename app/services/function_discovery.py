import os
import sys
from typing import Dict, Any, Tuple
from .analyzer import analyze_module


def discover_functions(target_path: str) -> Tuple[Dict[str, Dict[str, Any]], Dict[str, Dict[str, Any]]]:
    """
    Discover functions in Python files, similar to main.py functionality.
    
    Args:
        target_path: Path to file or directory to analyze
        
    Returns:
        Tuple of (all_functions_info, all_types_dict) where:
        - all_functions_info: Dict mapping "module_name.function_name" to function info
        - all_types_dict: Dict of all discovered types
    """
    if os.path.isdir(target_path):
        py_files = []
        for root, dirs, files in os.walk(target_path):
            for file in files:
                if file.endswith(".py"):
                    py_files.append(os.path.join(root, file))
    else:
        py_files = [target_path]

    all_functions_info = {}
    all_types_dict = {}
    
    base_dir = os.path.dirname(os.path.abspath(target_path))
    if base_dir not in sys.path:
        sys.path.insert(0, base_dir)

    for py_file in py_files:
        rel_path = os.path.relpath(py_file, base_dir)
        module_name = str(rel_path.replace(".py", "").replace(os.sep, "."))
        
        try:
            functions_info, types_dict = analyze_module(module_name)
            
            # Prefix function names with module name for unique routing
            for func_name, func_info in functions_info.items():
                full_func_name = f"{module_name}.{func_name}"
                all_functions_info[full_func_name] = func_info
                
            # Merge type dictionaries
            all_types_dict.update(types_dict)
            
        except Exception as e:
            print(f"Failed to analyze {py_file}: {e}")
            continue
            
    return all_functions_info, all_types_dict