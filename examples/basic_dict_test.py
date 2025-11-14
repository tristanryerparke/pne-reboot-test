from app.display import add_node_options


@add_node_options(dict_inputs=True)
def create_dict_of_floats(**kwargs: float) -> dict[str, float]:
    return {**kwargs}
