import base64
import io

import requests
from devtools import debug as d
from PIL import Image

print("=" * 60)
print("Testing Image Upload")
print("=" * 60)

# Create a test image
test_image = Image.new("RGB", (100, 100), color="blue")
buffer = io.BytesIO()
test_image.save(buffer, format="PNG")
img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

# Upload with type="Image"
payload = {
    "type": "Image",
    "filename": "test_image.png",
    "data": {"img_base64": img_base64},
}

print("\nUploading with type='Image'...")
response = requests.post("http://localhost:8000/data/upload_large_data", json=payload)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    print("✅ Upload successful!")
    d(result)
else:
    print("❌ Upload failed!")
    try:
        d(response.json())
    except:
        print(response.text)
