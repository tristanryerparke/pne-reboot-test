from python_node_editor.display import add_node_options


@add_node_options(list_inputs=True)
def problem_test(*args: str | float, my_arg: str) -> str:
    return str(type(args)) + " " + my_arg
