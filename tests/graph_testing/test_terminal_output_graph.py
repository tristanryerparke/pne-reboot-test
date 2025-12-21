from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

import app.server as server_module
from app.analysis.functions_analysis import analyze_function
from app.execution.exec_sync import router as graph_router
from tests.assets.functions import add, divide_by_zero, process_data

# Analyze the functions to get types and schemas
_, add_schema, _, add_types = analyze_function(add)
_, verbose_schema, _, verbose_types = analyze_function(process_data)
_, error_schema, _, error_types = analyze_function(divide_by_zero)

# Register the functions and their types
mock_callables = {
    add_schema.callable_id: add,
    verbose_schema.callable_id: process_data,
    error_schema.callable_id: divide_by_zero,
}

server_module.CALLABLES.update(mock_callables)
server_module.TYPES.update(add_types)
server_module.TYPES.update(verbose_types)
server_module.TYPES.update(error_types)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Test Python Node Editor - Terminal Output", lifespan=lifespan)
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


def test_terminal_output_capture():
    """Test that terminal output from print statements is captured and returned"""
    graph_data = {
        "nodes": [
            {
                "id": "verbose-node-1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": verbose_schema.callable_id,
                    "arguments": {
                        "x": {"type": "int", "value": 5},
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

    node_update = result["updates"][0]
    assert node_update["nodeId"] == "verbose-node-1"
    assert node_update["status"] == "executed"
    assert node_update["outputs"]["return"]["value"] == 10

    # Check that terminal output was captured
    assert "terminalOutput" in node_update
    terminal_output = node_update["terminalOutput"]
    assert "Starting to process data with input: 5" in terminal_output
    assert "Step 1: Doubling the value..." in terminal_output
    assert "Step 2: Result is 10" in terminal_output
    assert "Processing complete!" in terminal_output


def test_error_output_capture():
    """Test that error tracebacks are captured and returned as terminal output"""
    graph_data = {
        "nodes": [
            {
                "id": "error-node-1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": error_schema.callable_id,
                    "arguments": {
                        "x": {"type": "float", "value": 10.0},
                    },
                    "outputs": {"return": {"type": "float"}},
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
    assert node_update["nodeId"] == "error-node-1"
    assert node_update["status"] == "error"
    assert "outputs" not in node_update or len(node_update.get("outputs", {})) == 0

    # Check that error traceback was captured
    assert "terminalOutput" in node_update
    terminal_output = node_update["terminalOutput"]
    assert "ZeroDivisionError" in terminal_output
    assert "division by zero" in terminal_output
    assert "divide_by_zero" in terminal_output
    assert "return x / 0" in terminal_output


def test_empty_terminal_output_on_success():
    """Test that terminal output is an empty string when function executes without errors or output"""
    graph_data = {
        "nodes": [
            {
                "id": "add-node-1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": add_schema.callable_id,
                    "arguments": {
                        "a": {"type": "int", "value": 3},
                        "b": {"type": "int", "value": 5},
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

    node_update = result["updates"][0]
    assert node_update["nodeId"] == "add-node-1"
    assert node_update["status"] == "executed"
    assert node_update["outputs"]["return"]["value"] == 8

    # Check that terminalOutput is excluded when empty (using exclude_none=True)
    # An empty terminal output is not included in the response to reduce payload size
    assert "terminalOutput" not in node_update
