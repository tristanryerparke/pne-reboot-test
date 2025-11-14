from app.display import add_node_options


@add_node_options(list_inputs=True)
def create_list_of_floats(*args: float) -> list[float]:
    return [*args]


def add_numbers(a: float, b: float) -> float:
    return a + b
