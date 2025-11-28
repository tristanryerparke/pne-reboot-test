import base64
import io
import json

from PIL import Image

from examples.images.basic_blur import CachedImage

# Create a test image
test_image = Image.new("RGB", (100, 100), color="blue")

# Create CachedImage instance
cached_img = CachedImage(type="CachedImage", value=test_image)

print("CachedImage instance created")
print(f"Value: {cached_img.value}")
print(f"Size: {cached_img.size}")
print(f"Width: {cached_img.width}")
print(f"Height: {cached_img.height}")
print(f"Mode: {cached_img.mode}")

# Serialize it
serialized = cached_img.model_dump()
print("\nSerialized:")
print(json.dumps(serialized, indent=2))

# Check what fields are included
print(f"\nFields in serialized data: {list(serialized.keys())}")
