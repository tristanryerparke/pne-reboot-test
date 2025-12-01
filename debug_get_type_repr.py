import importlib.util
import sys
import typing

from app.analysis.types_analysis import get_type_repr

# Import the module the same way analyze_file does
module_name = "basic_blur"
file_path = "examples/images/basic_blur.py"

spec = importlib.util.spec_from_file_location(module_name, file_path)
module = importlib.util.module_from_spec(spec)
sys.modules[module_name] = module
spec.loader.exec_module(module)

# Get the function and its type hints
func = module.blur_image
type_hints = typing.get_type_hints(func, func.__globals__, func.__globals__)

# Test get_type_repr
print("Testing get_type_repr:")
image_type = type_hints["image"]
print(f"\nType: {image_type}")
print(f"Type __name__: {image_type.__name__}")
print(f"Has _cached_type_mapping: {hasattr(image_type, '_cached_type_mapping')}")

result = get_type_repr(image_type, func.__globals__, short_repr=True)
print(f"\nget_type_repr result: {result}")

# Check what's in the module namespace
print("\nModule namespace check:")
for name, val in func.__globals__.items():
    if val is image_type and name.isidentifier():
        print(f"  Found type as: '{name}'")
