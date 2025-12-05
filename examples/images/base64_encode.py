import base64
from io import BytesIO

from PIL.Image import Image

from app.display import add_node_options
from examples.images.cached_image import CachedImageDataModel


@add_node_options(
    cached_types=[
        {"argument_type": Image, "associated_datamodel": CachedImageDataModel}
    ],
)
def image_to_base64(image: Image) -> str:
    buffer = BytesIO()
    image.save(buffer, format="WEBP")
    buffer.seek(0)
    base64_str = base64.b64encode(buffer.read()).decode("utf-8")
    return base64_str
