import base64
import io

import requests
from devtools import debug as d
from PIL import Image

# Step 1: Start by analyzing the function to see if decorator is detected
print("=" * 60)
print("STEP 1: Analyzing basic_blur.py function")
print("=" * 60)

from app.analysis.utils import analyze_file

functions, callables, types, types_datamodel = analyze_file(
    "examples/images/basic_blur.py"
)

print("\n📊 Found functions:")
for func in functions:
    print(f"  - {func.name}")
    print(f"    Arguments: {func.arguments}")
    print(f"    Outputs: {func.outputs}")

print("\n📦 Found types:")
d(types)

print("\n🔗 Found types_datamodel mappings:")
d(types_datamodel)

# Step 2: Upload a test image to the server
print("\n" + "=" * 60)
print("STEP 2: Uploading test image to server")
print("=" * 60)

test_image = Image.new("RGB", (100, 100), color="blue")
buffer = io.BytesIO()
test_image.save(buffer, format="PNG")
img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

payload = {
    "type": "CachedImage",
    "filename": "test_blur.png",
    "data": {"img_base64": img_base64},
}

url = "http://localhost:8000/data/upload_large_data"
try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        upload_result = response.json()
        print(f"✅ Image uploaded successfully!")
        print(f"Cache key: {upload_result['cacheKey']}")
        d(upload_result)
    else:
        print(f"❌ Upload failed: {response.text}")
        exit(1)
except requests.exceptions.ConnectionError:
    print("❌ Server not running. Start it with:")
    print("   uv run fastapi dev app/server.py examples/")
    exit(1)

print("\n" + "=" * 60)
print("✅ All steps completed successfully!")
print("=" * 60)
