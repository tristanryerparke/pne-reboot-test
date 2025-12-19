from devtools import debug as d
from fastapi import APIRouter

from app.execution.exec_utils import (
    VERBOSE,
    create_node_update,
    execute_node,
    topological_order,
)
from app.schema import Graph

router = APIRouter()


@router.post("/graph_execute")
async def execute_graph_sync(graph: Graph):
    """Execute a graph containing nodes and edges synchronously"""
    from app.server import TYPES

    execution_list = topological_order(graph)

    if VERBOSE:
        d(execution_list)

    updates = []

    for node in execution_list:
        if VERBOSE:
            print(f"Executing node {node.id}")
        success, result, terminal_output = execute_node(node.data)

        node_update = create_node_update(
            node, success, result, terminal_output, graph, execution_list, TYPES
        )

        updates.append(node_update)

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
                        argument_name: node_update["outputs"][
                            output_field_name
                        ].model_copy()
                    },
                }

                updates.append(downstream_update)

    update_message = {
        "status": "success",
        "updates": updates,
    }

    if VERBOSE:
        d(update_message)

    return update_message
