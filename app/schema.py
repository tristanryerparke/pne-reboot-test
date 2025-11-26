from typing import Any, ClassVar, Literal, TypeAlias

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelBaseModel(BaseModel):
    """The frontend uses camel case for its keys, this class handles 
    automatic serialization and deserialization to and from camel case"""
    model_config = ConfigDict(
        alias_generator=to_camel,
        serialize_by_alias=True,
        populate_by_name=True,
    )


# We don't want the fields on UserModel or MultipleOutputs to be converted to camel case
class MultipleOutputs(BaseModel):
    pass


class UserModel(BaseModel):
    _deconstruct_node: ClassVar[bool] = True
    _construct_node: ClassVar[bool] = True


class StructuredDataDescription(CamelBaseModel):
    structure_type: Literal["list", "dict"]
    items: str


BASE_DATATYPES: TypeAlias = int | float | str


class FieldDataWrapper(CamelBaseModel):
    type: str | StructuredDataDescription
    value: BASE_DATATYPES | None


# We allow arbitrary types on FunctionAsNode for passing it around in the backend
# But callable is removed when we serialize it
class FunctionSchema(CamelBaseModel):
    name: str
    callable_id: str
    category: list[str]
    file_path: str
    doc: str | None = None
    arguments: dict[str, FieldDataWrapper] = {}
    dynamic_input_type: StructuredDataDescription | None = None
    output_style: Literal["single", "multiple"]
    outputs: dict[str, FieldDataWrapper]
    auto_generated: bool = False


class NodeDataFromFrontend(CamelBaseModel):
    callable_id: str
    arguments: dict[str, dict[str, Any]]
    outputs: dict[str, dict[str, Any]]
    output_style: Literal["single", "multiple"]


class NodeFromFrontend(CamelBaseModel):
    id: str
    position: dict[str, float]
    data: NodeDataFromFrontend


class Edge(CamelBaseModel):
    id: str
    source: str
    sourceHandle: str
    target: str
    targetHandle: str


class Graph(CamelBaseModel):
    nodes: list[NodeFromFrontend]
    edges: list[Edge]
