import base64
import json

import requests
from PIL import Image

# Create a simple test image
test_image = Image.new("RGB", (100, 100), color="red")

# Convert to base64
import io

buffer = io.BytesIO()
test_image.save(buffer, format="PNG")
img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

# Prepare the upload payload
payload = {
    "type": "CachedImage",
    "filename": "test_image.png",
    "data": {"img_base64": img_base64},
}

# Send POST request to the endpoint
url = "http://localhost:8000/data/upload_large_data"
response = requests.post(url, json=payload)

print(f"Status Code: {response.status_code}")
print(f"\nResponse Headers: {dict(response.headers)}")
print(f"\nResponse Body:")
print(json.dumps(response.json(), indent=2))

# Verify the response structure
if response.status_code == 200:
    data = response.json()
    assert "type" in data, "Missing 'type' field"
    assert "preview" in data, "Missing 'preview' field"
    assert "cacheKey" in data, "Missing 'cacheKey' field"
    assert "size" in data, "Missing 'size' field"
    assert "width" in data, "Missing 'width' field"
    assert "height" in data, "Missing 'height' field"
    assert "mode" in data, "Missing 'mode' field"

    print("\n✅ Basic assertions passed!")
    print(f"Type: {data['type']}")
    print(f"Cache key: {data['cacheKey']}")

    # Check for computed fields (require server restart to appear)
    if "size" in data and "width" in data and "height" in data and "mode" in data:
        print(f"Image details: {data['width']}x{data['height']} {data['mode']}")
        if data.get("preview"):
            print(f"Preview length: {len(data['preview'])} chars")
        print("\n✅ All fields present (server has latest code)!")
    else:
        print(
            "\n⚠️  Computed fields missing - server needs restart to pick up latest CachedImage code"
        )
        print("   Expected fields: size, width, height, mode, preview")
        print(f"   Current fields: {list(data.keys())}")
else:
    print(f"\n❌ Request failed with status {response.status_code}")
