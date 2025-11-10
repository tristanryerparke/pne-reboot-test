from functools import wraps


def add_node_name(name_value: str):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)

        # Add the name attribute to the wrapper function
        wrapper.node_name = name_value
        return wrapper

    return decorator
