import requests
from devtools import debug as d

# Use the cache key from the previous upload
cache_key = "66a88360-f01c-4366-a783-46a7aec1435a"

# Get the callable_id from the server
print("Fetching blur_image node info...")
nodes_response = requests.get("http://localhost:8000/nodes")
nodes = nodes_response.json()

blur_node = None
for node in nodes:
    if node["name"] == "blur_image":
        blur_node = node
        break

if not blur_node:
    print("❌ blur_image node not found!")
    exit(1)

callable_id = blur_node["callableId"]
print(f"✅ Found blur_image with callable_id: {callable_id}")

graph = {
    "nodes": [
        {
            "id": "test-node",
            "position": {"x": 0, "y": 0},
            "data": {
                "callableId": callable_id,
                "arguments": {
                    "image": {"type": "Image", "cacheKey": cache_key},
                    "radius": {"type": "int", "value": 15},
                },
                "outputs": {"image_blurred": {"type": "Image"}},
                "outputStyle": "single",
            },
        }
    ],
    "edges": [],
}

print("Executing graph...")
response = requests.post("http://localhost:8000/graph_execute", json=graph)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    d(result)
else:
    print("Error:")
    try:
        d(response.json())
    except:
        print(response.text)
