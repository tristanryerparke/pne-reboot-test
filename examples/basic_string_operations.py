from app.display import add_node_options


def index_string(string: str, index: int) -> str:
    return string[index]


@add_node_options(list_inputs=True)
def join_strings(separator: str, *args: str) -> str:
    """This turns into a node on the frontend where you can add multiple inputs to create a list"""
    return separator.join(args)


def split_string(string: str, separator: str) -> list[str]:
    """This turns into a node on the frontend where you can add multiple inputs to create a list"""
    return string.split(separator)


def reverse_string(string: str) -> str:
    """This turns into a node on the frontend where you can add multiple inputs to create a list"""
    return string[::-1]
