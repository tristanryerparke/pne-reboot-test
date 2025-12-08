from PIL.Image import Image

from app.display import add_node_options
from examples._custom_datatypes.cached_image import CachedImageDataModel


@add_node_options(
    cached_types=[
        {"argument_type": Image, "associated_datamodel": CachedImageDataModel}
    ],
)
def crop(
    image: Image,
    left: int = 0,
    top: int = 0,
    right: int = 0,
    bottom: int = 0,
) -> Image:
    width, height = image.size

    crop_box = (
        left,
        top,
        width - right,
        height - bottom,
    )

    cropped_image = image.crop(crop_box)
    return cropped_image
