from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

import app.server as server_module
from app.graph import router as graph_router


def mock_add(a, b):
    return a + b


def mock_multiply(x, y):
    return x * y


mock_callables = {
    "function1-add": mock_add,
    "function2-multiply": mock_multiply,
}

server_module.CALLABLES.clear()
server_module.CALLABLES.update(mock_callables)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Test Python Node Editor", lifespan=lifespan)
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


def test_single_node_execute():
    """Make sure the app can execute a single node"""
    graph_data = {
        "nodes": [
            {
                "id": "node1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": "function1-add",
                    "arguments": {
                        "a": {"type": "int", "value": 5},
                        "b": {"type": "int", "value": 3},
                    },
                    "outputs": {"return": {"type": "int"}},
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

    node1_update = result["updates"][0]
    assert node1_update["node_id"] == "node1"
    assert node1_update["outputs"]["return"]["value"] == 8


def test_two_nodes_execute():
    graph_data = {
        "nodes": [
            {
                "id": "node1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": "function1-add",
                    "arguments": {
                        "a": {"type": "int", "value": 5},
                        "b": {"type": "int", "value": 3},
                    },
                    "outputs": {"return": {"type": "int"}},
                    "outputStyle": "single",
                },
            },
            {
                "id": "node2",
                "position": {"x": 200, "y": 0},
                "data": {
                    "callableId": "function2-multiply",
                    "arguments": {
                        "x": {"type": "int", "value": 4},
                        "y": {"type": "int", "value": 2},
                    },
                    "outputs": {"return": {"type": "int"}},
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
    assert len(result["updates"]) == 2

    node1_update = result["updates"][0]
    assert node1_update["node_id"] == "node1"
    assert node1_update["outputs"]["return"]["value"] == 8

    node2_update = result["updates"][1]
    assert node2_update["node_id"] == "node2"
    assert node2_update["outputs"]["return"]["value"] == 8


def test_two_connected_nodes_execute():
    graph_data = {
        "nodes": [
            {
                "id": "node1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": "function1-add",
                    "arguments": {
                        "a": {"type": "int", "value": 5},
                        "b": {"type": "int", "value": 3},
                    },
                    "outputs": {"return": {"type": "int"}},
                    "outputStyle": "single",
                },
            },
            {
                "id": "node2",
                "position": {"x": 200, "y": 0},
                "data": {
                    "callableId": "function2-multiply",
                    "arguments": {
                        "x": {"type": "int", "value": None},
                        "y": {"type": "int", "value": 2},
                    },
                    "outputs": {"return": {"type": "int"}},
                    "outputStyle": "single",
                },
            },
        ],
        "edges": [
            {
                "id": "edge1",
                "source": "node1",
                "sourceHandle": "node1:outputs:return:handle",
                "target": "node2",
                "targetHandle": "node2:inputs:x:handle",
            }
        ],
    }

    response = client.post("/graph_execute", json=graph_data)
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 2

    node1_update = result["updates"][0]
    assert node1_update["node_id"] == "node1"
    assert node1_update["outputs"]["return"]["value"] == 8

    node2_update = result["updates"][1]
    assert node2_update["node_id"] == "node2"
    assert node2_update["outputs"]["return"]["value"] == 16
    assert node2_update["inputs"]["x"]["value"] == 8
