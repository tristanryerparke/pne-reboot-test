import requests
from devtools import debug as d

# Check nodes
print("=" * 60)
print("NODES:")
print("=" * 60)
nodes_response = requests.get("http://localhost:8000/nodes")
nodes = nodes_response.json()

for node in nodes:
    if "blur" in node["name"].lower():
        print(f"\nNode: {node['name']}")
        print(f"Arguments: {node['arguments']}")
        print(f"Outputs: {node['outputs']}")

# Check types
print("\n" + "=" * 60)
print("TYPES:")
print("=" * 60)
types_response = requests.get("http://localhost:8000/types")
types = types_response.json()
d(types)
