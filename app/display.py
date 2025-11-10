from functools import wraps


def add_node_options(
    node_name: str | None = None, return_value_name: str | None = None
):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)

        # Add the name attribute to the wrapper function if provided
        if node_name is not None:
            wrapper.node_name = node_name
        if return_value_name is not None:
            wrapper.return_value_name = return_value_name
        return wrapper

    return decorator
