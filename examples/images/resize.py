from PIL.Image import Image

from app.display import add_node_options
from examples._custom_datatypes.cached_image import CachedImageDataModel


@add_node_options(
    cached_types=[
        {"argument_type": Image, "associated_datamodel": CachedImageDataModel}
    ],
)
def resize_image(image: Image, width: int, height: int) -> Image:
    resized_image = image.resize((width, height))
    return resized_image
