from PIL import ImageFilter
from PIL.Image import Image

from app.display import add_node_options
from examples._custom_datatypes.cached_image import CachedImageDataModel


@add_node_options(
    # return_value_name="image_blurred",
    cached_types=[
        {"argument_type": Image, "associated_datamodel": CachedImageDataModel}
    ],
)
def blur_image(image: Image, radius: int = 40) -> Image:
    blurred_image = image.filter(ImageFilter.GaussianBlur((radius, radius)))
    return blurred_image
