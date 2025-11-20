from app.display import add_node_options


@add_node_options(list_inputs=True)
def problem_test(*args: str | float) -> str:
    return str(type(args))
