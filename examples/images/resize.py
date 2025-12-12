from PIL.Image import Image

from examples._custom_datatypes.cached_image import image_cached_datatype


@image_cached_datatype
def resize_image(image: Image, width: int, height: int) -> Image:
    resized_image = image.resize((width, height))
    return resized_image
