from devtools import debug as d
from fastapi import APIRouter

from .schema import Graph, NodeDataFromFrontend, NodeFromFrontend

router = APIRouter()
VERBOSE = False


@router.post("/graph_execute")
async def execute_graph(graph: Graph):
    """Execute a graph containing nodes and edges"""

    execution_list = topological_order(graph)

    if VERBOSE:
        d(execution_list)

    updates = []

    for node in execution_list:
        if VERBOSE:
            print(f"Executing node {node.id}")
        result = execute_node(node.data)

        # Handle both single and multiple outputs
        output_style = node.data.output_style

        node_update = {"node_id": node.id, "outputs": {}, "inputs": {}}

        # Check if this node received inputs from other nodes via edges
        for edge in graph.edges:
            if edge.target == node.id:
                # Extract the argument name from targetHandle
                argument_name = edge.targetHandle.split(":")[-2]

                # Get the actual value that was propagated to this node
                actual_value = node.data.arguments[argument_name]["value"]
                actual_type = node.data.arguments[argument_name]["type"]

                node_update["inputs"][argument_name] = {
                    "value": actual_value,
                    "type": actual_type,
                }

        if output_style == "multiple":
            # For multiple outputs we need to get the model as a dict
            result_dict = result.model_dump()
            for output_name, output_def in node.data.outputs.items():
                # FIXME: We don't need to get the type from the result because the MultipleOutputs
                # Class is typed already... this could be a problem later on
                node_update["outputs"][output_name] = {
                    "type": output_def["type"],
                    "value": result_dict[output_name],
                }
        else:
            # For single output, use the entire result
            # The output key is already set correctly in the outputs dict (either return_value_name or "return")
            # Just get the first (and only) key from outputs
            output_key = list(node.data.outputs.keys())[0]
            node_update["outputs"][output_key] = {
                **node.data.outputs[output_key],
                "value": result,
            }

        # FIXME: What if an upstream node's type changes and the input is no longer compatible?

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
                    # Get the correct output key (either custom return_value_name or "return")
                    output_key = list(node.data.outputs.keys())[0]
                    output_type = node.data.outputs[output_key]["type"]

                # Extract target argument name from targetHandle
                argument_name = edge.targetHandle.split(":")[-2]

                # Update the target node's arguments for execution
                target_node = next(n for n in execution_list if n.id == edge.target)
                target_node.data.arguments[argument_name] = {
                    "value": output_value,
                    "type": output_type,
                }

        updates.append(node_update)

    update_message = {
        "status": "success",
        "updates": updates,
    }

    if VERBOSE:
        d(update_message)

    return update_message


def execute_node(node: NodeDataFromFrontend):
    """Finds a node's callable and executes it with the arguments from the frontend"""
    from app.server import CALLABLES

    callable = CALLABLES[node.callable_id]

    # Check if this function has list_inputs enabled
    if getattr(callable, "list_inputs", False):
        # For list_inputs functions:
        # - Named parameters (e.g., arg1) are passed as positional args first
        # - Numbered parameters (0, 1, 2...) are passed as *args after
        numbered_args = {}
        named_args = {}

        for k, v in node.arguments.items():
            # Handle both "_0", "_1" and "0", "1" naming patterns
            if k.isdigit():
                numbered_args[int(k)] = v["value"]
            else:
                named_args[k] = v["value"]

        # Sort numbered args by index
        sorted_numbered_args = [numbered_args[i] for i in sorted(numbered_args.keys())]

        # Get named args values in order (maintain dict order from frontend)
        named_args_values = list(named_args.values())

        # Combine: named parameters first, then dynamic numbered inputs
        all_args = named_args_values + sorted_numbered_args

        return callable(*all_args)
    # Check if this function has dict_inputs enabled
    elif getattr(callable, "dict_inputs", False):
        # For dict_inputs functions, all arguments are passed as **kwargs
        # The frontend should send them with their key names
        args = {k: v["value"] for k, v in node.arguments.items()}
        return callable(**args)
    else:
        # Normal execution with kwargs
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
