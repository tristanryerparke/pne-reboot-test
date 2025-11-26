from typing import ClassVar, Protocol


class CachedType(Protocol):
    _is_cached_type: ClassVar[bool]

    @classmethod
    def from_cache_ref(cls, cache_ref: str): ...

    def serialize(self) -> dict: ...


CACHED_TYPE_REGISTRY: dict[str, type] = {}


def register_cached_type(type_name: str, cls: type):
    CACHED_TYPE_REGISTRY[type_name] = cls


def is_cached_value(value) -> bool:
    return hasattr(value, "_is_cached_type") and getattr(
        value, "_is_cached_type", False
    )
