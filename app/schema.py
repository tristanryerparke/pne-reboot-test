from typing import Any, ClassVar, Literal

from pydantic import BaseModel, model_validator

from app.large_data.base import CachedDataWrapper
from app.schema_base import BASE_DATATYPES, CamelBaseModel, StructDescr, UnionDescr


# We don't want the fields on UserModel or MultipleOutputs to be converted to camel case
class MultipleOutputs(BaseModel):
    pass


class UserModel(BaseModel):
    _deconstruct_node: ClassVar[bool] = True
    _construct_node: ClassVar[bool] = True


class DataWrapper(CamelBaseModel):
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


FunctionSchema.model_rebuild()


class NodeDataFromFrontend(CamelBaseModel):
    callable_id: str
    arguments: dict[str, DataWrapper | CachedDataWrapper]
    outputs: dict[str, DataWrapper | CachedDataWrapper]
    output_style: Literal["single", "multiple"] = "single"

    @model_validator(mode="before")
    def reconstruct_cached_types(cls, data: Any) -> Any:
        """
        Reconstruct cached data types from cache keys before Pydantic validation.

        When the frontend sends cached data references (with cacheKey field), this validator:
        1. Detects them by the presence of 'cacheKey' field
        2. Looks up the type in the global TYPES registry
        3. Gets the referenced_datamodel class for that type
        4. Reconstructs the actual cached instance using from_cache_key()
        5. Replaces the raw dict with the instance before validation

        This allows 3rd party CachedDataWrapper subclasses to be properly instantiated
        without hardcoding union types in the schema.
        """
        if not isinstance(data, dict):
            return data

        # Import here to avoid circular imports
        from app.server import TYPES

        # Process arguments
        for arg_name, arg_value in data.get("arguments", {}).items():
            if isinstance(arg_value, dict) and "cacheKey" in arg_value:
                type_str = arg_value.get("type")
                cache_key = arg_value["cacheKey"]

                # Look up the type in the registry
                type_info = TYPES.get(type_str)
                if type_info and type_info.get("kind") == "cached":
                    datamodel_class = type_info.get("referenced_datamodel")
                    if datamodel_class:
                        # Reconstruct from cache and replace the dict with the instance
                        cached_instance = datamodel_class.from_cache_key(
                            cache_key, type_str
                        )
                        data["arguments"][arg_name] = cached_instance

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
