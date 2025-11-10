from functools import wraps
from typing import Any, Callable, TypeVar, cast

F = TypeVar("F", bound=Callable[..., Any])


def add_node_options(
    node_name: str | None = None, return_value_name: str | None = None
):
    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)

        # Add the name attribute to the wrapper function if provided
        if node_name is not None:
            wrapper.node_name = node_name  # type: ignore
        if return_value_name is not None:
            wrapper.return_value_name = return_value_name  # type: ignore
        return cast(F, wrapper)

    return decorator
