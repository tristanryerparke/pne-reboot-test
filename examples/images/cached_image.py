import base64
import io

from PIL import Image
from pydantic import (
    Field,
    computed_field,
)

from app.large_data.base import CachedDataWrapper

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


class CachedImageDataModel(CachedDataWrapper):
    """Cached image data wrapper for PIL Image objects"""

    value: Image.Image = Field(
        exclude=True, default=None
    )  # we can't send the image object to the frontend so we exclude it

    @classmethod
    def deserialize_to_cache(cls, data: dict) -> "CachedImageDataModel":
        """
        Deserialize image from base64 data uploaded from a non-execution action on the frontend.

        Expected data format:
        {
            "type": "Image",
            "filename": "example.png",
            "img_base64": "base64_encoded_string..."
        }
        """
        try:
            img_data = base64.b64decode(data["img_base64"])
            img = Image.open(io.BytesIO(img_data))

            return cls(
                type="Image",
                value=img,
            )
        except KeyError as e:
            raise ValueError(f"Missing required field for CachedImageDataModel: {e}")
        except Exception as e:
            raise ValueError(f"Failed to deserialize CachedImageDataModel: {str(e)}")

    @computed_field
    @property
    def preview(self) -> str:
        return generate_thumbnail_base64(self.value)

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
