import requests
from devtools import debug as d

response = requests.get("http://localhost:8000/types")
types = response.json()

print("Available types on server:")
d(types)
