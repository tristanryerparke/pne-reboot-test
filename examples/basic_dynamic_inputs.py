from python_node_editor.display import add_node_options


@add_node_options(list_inputs=True)
def create_list_of_floats(*args: float) -> list[float]:
    """This turns into a node on the frontend where you can add multiple inputs to create a list"""
    return [*args]


# @add_node_options(list_inputs=True)
# def create_list_of_floats_with_first_element(arg1: float, *args: float) -> list[float]:
#     """This turns into a node on the frontend where you can add multiple inputs to create a list"""
#     return [arg1, *args]


@add_node_options(dict_inputs=True)
def create_dict_of_floats(**kwargs: float) -> dict[str, float]:
    """This turns into a node on the frontend where you can add your own inputs with custom keys."""
    return {**kwargs}


# @add_node_options(dict_inputs=True)
# def create_dict_of_floats_with_first_key(
#     value1: float = 0, **kwargs: float
# ) -> dict[str, float]:
#     """This turns into a node on the frontend where you can add your own inputs with custom keys."""
#     return {"value1": value1, **kwargs}


def index_list_of_floats(the_list: list[float], index: int) -> float:
    """This turns into a node on the frontend where you can add multiple inputs to create a list"""
    return the_list[index]


def index_dict_of_floats(dict: dict[str, float], key: str) -> float:
    """This turns into a node on the frontend where you can add multiple inputs to create a dictionary"""
    return dict[key]
