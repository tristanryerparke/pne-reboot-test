import importlib.util
import inspect
import sys
import typing

from app.analysis.types_analysis import analyze_type

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

print("Type hints:")
for name, hint in type_hints.items():
    print(f"  {name}: {hint}")

# Analyze the image type
print("\nAnalyzing 'image' parameter type:")
image_type = type_hints["image"]
print(f"Type object: {image_type}")
print(f"Type __name__: {image_type.__name__}")
print(f"Has _cached_type_mapping: {hasattr(image_type, '_cached_type_mapping')}")

types_dict, types_datamodel = analyze_type(image_type, file_path, func.__globals__)

print("\nResult from analyze_type:")
print(f"types_dict: {types_dict}")
print(f"types_datamodel: {types_datamodel}")
