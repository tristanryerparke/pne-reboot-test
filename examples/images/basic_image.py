from PIL import ImageFilter

from app.display import add_node_options
from app.image import CachedImage


@add_node_options(
    return_value_name="image_blurred",
    enable_cached_inputs=True,
)
def blur_image(image: CachedImage, radius: int) -> CachedImage:
    return image.filter(ImageFilter.GaussianBlur(radius))
