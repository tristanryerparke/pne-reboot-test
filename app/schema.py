from typing import Any, ClassVar, Literal

from pydantic import BaseModel, ConfigDict, model_validator

from app.large_data.base import CachedDataWrapper
from app.schema_base import BASE_DATATYPES, CamelBaseModel, StructDescr, UnionDescr


# We don't want the fields on UserModel or MultipleOutputs to be converted to camel case
class MultipleOutputs(BaseModel):
    pass


class UserModel(BaseModel):
    _deconstruct_node: ClassVar[bool] = True
    _construct_node: ClassVar[bool] = True


class DataWrapper(CamelBaseModel):
    model_config = ConfigDict(extra="ignore")

    type: str | UnionDescr | StructDescr
    value: BASE_DATATYPES | None = None


# We allow arbitrary types on FunctionAsNode for passing it around in the backend
# But callable is removed when we serialize it
class FunctionSchema(CamelBaseModel):
    name: str
    callable_id: str
    category: list[str]
    file_path: str
    doc: str | None = None
    arguments: dict[str, DataWrapper | CachedDataWrapper]
    dynamic_input_type: StructDescr | None = None
    output_style: Literal["single", "multiple"] = "single"
    outputs: dict[str, DataWrapper | CachedDataWrapper]
    auto_generated: bool = False


class NodeDataFromFrontend(CamelBaseModel):
    callable_id: str
    arguments: dict[str, DataWrapper | CachedDataWrapper]
    outputs: dict[str, DataWrapper | CachedDataWrapper]
    output_style: Literal["single", "multiple"] = "single"

    @model_validator(mode="before")
    @classmethod
    def reconstruct_cached_types(cls, data: Any) -> Any:
        """
        Pre-processes data before validation to instantiate cached data types.

        This validator:
        1. Detects cached data by the presence of 'cacheKey' in the arguments
        2. Looks up the referenced_datamodel class from the TYPES registry
        3. Pre-instantiates the proper 3rd party datamodel instances
        4. Replaces the dict with the instance before Pydantic validates

        This allows 3rd party CachedDataWrapper subclasses to be properly instantiated
        without hardcoding union types in the schema.
        """
        from app.server import TYPES

        # Pre-process: replace dicts with instantiated cached models BEFORE validation
        if isinstance(data, dict):
            arguments = data.get("arguments", {})
            for arg_name, arg_value in arguments.items():
                if isinstance(arg_value, dict) and "cacheKey" in arg_value:
                    type_str = arg_value.get("type")
                    type_info = TYPES.get(type_str)

                    if type_info and type_info.get("kind") == "cached":
                        datamodel_class = type_info.get("referenced_datamodel")
                        if datamodel_class:
                            # Create properly typed instance with context
                            cached_instance = datamodel_class.model_validate(
                                arg_value, context={"populate_from_cache": True}
                            )
                            # Replace the dict with the instance in the data
                            arguments[arg_name] = cached_instance

        return data


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
