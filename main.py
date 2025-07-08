from collections.abc import Set
import sys
import importlib
import inspect
import typing
from typing import List, Dict, Any
from types import ModuleType


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

    # Create a set for all types used in the relevant function annotations
    all_types: Set[str] = set()

    # Find all functions in the module
    print(f"Functions in {module_filepath}:")  
    module_ns: Dict[str, Any] = vars(module)
    funcs_dict = {name: obj for name, obj in inspect.getmembers(module, inspect.isfunction) if obj.__module__ == module_name}
    
    for name, obj in funcs_dict.items():
        if obj.__module__ == module_name:
            sig = inspect.signature(obj)
            type_hints = typing.get_type_hints(obj, module_ns, module_ns)
            params = []
            for param in sig.parameters:
                ann = type_hints.get(param, sig.parameters[param].annotation)
                if ann is inspect.Parameter.empty:
                    raise FunctionNotTypedError(f"Parameter {param} has no annotation")
                else:
                    ann_str = get_type_repr(ann, module_ns, short_repr=True)
                    # Only treat as alias if not a class
                    if inspect.isclass(ann):
                        class_expansion = get_class_expansion(ann, module_ns)
                        if class_expansion:
                            all_types.add(class_expansion)
                        else:
                            all_types.add(get_type_repr(ann, module_ns, short_repr=False))
                    else:
                        alias_expansion = get_alias_expansion(ann, module_ns)
                        if alias_expansion:
                            all_types.add(alias_expansion)
                        else:
                            all_types.add(get_type_repr(ann, module_ns, short_repr=False))
                params.append(f"{param}: {ann_str}")
            ret_ann = type_hints.get('return', sig.return_annotation)
            if ret_ann is inspect.Signature.empty:
                raise FunctionNotTypedError(f"Function {name} has no return annotation")
            else:
                return_type = get_type_repr(ret_ann, module_ns, short_repr=True)
                if inspect.isclass(ret_ann):
                    class_expansion = get_class_expansion(ret_ann, module_ns)
                    if class_expansion:
                        all_types.add(class_expansion)
                    else:
                        all_types.add(get_type_repr(ret_ann, module_ns, short_repr=False))
                else:
                    alias_expansion = get_alias_expansion(ret_ann, module_ns)
                    if alias_expansion:
                        all_types.add(alias_expansion)
                    else:
                        all_types.add(get_type_repr(ret_ann, module_ns, short_repr=False))
            print(f"- {name}({', '.join(params)}) -> {return_type}")
    if all_types:
        print("\nTypes used:")
        for t in sorted(all_types):
            print(f"- {t}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py <filename>")
        sys.exit(1)
    module_filepath: str = sys.argv[1]
    analyze_module(module_filepath)
