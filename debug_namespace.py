import importlib.util
import sys

# Import the module the same way analyze_file does
module_name = "basic_blur"
file_path = "examples/images/basic_blur.py"

spec = importlib.util.spec_from_file_location(module_name, file_path)
module = importlib.util.module_from_spec(spec)
sys.modules[module_name] = module
spec.loader.exec_module(module)

# Check what's in the namespace
print("Module namespace items related to Image:")
for name, val in vars(module).items():
    if "image" in name.lower() or "cached" in name.lower():
        print(f"  {name}: {val}")

# Check the function signature
import inspect
import typing

func = module.blur_image
sig = inspect.signature(func)
type_hints = typing.get_type_hints(func, func.__globals__, func.__globals__)

print("\nFunction type hints:")
for name, hint in type_hints.items():
    print(f"  {name}: {hint}")
    if hasattr(hint, "_cached_type_mapping"):
        print(f"    -> has _cached_type_mapping: {hint._cached_type_mapping}")
    if hasattr(hint, "__name__"):
        print(f"    -> __name__: {hint.__name__}")

# Try to find the type name in module namespace
print("\nLooking for type in module namespace:")
image_type = type_hints["image"]
for name, val in func.__globals__.items():
    if val is image_type and name.isidentifier():
        print(f"  Found as: {name}")
