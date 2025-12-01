import uuid
from typing import Any, ClassVar

from pydantic import (
    ConfigDict,
    Field,
    SerializerFunctionWrapHandler,
    model_serializer,
    model_validator,
)

from app.schema_base import CamelBaseModel, StructDescr

# Global cache for large data values
LARGE_DATA_CACHE = {}


class CachedDataWrapper(CamelBaseModel):
    """
    Base class for all cached data types (images, dataframes, audio, etc.)

    Cached types are:
    1. Too large to serialize in JSON responses (sent as preview instead)
    2. Stored in LARGE_DATA_CACHE during execution
    3. Uploaded via /upload_large_data endpoint
    4. Automatically discovered by functions_analysis.py via _is_cached_type marker
    5. Registered in server.TYPES dict with "kind": "cached" and "_class" attribute
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    _is_cached_type: ClassVar[bool] = True  # Marker for type discovery

    type: str | StructDescr  # str for simple types, StructDescr unions, dicts, lists
    value: Any = Field(exclude=True)
    cache_key: str = Field(default_factory=lambda: str(uuid.uuid4()))

    # @model_validator(mode="after")
    # def set_type_from_class_name(self):
    #     """Auto-populate type field with class name if not set"""
    #     if not self.type:
    #         self.type = self.__class__.__name__
    #     return self

    @model_serializer(mode="wrap")
    def serialize_with_cache_hook(self, handler: SerializerFunctionWrapHandler):
        """This is essentially a hook on the serialization process that ensures the cache data
        is populated before the data is sent to the frontend. This insures the frontend will always
        have a reference to the large data that was created in the backend.

        """
        LARGE_DATA_CACHE[self.cache_key] = self.value
        return handler(self)

    @classmethod
    def deserialize_to_cache(cls, data: dict) -> "CachedDataWrapper":
        """
        Deserialize from full data uploaded via the  frontend.
        MUST be overridden by subclasses to handle their specific data format.
        """

    @classmethod
    def from_cache_key(
        cls, cache_key: str, type_str: str | None = None
    ) -> "CachedDataWrapper":
        """
        Universal method to retrieve cached data by key.
        Works for all CachedDataWrapper subclasses.

        Used by graph.py to reconstruct cached values during execution.

        Args:
            cache_key: The key to look up in LARGE_DATA_CACHE
            type_str: Optional type string to set on the instance (e.g., "Image")
        """
        if cache_key not in LARGE_DATA_CACHE:
            raise ValueError(f"Cache key {cache_key} not found in LARGE_DATA_CACHE")

        value = LARGE_DATA_CACHE[cache_key]

        # Create instance with the cached value and type
        return cls(
            type=type_str
            or cls.__name__,  # Use provided type or fall back to class name
            value=value,  # type: ignore
            cache_key=cache_key,
        )


def is_cached_value(value) -> bool:
    """Helper to check if a value is a cached type instance"""
    return isinstance(value, CachedDataWrapper)
