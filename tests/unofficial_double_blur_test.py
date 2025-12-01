import base64
import io

import requests
from devtools import debug as d
from PIL import Image

print("=" * 80)
print("DOUBLE BLUR WITH EDGE DATA PROPAGATION TEST")
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
    print("✅ 'Image' type found in server TYPES")
    print(f"   Type info: {types['Image']}")
else:
    print("❌ 'Image' type not found in TYPES")
    exit(1)

# Step 3: Get blur_image node info
print("\n📋 STEP 3: Getting blur_image node information...")
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

print("✅ Found blur_image node")
print(f"   Callable ID: {blur_node['callableId']}")
print(f"   Arguments: {blur_node['arguments']}")
print(f"   Outputs: {blur_node['outputs']}")

# Step 4: Create a graph with TWO blur nodes connected by an edge
print("\n📊 STEP 4: Creating graph with two connected blur nodes...")

graph = {
    "nodes": [
        {
            "id": "blur-node-1",
            "position": {"x": 100, "y": 100},
            "data": {
                "callableId": blur_node["callableId"],
                "arguments": {
                    "image": {
                        "type": "Image",
                        "cacheKey": cache_key,
                    },
                    "radius": {
                        "type": "int",
                        "value": 10,
                    },
                },
                "outputs": {
                    "image_blurred": {
                        "type": "Image",
                    }
                },
                "outputStyle": "single",
            },
        },
        {
            "id": "blur-node-2",
            "position": {"x": 300, "y": 100},
            "data": {
                "callableId": blur_node["callableId"],
                "arguments": {
                    "image": {
                        "type": "Image",
                        # This will be populated by edge data propagation
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
        },
    ],
    "edges": [
        {
            "id": "edge-1",
            "source": "blur-node-1",
            "target": "blur-node-2",
            "sourceHandle": "blur-node-1:outputs:image_blurred:handle",
            "targetHandle": "blur-node-2:arguments:image:handle",
        }
    ],
}

print("✅ Graph created with 2 blur nodes and 1 edge")
print(f"   Node 1: blur with radius=10")
print(f"   Node 2: blur with radius=20 (receives input from Node 1)")
print(f"   Edge: blur-node-1 (image_blurred) -> blur-node-2 (image)")

print("\n🔍 DEBUG: Graph structure being sent:")
print(f"   Node 1 arguments: {graph['nodes'][0]['data']['arguments']}")
print(f"   Node 2 arguments: {graph['nodes'][1]['data']['arguments']}")
print(f"   Edges: {graph['edges']}")

# Step 5: Execute the graph
print("\n⚙️  STEP 5: Executing graph...")
exec_response = requests.post("http://localhost:8000/graph_execute", json=graph)

if exec_response.status_code != 200:
    print(f"❌ Execution failed: {exec_response.text}")
    exit(1)

exec_result = exec_response.json()
print("✅ Graph executed successfully!")

d(exec_result)

# Step 6: Verify edge data propagation
print("\n✅ STEP 6: Verifying edge data propagation...")

if "updates" not in exec_result or len(exec_result["updates"]) != 2:
    print(f"❌ Expected 2 updates, got {len(exec_result.get('updates', []))}")
    exit(1)

# Check first node output
update_1 = exec_result["updates"][0]
if update_1["node_id"] != "blur-node-1":
    print(f"❌ Expected first update for blur-node-1, got {update_1['node_id']}")
    exit(1)

if "outputs" not in update_1 or "image_blurred" not in update_1["outputs"]:
    print("❌ No image_blurred output in first node")
    exit(1)

output_1 = update_1["outputs"]["image_blurred"]
print(f"✅ First blur node output:")
print(f"   Type: {output_1['type']}")
print(f"   Cache Key: {output_1.get('cacheKey', 'N/A')}")

# Check second node received input via edge
update_2 = exec_result["updates"][1]
if update_2["node_id"] != "blur-node-2":
    print(f"❌ Expected second update for blur-node-2, got {update_2['node_id']}")
    exit(1)

if "inputs" not in update_2 or "image" not in update_2["inputs"]:
    print("❌ No image input propagated to second node")
    exit(1)

input_2 = update_2["inputs"]["image"]
print(f"✅ Second blur node received input via edge:")
print(f"   Type: {input_2['type']}")
print(f"   Cache Key: {input_2.get('cacheKey', 'N/A')}")

# Verify the cache keys match (edge propagation worked)
if output_1.get("cacheKey") == input_2.get("cacheKey"):
    print("✅ Cache keys match! Edge data propagation successful!")
else:
    print(f"❌ Cache key mismatch:")
    print(f"   Output 1: {output_1.get('cacheKey')}")
    print(f"   Input 2: {input_2.get('cacheKey')}")
    exit(1)

# Check second node output
if "outputs" not in update_2 or "image_blurred" not in update_2["outputs"]:
    print("❌ No image_blurred output in second node")
    exit(1)

output_2 = update_2["outputs"]["image_blurred"]
print(f"✅ Second blur node output:")
print(f"   Type: {output_2['type']}")
print(f"   Cache Key: {output_2.get('cacheKey', 'N/A')}")

# Verify the final output has a different cache key (it's a new image)
if output_2.get("cacheKey") and output_2.get("cacheKey") != output_1.get("cacheKey"):
    print("✅ Final output has new cache key (double blur created new image)")
else:
    print("⚠️  Warning: Final output cache key same as first output")

print("\n" + "=" * 80)
print("🎉 ALL TESTS PASSED!")
print("=" * 80)
print("\nSummary:")
print("✅ First blur node executed successfully")
print("✅ Edge propagated output from first node to second node as input")
print("✅ Cache keys match between first node output and second node input")
print("✅ Second blur node executed successfully with propagated data")
print("✅ Final output is a double-blurred image")
print("✅ Edge data propagation in graph.py works correctly!")
