"""
Tests for async graph execution using the async execution endpoints.
These tests verify that nodes execute asynchronously and that status updates
are received at different stages of the execution timeline.
"""

import asyncio
import time
from contextlib import asynccontextmanager

import httpx
import pytest
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from httpx import ASGITransport

import app.server as server_module
from app.analysis.functions_analysis import analyze_function
from app.execution.exec_async import router as async_router
from tests.assets.async_functions import (
    quick_add,
    quick_divide,
    quick_multiply,
    quick_power,
)

# Register test functions
_, schema_add, _, types_add = analyze_function(quick_add)
_, schema_multiply, _, types_multiply = analyze_function(quick_multiply)
_, schema_divide, _, types_divide = analyze_function(quick_divide)
_, schema_power, _, types_power = analyze_function(quick_power)

server_module.CALLABLES["quick-add"] = quick_add
server_module.FUNCTION_SCHEMAS.append(schema_add)

server_module.CALLABLES["quick-multiply"] = quick_multiply
server_module.FUNCTION_SCHEMAS.append(schema_multiply)

server_module.CALLABLES["quick-divide"] = quick_divide
server_module.FUNCTION_SCHEMAS.append(schema_divide)

server_module.CALLABLES["quick-power"] = quick_power
server_module.FUNCTION_SCHEMAS.append(schema_power)

# Merge types
server_module.TYPES.update(types_add)
server_module.TYPES.update(types_multiply)
server_module.TYPES.update(types_divide)
server_module.TYPES.update(types_power)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Test Async Python Node Editor", lifespan=lifespan)
app.include_router(async_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)


async def poll_execution_until_complete(
    client: httpx.AsyncClient, execution_id: str, timeout: float = 5.0
):
    """
    Poll execution status until completion or timeout.
    Returns list of all update snapshots received during polling.
    """
    start_time = time.time()
    snapshots = []
    last_update_index = -1

    while time.time() - start_time < timeout:
        response = await client.get(f"/execution_status/{execution_id}")
        assert response.status_code == 200
        data = response.json()

        current_index = data["update_index"]

        # Only store snapshots when something changed
        if current_index != last_update_index:
            snapshots.append(data)
            last_update_index = current_index
            print(
                f"New snapshot: update_index={current_index}, status={data.get('status')}, num_updates={len(data.get('updates', []))}"
            )

        # Check if execution complete
        if data.get("status") == "complete":
            return snapshots

        await asyncio.sleep(0.05)  # Poll every 50ms

    print(f"Timeout! Last snapshots: {snapshots}")
    raise TimeoutError(f"Execution {execution_id} did not complete within {timeout}s")


@pytest.mark.asyncio
async def test_single_node_async_execute():
    """Test async execution of a single node with status updates."""
    graph_data = {
        "nodes": [
            {
                "id": "node1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": "quick-add",
                    "arguments": {
                        "a": {"type": "int", "value": 10},
                        "b": {"type": "int", "value": 5},
                    },
                    "outputs": {"return": {"type": "int"}},
                    "outputStyle": "single",
                },
            },
        ],
        "edges": [],
    }

    # Use httpx.AsyncClient to properly support background tasks
    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Submit execution
        response = await client.post("/execution_submit", json=graph_data)
        assert response.status_code == 200
        result = response.json()
        execution_id = result["execution_id"]
        assert execution_id is not None

        # Poll until complete and collect all snapshots
        snapshots = await poll_execution_until_complete(client, execution_id)

        # Should have at least 2 snapshots: executing state and complete state
        assert len(snapshots) >= 2

        # Check we got an "executing" update
        executing_found = False
        for snapshot in snapshots:
            if "updates" in snapshot:
                for update in snapshot["updates"]:
                    if (
                        update.get("status") == "executing"
                        and update.get("nodeId") == "node1"
                    ):
                        executing_found = True
                        break

        assert executing_found, "Should have received an 'executing' status update"

        # Final snapshot should be complete
        final_snapshot = snapshots[-1]
        assert final_snapshot["status"] == "complete"
        assert "updates" in final_snapshot

        # Find the final node update
        final_updates = final_snapshot["updates"]
        node1_final = None
        for update in final_updates:
            if update.get("nodeId") == "node1" and update.get("status") in [
                "executed",
                "error",
            ]:
                node1_final = update
                break

        assert node1_final is not None
        assert node1_final["status"] == "executed"
        assert node1_final["outputs"]["return"]["value"] == 15


