from typing import Any, Callable, ClassVar, Literal

from pydantic import BaseModel, ConfigDict, Field


class MultipleOutputs(BaseModel):
    pass


class UserModel(BaseModel):
    _deconstruct_node: ClassVar[bool] = True
    _construct_node: ClassVar[bool] = True


# We allow arbitrary types on FunctionAsNode for passing it around in the backend
# But callable is removed when we serialize it
class FunctionAsNode(BaseModel):
    id: str | None = None
    name: str
    model_config = ConfigDict(arbitrary_types_allowed=True)
    callable: Callable | None = Field(exclude=True, default=None)
    category: list[str]
    doc: str | None = None
    arguments: dict[str, dict[str, Any]]
    output_style: Literal["single", "multiple"]
    outputs: dict[str, dict[str, Any]]
    # The position is only used for topological sort and does not need to be printed or serialized
    position: dict[str, float] | None = Field(exclude=True, repr=False, default=None)
    # file_location: tuple[str, int]


class Edge(BaseModel):
    id: str
    source: str
    sourceHandle: str
    target: str
    targetHandle: str


class Graph(BaseModel):
    nodes: list[FunctionAsNode]
    edges: list[Edge]


def create_graph_from_frontend_dict(data: dict[str, Any]) -> Graph:
    """React flow puts the nodes data inside a "data" object, but leaves the"""
    nodes = [
        FunctionAsNode(
            id=node["id"],
            name=node["data"]["name"],
            category=node["data"]["category"],
            doc=node["data"]["doc"],
            arguments=node["data"]["arguments"],
            output_style=node["data"]["output_style"],
            outputs=node["data"]["outputs"],
            position=node["position"],
            # file_location=node["data"]["file_location"]
        )
        for node in data["nodes"]
    ]
    edges = [Edge(**edge) for edge in data["edges"]]
    return Graph(nodes=nodes, edges=edges)
