from fastapi import APIRouter
from devtools import debug as d

router = APIRouter()


@router.post("/graph_execute")
async def execute_graph(graph: dict):
    """Execute a graph containing nodes and edges"""
    d(graph)

    return {"status": "success", "message": "Graph execution completed"}


# def topological_order(self) -> list[NodeId]:
#     """
#     Returns all nodes in topological order.
#     """
#     result: list[NodeId] = []
#     visited: set[NodeId] = set()

#     def visit(node_id: NodeId):
#         if node_id in visited:
#             return
#         visited.add(node_id)

#         for e in self.edges_from(node_id):
#             visit(e.target.id)

#         result.append(node_id)

#     for node_id in self.nodes:
#         visit(node_id)

#     return result
