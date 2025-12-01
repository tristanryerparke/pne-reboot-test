from devtools import debug as d
from PIL import Image

print("Before decorator:")
print(
    f"hasattr(Image.Image, '_cached_type_mapping'): {hasattr(Image.Image, '_cached_type_mapping')}"
)

# Now import basic_blur which applies the decorator
import examples.images.basic_blur

print("\nAfter importing basic_blur:")
print(
    f"hasattr(Image.Image, '_cached_type_mapping'): {hasattr(Image.Image, '_cached_type_mapping')}"
)

if hasattr(Image.Image, "_cached_type_mapping"):
    print(f"_cached_type_mapping value: {Image.Image._cached_type_mapping}")

# Now test the analysis
from app.analysis.utils import analyze_file

print("\nAnalyzing basic_blur.py:")
functions, callables, types, types_datamodel = analyze_file(
    "examples/images/basic_blur.py"
)

print("\nTypes found:")
d(types)

print("\nTypes datamodel found:")
d(types_datamodel)
