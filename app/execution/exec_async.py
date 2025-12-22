import asyncio

import shortuuid
from devtools import debug as d
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing_extensions import Literal

from app.execution.exec_utils import (
    VERBOSE,
    create_node_update,
    execute_node,
    topological_order,
)
from app.schema import Graph, NodeUpdate

router = APIRouter()

# Time in seconds to keep completed executions before cleanup
EXECUTION_CLEANUP_DELAY = 10


class ExecutionState(BaseModel):
    status: Literal["running", "complete"] = "running"  # "running" or "completee"
    updates: list[NodeUpdate] = []
    update_index: int = 0
    last_sent_index: int = -1


EXECUTIONS: dict[str, ExecutionState] = {}


@router.post("/execution_submit")
async def submit_execution(graph: Graph):
    """Submit a graph for async execution and return an execution ID"""
    execution_id = shortuuid.uuid()

    EXECUTIONS[execution_id] = ExecutionState(status="running")

    asyncio.create_task(execute_graph_async(execution_id, graph))

    return {"execution_id": execution_id}


@router.get("/execution_status/{execution_id}")
async def get_execution_status(execution_id: str):
    """Get the status and updates for a specific execution"""
    if execution_id not in EXECUTIONS:
        raise HTTPException(status_code=404, detail="Execution not found")

    execution_state = EXECUTIONS[execution_id]
    last_sent = execution_state.last_sent_index
    current_index = execution_state.update_index

    # If nothing has changed, return only the index
    if current_index == last_sent:
        return {"update_index": current_index}

    # Something changed, send full response
    response = {
        "update_index": current_index,
        "status": execution_state.status,
        "updates": [
            update.model_dump(exclude_none=True) for update in execution_state.updates
        ],
    }

    # Update the last sent index for this execution
    execution_state.last_sent_index = current_index

    return response


async def cleanup_execution(execution_id: str):
    """Remove execution from memory after a delay"""
    await asyncio.sleep(EXECUTION_CLEANUP_DELAY)
    if execution_id in EXECUTIONS:
        del EXECUTIONS[execution_id]
        if VERBOSE:
            print(f"Cleaned up execution {execution_id}")


async def execute_graph_async(execution_id: str, graph: Graph):
    """Execute a graph asynchronously, yielding updates as nodes complete"""

    try:
        execution_list = topological_order(graph)

        if VERBOSE:
            d(execution_list)

        for node in execution_list:
            if VERBOSE:
                print(f"Executing node {node.id}")

            # Send initial update when node starts executing
            executing_update = NodeUpdate(
                node_id=node.id,
                status="executing",
            )
            EXECUTIONS[execution_id].updates.append(executing_update)
            EXECUTIONS[execution_id].update_index += 1

            success, result, terminal_output = await asyncio.to_thread(
                execute_node, node.data
            )

            node_update = create_node_update(
                node, success, result, terminal_output, graph, execution_list
            )

            # Append the final update
            EXECUTIONS[execution_id].updates.append(node_update)

            # Propagate outputs to downstream nodes for both execution and visual display
            for edge in graph.edges:
                if edge.source == node.id:
                    # Extract the output field name from the source_handle
                    output_field_name = edge.source_handle.split(":")[-2]

                    # Extract target node ID and argument name
                    target_node_id = edge.target
                    argument_name = edge.target_handle.split(":")[-2]

                    # Update the execution graph so downstream nodes have correct inputs
                    target_node = next(
                        n for n in execution_list if n.id == target_node_id
                    )
                    target_node.data.arguments[argument_name] = node_update.outputs[
                        output_field_name
                    ].model_copy()

                    # Create a visual update for the downstream node
                    downstream_update = NodeUpdate(
                        node_id=target_node_id,
                        arguments={
                            argument_name: node_update.outputs[
                                output_field_name
                            ].model_copy()
                        },
                    )

                    EXECUTIONS[execution_id].updates.append(downstream_update)

            # Increment update_index ONCE after all related updates are added
            EXECUTIONS[execution_id].update_index += 1

            if not success:
                EXECUTIONS[execution_id].status = "complete"
                EXECUTIONS[execution_id].update_index += 1
                return

        EXECUTIONS[execution_id].status = "complete"
        EXECUTIONS[execution_id].update_index += 1

        if VERBOSE:
            d(EXECUTIONS[execution_id])

    except Exception as e:
        EXECUTIONS[execution_id].status = "complete"
        EXECUTIONS[execution_id].update_index += 1
        if VERBOSE:
            print(f"Execution {execution_id} failed with error: {e}")

    finally:
        # Schedule cleanup after delay
        asyncio.create_task(cleanup_execution(execution_id))
