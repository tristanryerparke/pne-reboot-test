import base64
import io

from PIL import Image
from pydantic import (
    Field,
    SerializerFunctionWrapHandler,
    computed_field,
    model_serializer,
)

from app.large_data.base import LARGE_DATA_CACHE, CachedDataModel

THUMBNAIL_MAX_SIZE = 25


def generate_thumbnail_base64(
    image: Image.Image, max_size: int = THUMBNAIL_MAX_SIZE
) -> str:
    width, height = image.size
    if width > height:
        new_width = max_size
        new_height = int((height / width) * max_size)
    else:
        new_height = max_size
        new_width = int((width / height) * max_size)

    thumbnail = image.copy()
    thumbnail.thumbnail((new_width, new_height), Image.Resampling.LANCZOS)

    thumb_buffer = io.BytesIO()
    thumbnail.save(thumb_buffer, format="WEBP")
    thumb_base64 = base64.b64encode(thumb_buffer.getvalue()).decode("utf-8")

    return thumb_base64


class CachedImageDataModel(CachedDataModel):
    """Cached image type for PIL Image objects"""

    value: Image.Image = Field(exclude=True)

    @classmethod
    def deserialize_full(cls, data: dict) -> "CachedImageDataModel":
        """
        Deserialize image from base64 data uploaded from a non-execution action on the frontend.

        Expected data format:
        {
            "type": "CachedImageDataModel",
            "filename": "example.png",
            "img_base64": "base64_encoded_string..."
        }
        """
        try:
            img_data = base64.b64decode(data["img_base64"])
            img = Image.open(io.BytesIO(img_data))

            return cls(
                type="CachedImageDataModel",
                value=img,
            )
        except KeyError as e:
            raise ValueError(f"Missing required field for CachedImageDataModel: {e}")
        except Exception as e:
            raise ValueError(f"Failed to deserialize CachedImageDataModel: {str(e)}")

    @model_serializer(mode="wrap")
    def serialize_model(self, handler: SerializerFunctionWrapHandler):
        """Serializing the model populates the thumbnail and the cache"""
        LARGE_DATA_CACHE[self.cache_key] = self.value
        self.preview = generate_thumbnail_base64(self.value)
        return handler(self)

    @computed_field
    @property
    def size(self) -> tuple[int, int]:
        return self.value.size

    @computed_field
    @property
    def width(self) -> int:
        return self.value.width

    @computed_field
    @property
    def height(self) -> int:
        return self.value.height

    @computed_field
    @property
    def mode(self) -> str:
        return self.value.mode
