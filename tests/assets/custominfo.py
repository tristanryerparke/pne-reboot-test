from app.display import add_node_options


def add_with_docstring(a: int, b: int) -> int:
    """Adds two numbers together.

    Args:
        a (int): The first number.
        b (int): The second number.

    Returns:
        int: The sum of the two numbers.
    """

    return a + b


@add_node_options(node_name="Add With Custom Name")
def add_with_custom_name(a: int, b: int) -> int:
    return a + b


@add_node_options(return_value_name="area")
def calculate_rectangle_area(width: float, height: float) -> float:
    return width * height
