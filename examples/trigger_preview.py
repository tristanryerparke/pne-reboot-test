import base64
import io
import json
from pathlib import Path

import requests
from PIL import Image

# Create a simple test image
img = Image.new("RGB", (100, 100), color="blue")
img_buffer = io.BytesIO()
img.save(img_buffer, format="PNG")
img_base64 = base64.b64encode(img_buffer.getvalue()).decode()

# Upload the image
upload_payload = {
    "type": "CachedImage",
    "filename": "test.png",
    "data": {"img_base64": img_base64},
}

print("Uploading image...")
upload_response = requests.post(
    "http://localhost:8000/data/upload_large_data", json=upload_payload
)
print(f"Upload status: {upload_response.status_code}")
upload_result = upload_response.json()
print(f"Upload response keys: {list(upload_result.keys())}")

if upload_response.status_code != 200:
    print(f"ERROR: {upload_result}")
    exit(1)


print(f"Cache key: {upload_result['cacheKey']}")
print(f"Has preview: {'preview' in upload_result}")
print(f"Size: {upload_result.get('size')}")

# Retrive callable id
functions_response = requests.get("http://localhost:8000/nodes")
functions_response.raise_for_status()
functions = functions_response.json()
callable_id = functions[0]["callableId"]

# Execute blur_image
graph_payload = {
    "nodes": [
        {
            "id": "node1",
            "position": {"x": 0, "y": 0},
            "data": {
                "callableId": callable_id,
                "arguments": {
                    "image": {
                        "type": "CachedImage",
                        "cacheKey": upload_result["cacheKey"],
                    },
                    "radius": {"type": "int", "value": 20},
                },
                "outputs": {"image_blurred": {"type": "CachedImage"}},
                "outputStyle": "single",
            },
        }
    ],
    "edges": [],
}

print("\nExecuting blur_image graph...")
execute_response = requests.post(
    "http://localhost:8000/graph_execute", json=graph_payload
)
print(f"Execution status: {execute_response.status_code}")
if execute_response.status_code == 200:
    execute_result = execute_response.json()
    print(f"Execution result keys: {list(execute_result.keys())}")

    if "updates" in execute_result:
        updates = execute_result["updates"]
        print(f"Number of updates: {len(updates)}")

        if len(updates) > 0:
            node_update = updates[0]
            print(f"Node update keys: {list(node_update.keys())}")

            if "outputs" in node_update and "image_blurred" in node_update["outputs"]:
                blurred = node_update["outputs"]["image_blurred"]
                print(f"Blurred image keys: {list(blurred.keys())}")
                print(f"Blurred type: {blurred.get('type')}")

                if "value" in blurred:
                    blurred_value = blurred["value"]
                    print(f"Blurred value keys: {list(blurred_value.keys())}")
                    print(f"Blurred cache key: {blurred_value.get('cacheKey')}")
                    print(f"Blurred has preview: {'preview' in blurred_value}")
                    print(f"Blurred size: {blurred_value.get('size')}")
                    print("\n✓ End-to-end test passed!")
            else:
                print(f"ERROR: No image_blurred in outputs")
else:
    print(f"ERROR: {execute_response.text}")
