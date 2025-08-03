from fastapi import APIRouter
from devtools import debug as d


router = APIRouter()


@router.post("/graph_execute")
async def execute_graph(graph: dict):
    """Execute a graph containing nodes and edges"""
    d(graph)

    nodes = graph["nodes"]
    edges = graph["edges"]

    execution_list = topological_order(nodes, edges)

    for node_id in execution_list:
        execute_node([node for node in nodes if node["id"] == node_id][0])

    d(execution_list)

    return {"status": "success", "message": "Graph execution completed"}


def execute_node(node: dict):
    from app.server import FUNCTIONS

    # Find the corresponding function

    function_name = node["data"]["name"]

    callable = FUNCTIONS[function_name]["callable"]

    args = {k: v["value"] for k, v in node["data"]["arguments"].items()}

    result = callable(**args)

    return result


def topological_order(nodes: list[dict], edges: list[dict]) -> list[str]:
    """
    Returns all nodes in topological order.
    """
    result: list[str] = []
    visited: set[str] = set()

    def visit(node_id: str):
        if node_id in visited:
            return
        visited.add(node_id)

        for e in edges:
            visit(e["target"])

        result.append(node_id)

    # Sort nodes by x coordinate in ascending order
    sorted_nodes = sorted(nodes, key=lambda node: node["position"]["x"])

    for node in sorted_nodes:
        visit(node["id"])

    return result
