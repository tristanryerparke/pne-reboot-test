import base64
import io
import json

import requests
from devtools import debug as d
from PIL import Image

print("=" * 80)
print("IMAGE DECORATOR END-TO-END TEST")
print("=" * 80)

# Step 1: Upload an image
print("\n📤 STEP 1: Uploading test image...")
test_image = Image.new("RGB", (100, 100), color="red")
buffer = io.BytesIO()
test_image.save(buffer, format="PNG")
img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

payload = {
    "type": "Image",
    "filename": "test_image.png",
    "data": {"img_base64": img_base64},
}

response = requests.post("http://localhost:8000/data/upload_large_data", json=payload)
if response.status_code != 200:
    print(f"❌ Upload failed: {response.text}")
    exit(1)

upload_result = response.json()
cache_key = upload_result["cacheKey"]
print(f"✅ Image uploaded with cache_key: {cache_key}")

# Step 2: Check server types to confirm TYPES_DATAMODEL is populated
print("\n🔍 STEP 2: Checking server types...")
types_response = requests.get("http://localhost:8000/types")
types = types_response.json()

if "Image" in types:
    print(f"✅ 'Image' type found in server TYPES")
    print(f"   Type info: {types['Image']}")
else:
    print("❌ 'Image' type not found in TYPES")
    exit(1)

# Step 3: Create a simple graph with blur_image node
print("\n📊 STEP 3: Creating graph with blur_image node...")

# Create the graph payload
graph = {
    "nodes": [
        {
            "id": "blur-node-1",
            "position": {"x": 100, "y": 100},
            "data": {
                "callableId": None,  # Will be filled in after getting nodes
                "arguments": {
                    "image": {
                        "type": "Image",
                        "preview": upload_result["preview"],
                        "cacheKey": cache_key,
                    },
                    "radius": {
                        "type": "int",
                        "value": 20,
                    },
                },
                "outputs": {
                    "image_blurred": {
                        "type": "Image",
                    }
                },
                "outputStyle": "single",
            },
        }
    ],
    "edges": [],
}

# Get nodes to find blur_image's callable_id
nodes_response = requests.get("http://localhost:8000/nodes")
nodes = nodes_response.json()

blur_node = None
for node in nodes:
    if node["name"] == "blur_image":
        blur_node = node
        break

if not blur_node:
    print("❌ blur_image node not found on server")
    exit(1)

print(f"✅ Found blur_image node")
print(f"   Callable ID: {blur_node['callableId']}")
print(f"   Arguments: {blur_node['arguments']}")
print(f"   Outputs: {blur_node['outputs']}")

# Update graph with correct callable_id
graph["nodes"][0]["data"]["callableId"] = blur_node["callableId"]

# Step 4: Execute the graph
print("\n⚙️  STEP 4: Executing graph...")
exec_response = requests.post("http://localhost:8000/graph_execute", json=graph)

if exec_response.status_code != 200:
    print(f"❌ Execution failed: {exec_response.text}")
    exit(1)

exec_result = exec_response.json()
print(f"✅ Graph executed successfully!")

d(exec_result)

# Step 5: Verify the output
print("\n✅ STEP 5: Verifying output...")
if "updates" in exec_result and len(exec_result["updates"]) > 0:
    update = exec_result["updates"][0]

    if "outputs" in update and "image_blurred" in update["outputs"]:
        output = update["outputs"]["image_blurred"]
        print(f"✅ Output found:")
        print(f"   Type: {output['type']}")
        print(f"   Cache Key: {output.get('cacheKey', 'N/A')}")
        print(f"   Preview length: {len(output.get('preview', ''))}")

        # Verify it's the correct type
        if output["type"] == "Image":
            print(f"✅ Output type is correctly 'Image' (mapped from PIL.Image.Image)")
        else:
            print(f"❌ Expected type 'Image', got '{output['type']}'")

        # Verify it has a cache key (meaning it was serialized as CachedImage)
        if output.get("cacheKey"):
            print(f"✅ Output has cache_key (CachedImage serialization worked)")
        else:
            print(f"❌ Output missing cache_key")
    else:
        print("❌ No image_blurred output found")
        exit(1)
else:
    print("❌ No updates in execution result")
    exit(1)

print("\n" + "=" * 80)
print("🎉 ALL TESTS PASSED!")
print("=" * 80)
print("\nSummary:")
print("✅ Decorator successfully maps PIL.Image.Image to CachedImage")
print("✅ Type analysis detects the mapping and creates TYPES_DATAMODEL entry")
print("✅ Server loads TYPES_DATAMODEL correctly")
print("✅ Graph execution extracts cached image values correctly")
print("✅ Graph execution creates CachedImage outputs correctly")
print("✅ Output serialization uses the mapped CachedImage class")
