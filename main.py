import os
import sys
from analyze_file import analyze_module
from devtools import debug as d

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py <filename or directory>")
        sys.exit(1)
    target_path: str = sys.argv[1]

    # If it's a directory, recursively find all .py files in it
    if os.path.isdir(target_path):
        # Recursively find all .py files in the directory
        py_files = []
        for root, dirs, files in os.walk(target_path):
            for file in files:
                if file.endswith(".py"):
                    py_files.append(os.path.join(root, file))

    # If it's a single file, add it to the list
    else:
        py_files = [target_path]

    # Analyze each file
    for py_file in py_files:
        print(f"\nAnalyzing {py_file}:")
        # Add the base directory to sys.path
        base_dir = os.path.dirname(os.path.abspath(target_path))
        if base_dir not in sys.path:
            sys.path.insert(0, base_dir)
        # Calculate relative path from base directory
        rel_path = os.path.relpath(py_file, base_dir)
        module_name = str(rel_path.replace(".py", "").replace(os.sep, "."))
        functions_info, types_dict = analyze_module(module_name)
        d(functions_info)
        d(types_dict)
