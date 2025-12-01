def map_to_cached_type(cached_class):
    """Decorator to map a third-party class to a CachedDataModel subclass.

    This allows third-party classes (like PIL.Image.Image) to be automatically
    wrapped in CachedDataModel subclasses during type analysis.

    Usage:
        from PIL.Image import Image
        from examples.images.cached_image import CachedImageDataModel

        Image = map_to_cached_type(CachedImageDataModel)(Image)

        # Now functions using Image.Image in type annotations will
        # automatically use CachedImageDataModel for serialization
        def process(image: Image) -> Image:
            ...

    Args:
        cached_class: The CachedDataModel subclass to map to

    Returns:
        Decorator function that adds _cached_type_mapping attribute
    """

    def decorator(cls):
        cls._cached_type_mapping = cached_class
        return cls

    return decorator
