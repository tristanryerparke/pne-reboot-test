from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

import app.server as server_module
from app.analysis.functions_analysis import analyze_function
from app.analysis.user_model_functions.user_model_nodes import (
    create_const_deconst_models,
)
from app.graph import router as graph_router
from examples.basic_user_model import two_point_distance

# Analyze the function to get types and schema
_, schema, _, found_types = analyze_function(two_point_distance)

# Register the function and its types
mock_callables = {
    schema.callable_id: two_point_distance,
}

# Create construct/deconstruct nodes for user models
model_schemas, model_callables = create_const_deconst_models(found_types)

# Get the callable IDs from the schemas
construct_callable_id = None
deconstruct_callable_id = None
for model_schema in model_schemas:
    if model_schema.name.startswith("construct-"):
        construct_callable_id = model_schema.callable_id
    elif model_schema.name.startswith("deconstruct-"):
        deconstruct_callable_id = model_schema.callable_id

mock_callables.update(model_callables)

server_module.CALLABLES.update(mock_callables)
server_module.TYPES.update(found_types)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Test Python Node Editor - User Model Graph", lifespan=lifespan)
app.include_router(graph_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

client = TestClient(app)


def test_single_construct_node():
    """Test executing a single Point2D construct node"""
    graph_data = {
        "nodes": [
            {
                "id": "construct-node-1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": construct_callable_id,
                    "arguments": {
                        "x": {"type": "float", "value": 2.0},
                        "y": {"type": "float", "value": 4.0},
                    },
                    "outputs": {"return": {"type": "Point2D"}},
                    "outputStyle": "single",
                },
            },
        ],
        "edges": [],
    }

    response = client.post("/graph_execute", json=graph_data)
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 1

    node_update = result["updates"][0]
    assert node_update["node_id"] == "construct-node-1"
    assert "outputs" in node_update
    assert "return" in node_update["outputs"]

    output = node_update["outputs"]["return"]
    assert output["type"] == "Point2D"
    assert output["value"] == {"x": 2.0, "y": 4.0}


def test_construct_and_deconstruct():
    """Test constructing a Point2D and then deconstructing it"""
    graph_data = {
        "nodes": [
            {
                "id": "construct-node-1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": construct_callable_id,
                    "arguments": {
                        "x": {"type": "float", "value": 3.0},
                        "y": {"type": "float", "value": 5.0},
                    },
                    "outputs": {"return": {"type": "Point2D"}},
                    "outputStyle": "single",
                },
            },
            {
                "id": "deconstruct-node-1",
                "position": {"x": 200, "y": 0},
                "data": {
                    "callableId": deconstruct_callable_id,
                    "arguments": {
                        "instance": {"type": "Point2D", "value": None},
                    },
                    "outputs": {
                        "x": {"type": "float"},
                        "y": {"type": "float"},
                    },
                    "outputStyle": "multiple",
                },
            },
        ],
        "edges": [
            {
                "id": "edge1",
                "source": "construct-node-1",
                "sourceHandle": "construct-node-1:outputs:return:handle",
                "target": "deconstruct-node-1",
                "targetHandle": "deconstruct-node-1:inputs:instance:handle",
            }
        ],
    }

    response = client.post("/graph_execute", json=graph_data)
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 2

    # Verify construct node output
    construct_update = result["updates"][0]
    assert construct_update["node_id"] == "construct-node-1"
    assert construct_update["outputs"]["return"]["value"] == {"x": 3.0, "y": 5.0}

    # Verify deconstruct node outputs
    deconstruct_update = result["updates"][1]
    assert deconstruct_update["node_id"] == "deconstruct-node-1"
    assert deconstruct_update["outputs"]["x"]["value"] == 3.0
    assert deconstruct_update["outputs"]["y"]["value"] == 5.0
    assert deconstruct_update["arguments"]["instance"]["value"] == {"x": 3.0, "y": 5.0}


def test_two_point_distance_calculation():
    """Test calculating distance between two points"""
    graph_data = {
        "nodes": [
            {
                "id": "construct-point-a",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": construct_callable_id,
                    "arguments": {
                        "x": {"type": "float", "value": 0.0},
                        "y": {"type": "float", "value": 0.0},
                    },
                    "outputs": {"return": {"type": "Point2D"}},
                    "outputStyle": "single",
                },
            },
            {
                "id": "construct-point-b",
                "position": {"x": 0, "y": 100},
                "data": {
                    "callableId": construct_callable_id,
                    "arguments": {
                        "x": {"type": "float", "value": 3.0},
                        "y": {"type": "float", "value": 4.0},
                    },
                    "outputs": {"return": {"type": "Point2D"}},
                    "outputStyle": "single",
                },
            },
            {
                "id": "distance-node",
                "position": {"x": 200, "y": 50},
                "data": {
                    "callableId": schema.callable_id,
                    "arguments": {
                        "a": {"type": "Point2D", "value": None},
                        "b": {"type": "Point2D", "value": None},
                    },
                    "outputs": {"return": {"type": "float"}},
                    "outputStyle": "single",
                },
            },
        ],
        "edges": [
            {
                "id": "edge1",
                "source": "construct-point-a",
                "sourceHandle": "construct-point-a:outputs:return:handle",
                "target": "distance-node",
                "targetHandle": "distance-node:inputs:a:handle",
            },
            {
                "id": "edge2",
                "source": "construct-point-b",
                "sourceHandle": "construct-point-b:outputs:return:handle",
                "target": "distance-node",
                "targetHandle": "distance-node:inputs:b:handle",
            },
        ],
    }

    response = client.post("/graph_execute", json=graph_data)
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 3

    # Verify distance calculation (distance from (0,0) to (3,4) should be 5.0)
    distance_update = result["updates"][2]
    assert distance_update["node_id"] == "distance-node"
    assert distance_update["outputs"]["return"]["value"] == 5.0
    assert distance_update["arguments"]["a"]["value"] == {"x": 0.0, "y": 0.0}
    assert distance_update["arguments"]["b"]["value"] == {"x": 3.0, "y": 4.0}
