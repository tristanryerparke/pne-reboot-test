from devtools import debug as d
from fastapi import APIRouter

router = APIRouter()


@router.post("/graph_execute")
async def execute_graph(graph: dict):
    """Execute a graph containing nodes and edges"""
    d(graph)

    execution_list = topological_order(graph)

    d(execution_list)

    output_updates = {}
    input_updates = {}

    for node_id in execution_list:
        node = [node for node in graph["nodes"] if node["id"] == node_id][0]
        if not node:
            raise Exception(f"Node {node_id} not found")

        print(f"Executing node {node['id']}")
        result = execute_node(node)

        # Handle both single and multiple outputs
        output_style = node["data"].get("output_style", "single")

        if output_style == "multiple":
            # For multiple outputs we need to get the model as a dict
            result_dict = result.model_dump()
            output_updates[node_id] = {}
            for output_name, output_def in node["data"]["outputs"].items():
                # FIXME: We don't need to get the type from the result because the MultipleOutputs
                # Class is typed already... this could be a probelm later on
                output_updates[node_id][output_name] = {
                    "type": output_def["type"],
                    "value": result_dict[output_name],
                }
        else:
            # For single output, use the entire result
            output_updates[node_id] = {
                **node["data"]["outputs"]["return"],
                "value": result,
            }

        # Propagate outputs to connected nodes
        for edge in graph["edges"]:
            if edge["source"] == node_id:
                # Extract the output field name from the sourceHandle
                # Format: nodeId:outputs:outputName:handle
                source_handle = edge["sourceHandle"]
                output_field_name = source_handle.split(":")[-2]

                # Get the value for this specific output field
                if output_style == "multiple":
                    output_value = getattr(result, output_field_name)
                    output_type = node["data"]["outputs"][output_field_name]["type"]
                else:
                    output_value = result
                    output_type = node["data"]["outputs"]["return"]["type"]

                # Extract target argument name from targetHandle
                target_handle = edge["targetHandle"]
                argument_name = target_handle.split(":")[-2]

                if edge["target"] not in input_updates:
                    input_updates[edge["target"]] = {}

                input_updates[edge["target"]][argument_name] = {
                    "value": output_value,
                    "type": output_type,
                }

                # Update the graph nodes arguments connected to that edge
                for i, target_node in enumerate(graph["nodes"]):
                    if target_node["id"] == edge["target"]:
                        graph["nodes"][i]["data"]["arguments"][argument_name][
                            "value"
                        ] = output_value
                        break

    update_message = {
        "status": "success",
        "output_updates": output_updates,
        "input_updates": input_updates,
    }
    d(update_message)

    return update_message


def execute_node(node: dict):
    from app.server import FUNCTIONS

    # Find the corresponding function

    function_name = node["data"]["name"]

    callable = FUNCTIONS[function_name]["callable"]

    args = {k: v["value"] for k, v in node["data"]["arguments"].items()}

    result = callable(**args)

    return result


def topological_order(graph: dict) -> list[str]:
    """
    Returns all nodes in topological order using DFS.
    Ensures dependencies are executed before dependents.
    """
    result: list[str] = []
    visited: set[str] = set()

    def visit(node_id: str):
        if node_id in visited:
            return
        visited.add(node_id)

        # Visit dependencies (sources) of this node first
        for e in graph["edges"]:
            if e["target"] == node_id:
                visit(e["source"])

        result.append(node_id)

    # Sort nodes by x-coordinate (left to right) to establish execution order for unconnected nodes
    sorted_nodes = sorted(graph["nodes"], key=lambda node: node["position"]["x"])

    # Visit all nodes in sorted order
    for node in sorted_nodes:
        visit(node["id"])

    return result