@pytest.mark.asyncio
async def test_two_connected_nodes_async_execute():
    """Test async execution of two connected nodes with intermediate updates."""
    graph_data = {
        "nodes": [
            {
                "id": "node1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": "quick-add",
                    "arguments": {
                        "a": {"type": "int", "value": 10},
                        "b": {"type": "int", "value": 5},
                    },
                    "outputs": {"return": {"type": "int"}},
                    "outputStyle": "single",
                },
            },
            {
                "id": "node2",
                "position": {"x": 200, "y": 0},
                "data": {
                    "callableId": "quick-multiply",
                    "arguments": {
                        "x": {"type": "int", "value": None},
                        "y": {"type": "int", "value": 3},
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

    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Submit execution
        response = await client.post("/execution_submit", json=graph_data)
        assert response.status_code == 200
        result = response.json()
        execution_id = result["execution_id"]

        # Poll until complete
        snapshots = await poll_execution_until_complete(client, execution_id)

        # Final snapshot should be complete
        final_snapshot = snapshots[-1]
        assert final_snapshot["status"] == "complete"

        # Collect all updates from final snapshot
        all_updates = final_snapshot["updates"]

        # Should have updates for:
        # 1. node1 executing
        # 2. node1 success
        # 3. downstream arg propagation to node2
        # 4. node2 executing
        # 5. node2 success
        # Note: We should have at least 5 updates
        assert len(all_updates) >= 5

        # Find specific updates
        node1_executed = None
        node2_arg_update = None
        node2_executed = None

        for update in all_updates:
            if update.get("nodeId") == "node1" and update.get("status") == "executed":
                node1_executed = update
            elif (
                update.get("nodeId") == "node2"
                and "arguments" in update
                and update.get("status") is None
            ):
                node2_arg_update = update
            elif update.get("nodeId") == "node2" and update.get("status") == "executed":
                node2_executed = update

        # Verify node1 completed successfully
        assert node1_executed is not None
        assert node1_executed["outputs"]["return"]["value"] == 15

        # Verify downstream argument was propagated
        assert node2_arg_update is not None
        assert node2_arg_update["arguments"]["x"]["value"] == 15

        # Verify node2 completed successfully
        assert node2_executed is not None
        assert node2_executed["outputs"]["return"]["value"] == 45  # 15 * 3


@pytest.mark.asyncio
async def test_async_execution_with_error():
    """Test async execution when a node encounters an error."""
    graph_data = {
        "nodes": [
            {
                "id": "node1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": "quick-divide",
                    "arguments": {
                        "numerator": {"type": "int", "value": 10},
                        "denominator": {"type": "int", "value": 0},  # Will cause error
                    },
                    "outputs": {"return": {"type": "float"}},
                    "outputStyle": "single",
                },
            },
        ],
        "edges": [],
    }

    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Submit execution
        response = await client.post("/execution_submit", json=graph_data)
        assert response.status_code == 200
        result = response.json()
        execution_id = result["execution_id"]

        # Poll until complete
        snapshots = await poll_execution_until_complete(client, execution_id)

        # Final snapshot should be complete
        final_snapshot = snapshots[-1]
        assert final_snapshot["status"] == "complete"

        # Find the error update
        all_updates = final_snapshot["updates"]
        node1_error = None
        for update in all_updates:
            if update.get("nodeId") == "node1" and update.get("status") == "error":
                node1_error = update
                break

        assert node1_error is not None
        assert node1_error["status"] == "error"
        assert "terminalOutput" in node1_error
        assert "Cannot divide by zero" in node1_error["terminalOutput"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
