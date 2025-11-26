import base64
import io
from typing import ClassVar, Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from PIL import Image as PILImage
from pydantic import BaseModel

from .cache import register_cached_type

router = APIRouter()


IMAGE_CACHE = {}
THUMBNAIL_MAX_SIZE = 500


class CachedImage:
    _is_cached_type: ClassVar[bool] = True

    def __init__(self, pil_image: PILImage.Image, cache_ref: str | None = None):
        self._image = pil_image
        self._cache_ref = cache_ref

    @classmethod
    def from_pil_image(cls, pil_image: PILImage.Image, cache_ref: str | None = None):
        return cls(pil_image, cache_ref)

    @classmethod
    def from_cache_ref(cls, cache_ref: str):
        pil_image = IMAGE_CACHE[cache_ref]
        return cls(pil_image, cache_ref)

    def to_cache(self) -> str:
        if self._cache_ref is None:
            self._cache_ref = str(uuid4())
            IMAGE_CACHE[self._cache_ref] = self._image
        return self._cache_ref

    def serialize(self) -> dict:
        # Create thumbnail - scale so larger side equals THUMBNAIL_MAX_SIZE
        width, height = self._image.size
        if width > height:
            new_width = THUMBNAIL_MAX_SIZE
            new_height = int((height / width) * THUMBNAIL_MAX_SIZE)
        else:
            new_height = THUMBNAIL_MAX_SIZE
            new_width = int((width / height) * THUMBNAIL_MAX_SIZE)

        thumbnail = self._image.copy()
        thumbnail.thumbnail((new_width, new_height), PILImage.Resampling.LANCZOS)

        # Convert thumbnail to base64
        thumb_buffer = io.BytesIO()
        thumbnail.save(thumb_buffer, format=self._image.format or "PNG")
        thumb_base64 = base64.b64encode(thumb_buffer.getvalue()).decode("utf-8")

        return {
            "cache_ref": self.to_cache(),
            "width": self._image.width,
            "height": self._image.height,
            "mode": self._image.mode,
            "thumb_base64": thumb_base64,
        }

    def filter(self, filter):
        result_img = self._image.filter(filter)
        return CachedImage(result_img)

    @property
    def size(self):
        return self._image.size

    @property
    def width(self):
        return self._image.width

    @property
    def height(self):
        return self._image.height

    @property
    def mode(self):
        return self._image.mode


register_cached_type("CachedImage", CachedImage)
register_cached_type("app.image.CachedImage", CachedImage)


class ImageUpload(BaseModel):
    filename: str
    img_base64: str


class ImageUploadResponse(BaseModel):
    cache_ref: str
    width: int
    height: int
    mode: str
    thumb_base64: str


@router.post("/upload", response_model=ImageUploadResponse)
async def upload_image(image_upload: ImageUpload):
    try:
        # Parse the image from base64
        img_data = base64.b64decode(image_upload.img_base64)
        img = PILImage.open(io.BytesIO(img_data))

        # Generate a unique cache reference
        cache_ref = str(uuid4())

        # Store the image in the cache
        IMAGE_CACHE[cache_ref] = img

        # Create thumbnail - scale so larger side equals THUMBNAIL_MAX_SIZE
        width, height = img.size
        if width > height:
            new_width = THUMBNAIL_MAX_SIZE
            new_height = int((height / width) * THUMBNAIL_MAX_SIZE)
        else:
            new_height = THUMBNAIL_MAX_SIZE
            new_width = int((width / height) * THUMBNAIL_MAX_SIZE)

        thumbnail = img.copy()
        thumbnail.thumbnail((new_width, new_height), PILImage.Resampling.LANCZOS)

        # Convert thumbnail to base64
        thumb_buffer = io.BytesIO()
        thumbnail.save(thumb_buffer, format=img.format or "PNG")
        thumb_base64 = base64.b64encode(thumb_buffer.getvalue()).decode("utf-8")

        return ImageUploadResponse(
            cache_ref=cache_ref,
            width=img.width,
            height=img.height,
            mode=img.mode,
            thumb_base64=thumb_base64,
        )

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to process image: {str(e)}"
        )
