import asyncio
from uuid import uuid4

from devtools import debug as d
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.execution.exec_utils import (
    VERBOSE,
    create_node_update,
    execute_node,
    topological_order,
)
from app.schema import Graph

router = APIRouter()


class ExecutionState(BaseModel):
    status: str
    updates: list
    terminal_output: str
    error: str | None
    execution_complete: bool
    update_index: int


EXECUTIONS: dict[str, ExecutionState] = {}
LAST_SENT_INDEX: dict[str, int] = {}


@router.post("/execution_submit")
async def submit_execution(graph: Graph):
    """Submit a graph for async execution and return an execution ID"""
    execution_id = str(uuid4())

    EXECUTIONS[execution_id] = ExecutionState(
        status="running",
        updates=[],
        terminal_output="",
        error=None,
        execution_complete=False,
        update_index=0,
    )
    LAST_SENT_INDEX[execution_id] = -1

    asyncio.create_task(execute_graph_async(execution_id, graph))

    return {"execution_id": execution_id}


@router.get("/execution_status/{execution_id}")
async def get_execution_status(execution_id: str):
    """Get the status and updates for a specific execution"""
    if execution_id not in EXECUTIONS:
        raise HTTPException(status_code=404, detail="Execution not found")

    execution_state = EXECUTIONS[execution_id]
    last_sent = LAST_SENT_INDEX.get(execution_id, -1)
    current_index = execution_state.update_index

    # If nothing has changed, return only the index
    if current_index == last_sent:
        return {"update_index": current_index}

    # Something changed, send full response
    response = {
        "update_index": current_index,
        "status": execution_state.status,
        "updates": execution_state.updates,
        "terminal_output": execution_state.terminal_output,
        "error": execution_state.error,
        "execution_complete": execution_state.execution_complete,
    }

    # Update the last sent index for this execution
    LAST_SENT_INDEX[execution_id] = current_index

    return response


async def execute_graph_async(execution_id: str, graph: Graph):
    """Execute a graph asynchronously, yielding updates as nodes complete"""
    from app.server import TYPES

    try:
        execution_list = topological_order(graph)

        if VERBOSE:
            d(execution_list)

        for node in execution_list:
            if VERBOSE:
                print(f"Executing node {node.id}")

            # Send initial update when node starts executing
            executing_update = {
                "node_id": node.id,
                "status": "executing",
                "outputs": {},
                "arguments": {},
                "terminal_output": "",
            }
            EXECUTIONS[execution_id].updates.append(executing_update)
            EXECUTIONS[execution_id].update_index += 1

            success, result, terminal_output = await asyncio.to_thread(
                execute_node, node.data
            )

            node_update = create_node_update(
                node, success, result, terminal_output, graph, execution_list, TYPES
            )

            # Append the final update
            EXECUTIONS[execution_id].updates.append(node_update)

            # Create updates for downstream nodes to propagate argument values visually
            for edge in graph.edges:
                if edge.source == node.id:
                    # Extract the output field name from the sourceHandle
                    output_field_name = edge.sourceHandle.split(":")[-2]

                    # Extract target node ID and argument name
                    target_node_id = edge.target
                    argument_name = edge.targetHandle.split(":")[-2]

                    # Create an update for the downstream node with just the argument
                    downstream_update = {
                        "node_id": target_node_id,
                        "arguments": {
                            argument_name: node_update["outputs"][output_field_name].model_copy()
                        },
                    }

                    EXECUTIONS[execution_id].updates.append(downstream_update)

            # Increment update_index ONCE after all related updates are added
            EXECUTIONS[execution_id].update_index += 1

            if terminal_output:
                current_output = EXECUTIONS[execution_id].terminal_output
                EXECUTIONS[execution_id].terminal_output = (
                    current_output + terminal_output
                )

            if not success:
                EXECUTIONS[execution_id].status = "failed"
                EXECUTIONS[execution_id].error = terminal_output
                EXECUTIONS[execution_id].execution_complete = True
                EXECUTIONS[execution_id].update_index += 1
                return

        EXECUTIONS[execution_id].status = "completed"
        EXECUTIONS[execution_id].execution_complete = True
        EXECUTIONS[execution_id].update_index += 1

        if VERBOSE:
            d(EXECUTIONS[execution_id])

    except Exception as e:
        EXECUTIONS[execution_id].status = "failed"
        EXECUTIONS[execution_id].error = str(e)
        EXECUTIONS[execution_id].execution_complete = True
        EXECUTIONS[execution_id].update_index += 1
        if VERBOSE:
            print(f"Execution {execution_id} failed with error: {e}")
