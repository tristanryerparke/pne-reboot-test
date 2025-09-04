from fastapi import APIRouter
from devtools import debug as d


router = APIRouter()


@router.post("/graph_execute")
async def execute_graph(graph: dict):
    """Execute a graph containing nodes and edges"""
    d(graph)

    execution_list = topological_order(graph)

    d(execution_list)

    updated_outputs = {}
    updated_inputs = {}

    for node_id in execution_list:
        # try:
        node = [node for node in graph["nodes"] if node["id"] == node_id][0]
        if not node:
            raise Exception(f"Node {node_id} not found")

        print(f"Executing node {node['id']}")
        result = execute_node(node)

        result_type = node["data"]["return"]["type"]

        updated_outputs[node_id] = {**node["data"]["return"], "value": result}

        for edge in graph["edges"]:
            if edge["source"] == node_id:
                target_handle = edge["targetHandle"]
                argument_name = target_handle.split(":")[-2]

                updated_inputs[edge["target"]] = {argument_name: {"value": result, "type": result_type}}

                for i, lookinfor in enumerate(graph["nodes"]):
                    if lookinfor["id"] == edge["target"]:
                        graph["nodes"][i]["data"]["arguments"][argument_name]["value"] = result
                        break

        # except Exception as e:
        #     d(e)
        #     from traceback import format_exc

        #     print(format_exc())
        #     return {"status": "error", "message": str(e)}

    d(updated_outputs)
    d(updated_inputs)
    d(graph)

    return {
        "status": "success",
        "updated_outputs": updated_outputs,
        "updated_inputs": updated_inputs,
    }


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
    Returns all nodes in topological order.
    """
    result: list[str] = []
    visited: set[str] = set()

    def visit(node_id: str):
        if node_id in visited:
            return
        visited.add(node_id)

        for e in graph["edges"]:
            visit(e["target"])

        result.append(node_id)

    # Sort nodes by x coordinate in ascending order
    sorted_nodes = sorted(graph["nodes"], key=lambda node: node["position"]["x"], reverse=True)

    for node in sorted_nodes:
        visit(node["id"])

    result.reverse()

    return result
