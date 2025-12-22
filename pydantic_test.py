from typing import Any

import shortuuid
from devtools import debug as d
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

CACHE = {}


class CachedDataWrapper(CamelBaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True, extra="ignore", serialize_by_alias=True
    )

    type: str
    value: Any | None = Field(exclude=True, default=None)
    cache_key: str | None = Field(
        serialization_alias="value",  # output as "value"
        default_factory=lambda: shortuuid.uuid(),
    )

    @model_validator(mode="before")
    @classmethod
    def extract_cache_key(cls, data):
        if isinstance(data, dict):
            raw_value = data.get("value")
            if isinstance(raw_value, str) and raw_value.startswith("$cacheKey:"):
                data = dict(data)
                data["cache_key"] = raw_value.split(":", 1)[1]
                data["value"] = None
        return data

    @field_serializer("cache_key")
    def serialize_cache_key(self, cache_key: str | None):
        if cache_key is None:
            return None
        return f"$cacheKey:{cache_key}"

    @model_serializer(mode="wrap")
    def serialize_with_cache_hook(self, handler: SerializerFunctionWrapHandler):
        CACHE[self.cache_key] = self.value
        return handler(self)

    @model_validator(mode="after")
    def populate_value_from_cache(self, info: ValidationInfo):
        should_populate = isinstance(info.context, dict) and info.context.get(
            "populate_from_cache", False
        )
        if should_populate and self.value is None and self.cache_key in CACHE:
            self.value = CACHE[self.cache_key]
        return self

    @classmethod
    def deserialize_to_cache(cls, data: dict):
        """
        Deserialize image from base64 data uploaded from a non-execution action on the frontend.

        Expected data format:
        {
            "type": "Image",
            "filename": "example.png",
            "img_base64": "base64_encoded_string..."
        }
        """
        # img_data = base64.b64decode(data["img_base64"])
        # img = ImageLibrary.open(io.BytesIO(img_data))
        # # Strip rotation data (not required)
        # img = ImageOps.exif_transpose(img)
        # img.info.pop("exif", None)
        #
        data_in_question = data["diq"]

        return cls(
            type="MyCustomData",
            value=data_in_question,
        )


class DataThatCantBeSerialzized:
    def __init__(self):
        self.data = "mf"


data_from_frontend = {"diq": DataThatCantBeSerialzized()}

mf1 = CachedDataWrapper.deserialize_to_cache(data_from_frontend)

d(mf1)

dumped = mf1.model_dump()
d(dumped)

mf2 = CachedDataWrapper.model_validate(dumped, context={"populate_from_cache": True})

d(mf2)
