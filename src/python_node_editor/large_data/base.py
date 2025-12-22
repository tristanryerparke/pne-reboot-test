import uuid
from typing import Any, ClassVar, Self

from pydantic import (
    ConfigDict,
    Field,
    SerializerFunctionWrapHandler,
    ValidationInfo,
    field_serializer,
    model_serializer,
    model_validator,
)

from python_node_editor.schema_base import CamelBaseModel

# Global cache for large data values
LARGE_DATA_CACHE = {}
CACHE_KEY_PREFIX = "$cacheKey:"


class CachedDataWrapper(CamelBaseModel):
    """
    Base class for all cached data types (so far just images)

    Cached types are too large to send back and forth with the execute and update messages.
    Instead we store them in LARGE_DATA_CACHE during execution with a cache_key.
    On the frontend there will be an upload input component that will populate the cache
    via the /upload_large_data endpoint which will return a value field like
    "$cacheKey:xxx" as a reference on the frontend.
    Subclasses of CachedDataWrapper can use pydantic's @computer_field decorator to add a preview
    (like a thumbnail) that gets sent back up along with the cache key.
    Then when the execute message gets recieved, the backend prorgamatically creates an instance of that
    subclass, and retrieves the value prop from the cache.

    Cached types get linked to a specifc type in the add_node_options decorator like so:
    @add_node_options(cached_types=[{
        "argument_type": Image,
        "associated_datamodel": CachedImageDataModel # which is the subclass in question
    }])
    def blur_image(image: Image, radius: int = 40) -> Image:

    This notation ensures creates the 'referenced_datamodel' property in the types dict like so:
    'Image': {
        'kind': 'cached',
        '_class': <class 'PIL.Image.Image'>,
        'category': [
            'examples',
            'images',
            'basic_blur',
        ],
        'referenced_datamodel': <class 'examples.images.cached_image.CachedImageDataModel'>,
    }

    the model validator in schema.py detects this and automatically populates the wrapper class with
    an instantiated instance of the subclass, which retrieves the value from the cache, which gets
    passed to the function we annotated.

    This also enables automatic exclusion of the full data when the updates are sent to the frontend,
    but the preview and other computed fields are sent.

    For propogating updates across edges, we just set the input's wrapper to a model_copy() of
    the wrapper subclass.
    """

    model_config = ConfigDict(
        arbitrary_types_allowed=True, extra="ignore", serialize_by_alias=True
    )
    _is_cached_type: ClassVar[bool] = True  # Marker for type discovery

    type: str  # TODO: can we have StructDescr unions, dicts, lists later?
    value: Any | None = Field(exclude=True, default=None)
    cache_key: str | None = Field(
        serialization_alias="value",
        default_factory=lambda: str(uuid.uuid4()),
    )

    @model_validator(mode="before")
    @classmethod
    def extract_cache_key(cls, data):
        if isinstance(data, dict):
            raw_value = data.get("value")
            if isinstance(raw_value, str) and raw_value.startswith(CACHE_KEY_PREFIX):
                data = dict(data)
                data["cache_key"] = raw_value.split(":", 1)[1]
                data["value"] = None
        return data

    @field_serializer("cache_key")
    def serialize_cache_key(self, cache_key: str | None):
        if cache_key is None:
            return None
        return f"{CACHE_KEY_PREFIX}{cache_key}"

    @model_validator(mode="after")
    def populate_value_from_cache(self, info: ValidationInfo):
        """
        Validation hook that populates the value field from the cache if it's not set.

        This allows the frontend to send just {type, value} and have the value
        automatically loaded from LARGE_DATA_CACHE during validation.

        Uses validation context to determine when to populate from cache.
        Only populates when context={'populate_from_cache': True} is passed.
        This ensures it only runs for frontend deserialization, not Python instantiation.
        """
        # Check if validation context requests cache population
        should_populate = isinstance(info.context, dict) and info.context.get(
            "populate_from_cache", False
        )

        if (
            should_populate
            and self.value is None
            and self.cache_key in LARGE_DATA_CACHE
        ):
            self.value = LARGE_DATA_CACHE[self.cache_key]
        return self

    @model_serializer(mode="wrap")
    def serialize_with_cache_hook(self, handler: SerializerFunctionWrapHandler):
        """This is essentially a hook on the serialization process that ensures the cache data
        is populated before the data is sent to the frontend. This insures the frontend will always
        have a reference to the large data that was created in the backend.

        """
        LARGE_DATA_CACHE[self.cache_key] = self.value
        return handler(self)

    @classmethod
    def deserialize_to_cache(cls, data: dict) -> Self:
        """
        Deserialize from full data uploaded via the  frontend.
        MUST be overridden by subclasses to handle their specific data format.
        """
        raise NotImplementedError

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
