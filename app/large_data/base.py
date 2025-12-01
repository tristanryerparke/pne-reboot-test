import uuid
from typing import Any, ClassVar

from pydantic import ConfigDict, Field, model_validator

from app.schema_base import CamelBaseModel, StructDescr

# Global cache for large data values
LARGE_DATA_CACHE = {}


class CachedDataModel(CamelBaseModel):
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

    type: str | StructDescr = ""  # str for simple types, StructDescr for complex types
    preview: str | None = None
    cache_key: str = Field(default_factory=lambda: str(uuid.uuid4()))

    @model_validator(mode="after")
    def set_type_from_class_name(self):
        """Auto-populate type field with class name if not set"""
        if not self.type:
            self.type = self.__class__.__name__
        return self

    def deserialize(self, data: dict):
        """Deserialize from cached/preview data (used when loading from frontend)"""
        self.type = data["type"]
        self.preview = data.get("preview")
        self.cache_key = data["cache_key"]

    @classmethod
    def deserialize_full(cls, data: dict) -> "CachedDataModel":
        """
        Deserialize from full data uploaded from frontend.
        MUST be overridden by subclasses to handle their specific data format.

        Args:
            data: Dictionary containing the full data from frontend upload
                  Should include: type, filename, and type-specific fields

        Returns:
            Instance of the CachedDataModel subclass with value populated
        """
        raise NotImplementedError(
            f"{cls.__name__} must implement deserialize_full() class method"
        )

    @classmethod
    def from_cache_key(cls, cache_key: str) -> "CachedDataModel":
        """
        Universal method to retrieve cached data by key.
        Works for all CachedDataModel subclasses.

        Used by graph.py to reconstruct cached values during execution.
        """
        if cache_key not in LARGE_DATA_CACHE:
            raise ValueError(f"Cache key {cache_key} not found in LARGE_DATA_CACHE")

        value = LARGE_DATA_CACHE[cache_key]

        # Create instance with the cached value
        # (type will be auto-populated by validator)
        return cls(
            value=value,  # type: ignore
            cache_key=cache_key,
        )

    def serialize(self) -> dict:
        """
        Serialize for frontend. Returns model_dump() by default.
        Subclasses use @model_serializer to customize.
        """
        return self.model_dump()


def is_cached_value(value) -> bool:
    """Helper to check if a value is a cached type instance"""
    return isinstance(value, CachedDataModel)
