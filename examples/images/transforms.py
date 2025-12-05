from PIL.Image import Image, Transpose

from app.display import add_node_options
from examples._custom_datatypes.cached_image import CachedImageDataModel


@add_node_options(
    cached_types=[
        {"argument_type": Image, "associated_datamodel": CachedImageDataModel}
    ],
    return_value_name="flipped",
)
def flip_horizontal(image: Image) -> Image:
    flipped_image = image.transpose(Transpose.FLIP_LEFT_RIGHT)
    return flipped_image


@add_node_options(
    cached_types=[
        {"argument_type": Image, "associated_datamodel": CachedImageDataModel}
    ],
    return_value_name="flipped",
)
def flip_vertical(image: Image) -> Image:
    flipped_image = image.transpose(Transpose.FLIP_TOP_BOTTOM)
    return flipped_image


@add_node_options(
    cached_types=[
        {"argument_type": Image, "associated_datamodel": CachedImageDataModel}
    ],
)
def rotate_image(image: Image, angle: float = 90) -> Image:
    rotated_image = image.rotate(angle, expand=True)
    return rotated_image
