from PIL import ImageFilter
from PIL.Image import Image as PILImageClass

from app.analysis.decorators import map_to_cached_type
from app.display import add_node_options
from examples.images.cached_image import CachedImageDataModel

# Create the decorated 'Image' class that maps to CachedImageDataModel
Image = map_to_cached_type(CachedImageDataModel)(PILImageClass)


@add_node_options(
    return_value_name="image_blurred",
)
def blur_image(image: Image, radius: int = 40) -> Image:
    blurred_image = image.filter(ImageFilter.GaussianBlur((radius, radius)))
    return blurred_image
