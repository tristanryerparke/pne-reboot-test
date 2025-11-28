from PIL import ImageFilter

from app.display import add_node_options
from examples.images.cached_image import CachedImage


@add_node_options(
    return_value_name="image_blurred",
    enable_cached_inputs=True,
)
def blur_image(image: CachedImage, radius: int = 40) -> CachedImage:
    return image.filter(ImageFilter.GaussianBlur((radius, radius)))
