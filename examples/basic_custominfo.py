import sys

sys.path.append("app")
from app.display import add_node_name


def add_with_docstring(a: int, b: int) -> int:
    """Adds two numbers together.

    Args:
        a (int): The first number.
        b (int): The second number.

    Returns:
        int: The sum of the two numbers.
    """

    return a + b


@add_node_name("Add With Custom Name")
def add_with_custom_name(a: int, b: int) -> int:
    return a + b
