from typing import Any

from devtools import debug as d
from fastapi import APIRouter

from .schema import Edge, Graph, NodeDataFromFrontend, NodeFromFrontend

router = APIRouter()


@router.post("/graph_execute")
async def execute_graph(graph: Graph):
    """Execute a graph containing nodes and edges"""

    execution_list = topological_order(graph)

    d(execution_list)

    output_updates = {}
    input_updates = {}

    for node in execution_list:
        print(f"Executing node {node.id}")
        result = execute_node(node.data)

        # Handle both single and multiple outputs
        output_style = node.data.output_style

        if output_style == "multiple":
            # For multiple outputs we need to get the model as a dict
            result_dict = result.model_dump()
            output_updates[node.id] = {}
            for output_name, output_def in node.data.outputs.items():
                # FIXME: We don't need to get the type from the result because the MultipleOutputs
                # Class is typed already... this could be a problem later on
                output_updates[node.id][output_name] = {
                    "type": output_def["type"],
                    "value": result_dict[output_name],
                }
        else:
            # For single output, use the entire result
            output_updates[node.id] = {
                **node.data.outputs["return"],
                "value": result,
            }

        # Propagate outputs to connected nodes via edges
        for edge in graph.edges:
            if edge.source == node.id:
                # Extract the output field name from the sourceHandle
                # Format: nodeId:outputs:outputName:handle
                output_field_name = edge.sourceHandle.split(":")[-2]

                # Get the value for this specific output field
                if output_style == "multiple":
                    output_value = getattr(result, output_field_name)
                    output_type = node.data.outputs[output_field_name]["type"]
                else:
                    output_value = result
                    output_type = node.data.outputs["return"]["type"]

                # Extract target argument name from targetHandle
                argument_name = edge.targetHandle.split(":")[-2]

                if edge.target not in input_updates:
                    input_updates[edge.target] = {}

                input_updates[edge.target][argument_name] = {
                    "value": output_value,
                    "type": output_type,
                }

                # Update the target node's arguments for execution
                target_node = next(n for n in execution_list if n.id == edge.target)
                target_node.data.arguments[argument_name]["value"] = output_value

    update_message = {
        "status": "success",
        "output_updates": output_updates,
        "input_updates": input_updates,
    }
    d(update_message)

    return update_message


def execute_node(node: NodeDataFromFrontend):
    """Finds a node's callable and executes it with the arguments from the frontend"""
    from app.server import CALLABLES

    callable = CALLABLES[node.callable_id]
    args = {k: v["value"] for k, v in node.arguments.items()}
    return callable(**args)


def topological_order(graph: Graph) -> list[NodeFromFrontend]:
    """
    Returns all nodes in topological order using DFS.
    Ensures dependencies are executed before dependents.
    """
    result: list[NodeFromFrontend] = []
    visited: set[str] = set()

    # Create a mapping from node_id to NodeFromFrontend for quick lookup
    node_map: dict[str, NodeFromFrontend] = {node.id: node for node in graph.nodes}

    def visit(node_id: str):
        if node_id in visited:
            return
        visited.add(node_id)

        # Visit dependencies (sources) of this node first
        for edge in graph.edges:
            if edge.target == node_id:
                visit(edge.source)

        result.append(node_map[node_id])

    # Sort nodes by x-coordinate (left to right) to establish execution order for unconnected nodes
    sorted_nodes = sorted(
        graph.nodes, key=lambda node: node.position["x"] if node.position else 0
    )

    # Visit all nodes in sorted order
    for node in sorted_nodes:
        visit(node.id)

    return result
