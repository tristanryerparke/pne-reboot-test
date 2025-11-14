from typing import Any, ClassVar, Literal

from pydantic import BaseModel


class MultipleOutputs(BaseModel):
    pass


class UserModel(BaseModel):
    _deconstruct_node: ClassVar[bool] = True
    _construct_node: ClassVar[bool] = True


# We allow arbitrary types on FunctionAsNode for passing it around in the backend
# But callable is removed when we serialize it
class FunctionSchema(BaseModel):
    name: str
    callable_id: str
    category: list[str]
    file_path: str
    doc: str | None = None
    arguments: dict[str, dict[str, Any]]
    dynamic_input_type: dict[str, str] | None = None
    output_style: Literal["single", "multiple"]
    outputs: dict[str, dict[str, Any]]
    auto_generated: bool = False


class NodeDataFromFrontend(BaseModel):
    callable_id: str
    arguments: dict[str, dict[str, Any]]
    outputs: dict[str, dict[str, Any]]
    output_style: Literal["single", "multiple"]


class NodeFromFrontend(BaseModel):
    id: str
    position: dict[str, float]
    data: NodeDataFromFrontend


class Edge(BaseModel):
    id: str
    source: str
    sourceHandle: str
    target: str
    targetHandle: str


class Graph(BaseModel):
    nodes: list[NodeFromFrontend]
    edges: list[Edge]
