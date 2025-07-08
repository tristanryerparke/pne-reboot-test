from collections.abc import Set
import sys
import importlib
import inspect
import typing
from typing import List, Dict, Any
from types import ModuleType
from devtools import debug as d


def get_type_repr(tp, module_ns, short_repr=True):
    """
        Prints a representation of a type.
        Recurses until found types are all builtin types.
    """
    # If short_repr is True, show just the alias name if available
    if short_repr:
        for name, val in module_ns.items():
            if val is tp and name.isidentifier():
                return name
    # Handle Union and generics
    if hasattr(tp, '__origin__'):
        origin: Any = tp.__origin__
        if origin is typing.Union:
            args = ', '.join(get_type_repr(arg, module_ns, short_repr) for arg in tp.__args__)
            return f"Union[{args}]"
        else:
            args = ', '.join(get_type_repr(arg, module_ns, short_repr) for arg in tp.__args__)
            return f"{origin.__name__}[{args}]"
    # Handle builtin types
    if hasattr(tp, '__name__'):
        return tp.__name__
    # Fallback to str
    return str(tp)

def get_alias_expansion(type, module_ns):
    """
        Prints a representation of a user-defined alias with like (AliasName: Union[Type1, Type2]).
        Recurses until found types are all builtin types.
    """
    for name, val in module_ns.items():
        if val is type and name.isidentifier() and not inspect.isclass(val):
            expansion = get_type_repr(type, module_ns, short_repr=False)
            return f"{name}(User Alias): {expansion}"
    return None 

def get_class_expansion(type, module_ns):
    """
        Prints a representation of a user-defined class with its fields and their types.
        Recurses until found types are all builtin types.
    """
    for name, val in module_ns.items():
        if inspect.isclass(val) and val is type:
            if hasattr(val, '__annotations__') and val.__annotations__:
                fields: List[str] = []
                for field, ftype in val.__annotations__.items():
                    fields.append(f"{field}: {get_type_repr(ftype, module_ns, short_repr=True)}")
                return f"{name}(User Class): {', '.join(fields)}"
    return None

class FunctionNotTypedError(Exception):
    """
        Raised when a function is not typed.
    """
    pass

def analyze_module(module_filepath: str):
    """
        Parse file to read potenial nodes from.
    """
    module_name: str = module_filepath.replace('.py', '')

    # Try to import the module
    try:    
        module: ModuleType = importlib.import_module(module_name)
    except ModuleNotFoundError:
        print(f"Module '{module_name}' not found.")
        sys.exit(1)

    module_ns: Dict[str, Any] = vars(module)
    funcs_dict = {name: obj for name, obj in inspect.getmembers(module, inspect.isfunction) if obj.__module__ == module_name}
    types_dict: Dict[str, Dict[str, Any]] = {}
    functions_dict: Dict[str, Dict[str, Any]] = {}
    builtin_types = set()
    seen_types = set()

    def add_type_to_types_dict(tp):
        # Only add if not already added
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
                    types_dict[name] = {'class': tp, 'kind': 'user_class'}
                    break
        # User alias
        else:
            for name, val in module_ns.items():
                if val is tp and name.isidentifier() and type(val).__module__ != 'typing':
                    types_dict[name] = {'class': tp, 'kind': 'user_alias'}
                    break
        # Recursively add types for generics/aliases
        if hasattr(tp, '__origin__') and hasattr(tp, '__args__'):
            for arg in tp.__args__:
                add_type_to_types_dict(arg)

    for func_name, func_obj in funcs_dict.items():
        sig = inspect.signature(func_obj)
        type_hints = typing.get_type_hints(func_obj, module_ns, module_ns)
        func_entry = {
            'callable': func_obj,
        }
        doc = inspect.getdoc(func_obj)
        if doc:
            func_entry['doc'] = doc
        arguments = {}
        for param in sig.parameters.values():
            ann = type_hints.get(param.name, param.annotation)
            if ann is inspect.Parameter.empty:
                raise Exception(f"Parameter {param.name} has no annotation")
            arg_entry = {
                'type': ann
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
        func_entry['return'] = {'type': ret_ann}
        add_type_to_types_dict(ret_ann)
        functions_dict[func_name] = func_entry

    return functions_dict, types_dict

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py <filename>")
        sys.exit(1)
    module_filepath: str = sys.argv[1]
    funcs_dict, types_dict = analyze_module(module_filepath)
    d(funcs_dict)
    d(types_dict)
