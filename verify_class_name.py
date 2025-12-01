from PIL.Image import Image as PILImageClass

from app.analysis.decorators import map_to_cached_type
from examples.images.cached_image import CachedImage

print("Before decorator:")
print(f"  __name__: {PILImageClass.__name__}")
print(f"  has _cached_type_mapping: {hasattr(PILImageClass, '_cached_type_mapping')}")

PILImageClass = map_to_cached_type(CachedImage)(PILImageClass)

print("\nAfter decorator:")
print(f"  __name__: {PILImageClass.__name__}")
print(f"  has _cached_type_mapping: {hasattr(PILImageClass, '_cached_type_mapping')}")
print(f"  _cached_type_mapping: {PILImageClass._cached_type_mapping}")
