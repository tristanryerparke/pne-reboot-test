import sys
import importlib
import inspect
import typing
from typing import Dict, Any
from types import ModuleType
from devtools import debug as d
import os


def get_type_repr(tp, module_ns, short_repr=True):
    """get a string representation of a type"""
    if short_repr:
        for name, val in module_ns.items():
            if val is tp and name.isidentifier():
                return name
    if hasattr(tp, '__origin__'):
        origin: Any = tp.__origin__
        if origin is typing.Union:
            args = ', '.join(get_type_repr(arg, module_ns, short_repr) for arg in tp.__args__)
            return f"Union[{args}]"
        else:
            args = ', '.join(get_type_repr(arg, module_ns, short_repr) for arg in tp.__args__)
            return f"{origin.__name__}[{args}]"
    if hasattr(tp, '__name__'):
        return tp.__name__
    return str(tp)

def analyze_module(module_filepath: str):
    """analyze a file for potential nodes"""
    module_name: str = module_filepath.replace('.py', '')
    try:    
        module: ModuleType = importlib.import_module(module_name)
    except ModuleNotFoundError:
        print(f"Module '{module_name}' not found.")
        sys.exit(1)

    module_ns: Dict[str, Any] = vars(module)
    funcs = {name: obj for name, obj in inspect.getmembers(module, inspect.isfunction) if obj.__module__ == module_name}
    types_dict: Dict[str, Dict[str, Any]] = {}
    functions_info: Dict[str, Dict[str, Any]] = {}
    seen_types = set()

    def add_type_to_types_dict(tp):
        if tp in seen_types:
            return
        seen_types.add(tp)
        # Builtin
        if inspect.isclass(tp) and tp.__module__ == 'builtins':
            tname = tp.__name__
            if tname not in types_dict:
                types_dict[tname] = {'class': tp, 'kind': 'builtin'}
        # User class
        elif inspect.isclass(tp):
            for name, val in module_ns.items():
                if val is tp and name.isidentifier():
                    entry = {'class': tp, 'kind': 'user_class'}
                    if hasattr(tp, '__annotations__') and tp.__annotations__:
                        entry['properties'] = {field: get_type_repr(ftype, module_ns, short_repr=True) for field, ftype in tp.__annotations__.items()}
                    types_dict[name] = entry
                    break
        # User alias (including typing.Union, etc. if defined as an alias in the module)
        else:
            for name, val in module_ns.items():
                if val is tp and name.isidentifier():
                    if not inspect.isclass(val):
                        types_dict[name] = {'class': tp, 'kind': 'user_alias'}
                        break
        # Recursively add types for generics/aliases
        if hasattr(tp, '__origin__') and hasattr(tp, '__args__'):
            for arg in tp.__args__:
                add_type_to_types_dict(arg)

    for func_name, func_obj in funcs.items():
        sig = inspect.signature(func_obj)
        type_hints = typing.get_type_hints(func_obj, module_ns, module_ns)
        func_entry: Dict[str, Any] = {}
        func_entry['callable'] = func_obj
        doc = inspect.getdoc(func_obj)
        if doc is not None:
            func_entry['doc'] = doc
        arguments = {}
        for param in sig.parameters.values():
            ann = type_hints.get(param.name, param.annotation)
            if ann is inspect.Parameter.empty:
                raise Exception(f"Parameter {param.name} has no annotation")
            arg_entry = {
                'type': get_type_repr(ann, module_ns, short_repr=True)
            }
            if param.default is not inspect.Parameter.empty:
                arg_entry['default_value'] = param.default
            arguments[param.name] = arg_entry
            add_type_to_types_dict(ann)
        func_entry['arguments'] = arguments
        # Handle return type
        ret_ann = type_hints.get('return', sig.return_annotation)
        if ret_ann is inspect.Signature.empty:
            raise Exception(f"Function {func_name} has no return annotation")
        func_entry['return'] = {'type': get_type_repr(ret_ann, module_ns, short_repr=True)}
        add_type_to_types_dict(ret_ann)
        functions_info[func_name] = func_entry

    return functions_info, types_dict

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py <filename or directory>")
        sys.exit(1)
    target_path: str = sys.argv[1]
    if os.path.isdir(target_path):
        # Recursively find all .py files in the directory
        py_files = []
        for root, dirs, files in os.walk(target_path):
            for file in files:
                if file.endswith('.py'):
                    py_files.append(os.path.join(root, file))
        for py_file in py_files:
            print(f"\nAnalyzing {py_file}:")
            py_as_module_name: str = py_file.replace('.py', '').replace('/', '.')
            functions_info, types_dict = analyze_module(py_as_module_name)
            d(functions_info)
            d(types_dict)
    else:
        functions_info, types_dict = analyze_module(target_path)
        d(functions_info)
        d(types_dict)
