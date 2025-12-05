import base64
import io
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient
from PIL import Image

import app.server as server_module
from app.analysis.functions_analysis import analyze_function
from app.graph import router as graph_router
from app.large_data.router import router as data_router
from examples.images.blur import blur_image

# Analyze the blur_image function to get types
_, schema, _, found_types = analyze_function(blur_image)

# Register the blur_image function and its types (don't clear, just update)
mock_callables = {
    "blur_image": blur_image,
}

server_module.CALLABLES.update(mock_callables)
server_module.TYPES.update(found_types)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Test Python Node Editor - Image Graph", lifespan=lifespan)
app.include_router(graph_router)
app.include_router(data_router, prefix="/data")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

client = TestClient(app)


def test_image_upload():
    """Test uploading an image via the large_data endpoint"""
    # Create a test image
    test_image = Image.new("RGB", (100, 100), color="red")
    buffer = io.BytesIO()
    test_image.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    # Upload the image
    payload = {
        "type": "Image",
        "filename": "test_image.png",
        "data": {"img_base64": img_base64},
    }

    response = client.post("/data/upload_large_data", json=payload)
    assert response.status_code == 200

    result = response.json()
    assert "cacheKey" in result
    assert result["type"] == "Image"
    assert result["_filename"] == "test_image.png"
    assert "_preview" in result
    assert "_displayName" in result
    assert "Image(100x100, RGB)" in result["_displayName"]


def test_cache_exists():
    """Test checking if a cache key exists"""
    # Upload an image
    test_image = Image.new("RGB", (100, 100), color="red")
    buffer = io.BytesIO()
    test_image.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    payload = {
        "type": "Image",
        "filename": "test_image.png",
        "data": {"img_base64": img_base64},
    }

    response = client.post("/data/upload_large_data", json=payload)
    assert response.status_code == 200
    cache_key = response.json()["cacheKey"]

    # Check if it exists
    response = client.get(f"/data/cache_exists/{cache_key}")
    assert response.status_code == 200

    result = response.json()
    assert result["exists"] is True

    # Check a non-existent key
    response = client.get("/data/cache_exists/nonexistent_key")
    assert response.status_code == 200

    result = response.json()
    assert result["exists"] is False


def test_single_image_node_execute():
    """Test executing a single blur_image node"""
    # First upload an image
    test_image = Image.new("RGB", (100, 100), color="blue")
    buffer = io.BytesIO()
    test_image.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    upload_payload = {
        "type": "Image",
        "filename": "test_blur.png",
        "data": {"img_base64": img_base64},
    }

    upload_response = client.post("/data/upload_large_data", json=upload_payload)
    assert upload_response.status_code == 200
    upload_result = upload_response.json()
    cache_key = upload_result["cacheKey"]

    # Create graph with blur_image node
    graph_data = {
        "nodes": [
            {
                "id": "blur-node-1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callable_id": "blur_image",
                    "arguments": {
                        "image": {
                            "type": "Image",
                            "cacheKey": cache_key,
                        },
                        "radius": {
                            "type": "int",
                            "value": 20,
                        },
                    },
                    "outputs": {"image_blurred": {"type": "Image"}},
                    "output_style": "single",
                },
            },
        ],
        "edges": [],
    }

    # Execute the graph
    response = client.post("/graph_execute", json=graph_data)
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 1

    # Verify the output
    node_update = result["updates"][0]
    assert node_update["node_id"] == "blur-node-1"
    assert "outputs" in node_update
    assert "image_blurred" in node_update["outputs"]

    output = node_update["outputs"]["image_blurred"]
    assert output["type"] == "Image"
    assert "cacheKey" in output
    assert "_preview" in output
    assert len(output["_preview"]) > 0


def test_two_connected_image_nodes():
    """Test executing two connected blur_image nodes"""
    # Upload an image
    test_image = Image.new("RGB", (100, 100), color="green")
    buffer = io.BytesIO()
    test_image.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    upload_payload = {
        "type": "Image",
        "filename": "test_double_blur.png",
        "data": {"img_base64": img_base64},
    }

    upload_response = client.post("/data/upload_large_data", json=upload_payload)
    assert upload_response.status_code == 200
    cache_key = upload_response.json()["cacheKey"]

    # Create graph with two connected blur nodes
    graph_data = {
        "nodes": [
            {
                "id": "blur-node-1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callable_id": "blur_image",
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
                    "outputs": {"image_blurred": {"type": "Image"}},
                    "output_style": "single",
                },
            },
            {
                "id": "blur-node-2",
                "position": {"x": 200, "y": 0},
                "data": {
                    "callable_id": "blur_image",
                    "arguments": {
                        "image": {
                            "type": "Image",
                            "cacheKey": None,
                        },
                        "radius": {
                            "type": "int",
                            "value": 20,
                        },
                    },
                    "outputs": {"image_blurred": {"type": "Image"}},
                    "output_style": "single",
                },
            },
        ],
        "edges": [
            {
                "id": "edge1",
                "source": "blur-node-1",
                "sourceHandle": "blur-node-1:outputs:image_blurred:handle",
                "target": "blur-node-2",
                "targetHandle": "blur-node-2:inputs:image:handle",
            }
        ],
    }

    # Execute the graph
    response = client.post("/graph_execute", json=graph_data)
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 2

    # Verify first node output
    node1_update = result["updates"][0]
    assert node1_update["node_id"] == "blur-node-1"
    assert "image_blurred" in node1_update["outputs"]
    node1_output = node1_update["outputs"]["image_blurred"]
    assert node1_output["type"] == "Image"
    assert "cacheKey" in node1_output

    # Verify second node output and input
    node2_update = result["updates"][1]
    assert node2_update["node_id"] == "blur-node-2"
    assert "image_blurred" in node2_update["outputs"]
    assert "image" in node2_update["inputs"]

    node2_output = node2_update["outputs"]["image_blurred"]
    assert node2_output["type"] == "Image"
    assert "cacheKey" in node2_output

    # Verify that the second node received the first node's output
    node2_input = node2_update["inputs"]["image"]
    assert node2_input["type"] == "Image"
    assert node2_input["cacheKey"] == node1_output["cacheKey"]
