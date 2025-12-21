from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

import app.server as server_module
from app.analysis.functions_analysis import analyze_function
from app.execution.exec_sync import router as graph_router
from tests.assets.dynamic_inputs import (
    create_dict_of_floats,
    create_list_of_floats,
    index_dict_of_floats,
    index_list_of_floats,
)

# Analyze the functions to get types and schemas
_, list_schema, _, list_types = analyze_function(create_list_of_floats)
_, dict_schema, _, dict_types = analyze_function(create_dict_of_floats)
_, index_list_schema, _, _ = analyze_function(index_list_of_floats)
_, index_dict_schema, _, _ = analyze_function(index_dict_of_floats)

# Register the functions and their types
mock_callables = {
    list_schema.callable_id: create_list_of_floats,
    dict_schema.callable_id: create_dict_of_floats,
    index_list_schema.callable_id: index_list_of_floats,
    index_dict_schema.callable_id: index_dict_of_floats,
}

server_module.CALLABLES.update(mock_callables)
server_module.TYPES.update(list_types)
server_module.TYPES.update(dict_types)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Test Python Node Editor - Dynamic Inputs", lifespan=lifespan)
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


def test_create_dict_of_floats():
    """Test executing a single create_dict_of_floats node with dict_inputs"""
    graph_data = {
        "nodes": [
            {
                "id": "dict-node-1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": dict_schema.callable_id,
                    "arguments": {
                        "key_0": {"type": "float", "value": 2.5},
                        "key_1": {"type": "float", "value": 3.7},
                        "temperature": {"type": "float", "value": 98.6},
                    },
                    "outputs": {
                        "return": {
                            "type": {
                                "structureType": "dict",
                                "itemsType": "float",
                            }
                        }
                    },
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
    assert node_update["nodeId"] == "dict-node-1"
    assert "outputs" in node_update
    assert "return" in node_update["outputs"]

    output = node_update["outputs"]["return"]
    assert output["type"]["structureType"] == "dict"
    assert output["type"]["itemsType"] == "float"
    assert output["value"] == {
        "key_0": 2.5,
        "key_1": 3.7,
        "temperature": 98.6,
    }


def test_create_list_of_floats():
    """Test executing a single create_list_of_floats node with list_inputs"""
    graph_data = {
        "nodes": [
            {
                "id": "list-node-1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": list_schema.callable_id,
                    "arguments": {
                        "0": {"type": "float", "value": 1.1},
                        "1": {"type": "float", "value": 2.2},
                        "2": {"type": "float", "value": 3.3},
                    },
                    "outputs": {
                        "return": {
                            "type": {
                                "structureType": "list",
                                "itemsType": "float",
                            }
                        }
                    },
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
    assert node_update["nodeId"] == "list-node-1"
    assert "outputs" in node_update
    assert "return" in node_update["outputs"]

    output = node_update["outputs"]["return"]
    assert output["type"]["structureType"] == "list"
    assert output["type"]["itemsType"] == "float"
    assert output["value"] == [1.1, 2.2, 3.3]


def test_create_and_index_dict():
    """Test creating a dict and then indexing into it"""
    graph_data = {
        "nodes": [
            {
                "id": "create-dict",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": dict_schema.callable_id,
                    "arguments": {
                        "alpha": {"type": "float", "value": 1.0},
                        "beta": {"type": "float", "value": 2.0},
                        "gamma": {"type": "float", "value": 3.0},
                    },
                    "outputs": {
                        "return": {
                            "type": {
                                "structureType": "dict",
                                "itemsType": "float",
                            }
                        }
                    },
                    "outputStyle": "single",
                },
            },
            {
                "id": "index-dict",
                "position": {"x": 200, "y": 0},
                "data": {
                    "callableId": index_dict_schema.callable_id,
                    "arguments": {
                        "dict": {
                            "type": {
                                "structureType": "dict",
                                "itemsType": "float",
                            },
                            "value": None,
                        },
                        "key": {"type": "str", "value": "beta"},
                    },
                    "outputs": {"return": {"type": "float"}},
                    "outputStyle": "single",
                },
            },
        ],
        "edges": [
            {
                "id": "edge1",
                "source": "create-dict",
                "sourceHandle": "create-dict:outputs:return:handle",
                "target": "index-dict",
                "targetHandle": "index-dict:inputs:dict:handle",
            }
        ],
    }

    response = client.post("/graph_execute", json=graph_data)
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    # Now returns 3 updates: create dict, downstream arg update, index dict
    assert len(result["updates"]) == 3

    # Verify create dict node output
    create_update = result["updates"][0]
    assert create_update["nodeId"] == "create-dict"
    assert create_update["outputs"]["return"]["value"] == {
        "alpha": 1.0,
        "beta": 2.0,
        "gamma": 3.0,
    }

    # Verify downstream argument propagation
    downstream_update = result["updates"][1]
    assert downstream_update["nodeId"] == "index-dict"
    assert downstream_update["arguments"]["dict"]["value"] == {
        "alpha": 1.0,
        "beta": 2.0,
        "gamma": 3.0,
    }

    # Verify index dict node output
    index_update = result["updates"][2]
    assert index_update["nodeId"] == "index-dict"
    assert index_update["outputs"]["return"]["value"] == 2.0


def test_create_and_index_list():
    """Test creating a list and then indexing into it"""
    graph_data = {
        "nodes": [
            {
                "id": "create-list",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": list_schema.callable_id,
                    "arguments": {
                        "0": {"type": "float", "value": 10.0},
                        "1": {"type": "float", "value": 20.0},
                        "2": {"type": "float", "value": 30.0},
                    },
                    "outputs": {
                        "return": {
                            "type": {
                                "structureType": "list",
                                "itemsType": "float",
                            }
                        }
                    },
                    "outputStyle": "single",
                },
            },
            {
                "id": "index-list",
                "position": {"x": 200, "y": 0},
                "data": {
                    "callableId": index_list_schema.callable_id,
                    "arguments": {
                        "the_list": {
                            "type": {
                                "structureType": "list",
                                "itemsType": "float",
                            },
                            "value": None,
                        },
                        "index": {"type": "int", "value": 1},
                    },
                    "outputs": {"return": {"type": "float"}},
                    "outputStyle": "single",
                },
            },
        ],
        "edges": [
            {
                "id": "edge1",
                "source": "create-list",
                "sourceHandle": "create-list:outputs:return:handle",
                "target": "index-list",
                "targetHandle": "index-list:inputs:the_list:handle",
            }
        ],
    }

    response = client.post("/graph_execute", json=graph_data)
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    # Now returns 3 updates: create list, downstream arg update, index list
    assert len(result["updates"]) == 3

    # Verify create list node output
    create_update = result["updates"][0]
    assert create_update["nodeId"] == "create-list"
    assert create_update["outputs"]["return"]["value"] == [10.0, 20.0, 30.0]

    # Verify downstream argument propagation
    downstream_update = result["updates"][1]
    assert downstream_update["nodeId"] == "index-list"
    assert downstream_update["arguments"]["the_list"]["value"] == [10.0, 20.0, 30.0]

    # Verify index list node output
    index_update = result["updates"][2]
    assert index_update["nodeId"] == "index-list"
    assert index_update["outputs"]["return"]["value"] == 20.0
