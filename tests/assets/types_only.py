from typing import Union

from app.schema_base import UserModel


# Type analysis is recursive and needs access to the file's globals
# which can only be accessed from analyzing a function's __globals__ property
def dummy_function_for_accessing_globals():
    pass


basic_single_types = {
    "int": int,
    "float": float,
    "str": str,
    "bool": bool,
    "list": list,
    "dict": dict,
}

# There are multiple ways to define unions in Python 3.10+ although we prefer the "|" notation
differing_union_types = {
    "int | float notation 1": Union[int, float],
    "int | float notation 2": int | float,
}

basic_union_types = {
    "int | str": int | str,
    "int | float": int | float,
    "int | bool | str": int | bool | str,
}

unions_in_list = {
    "list[int | float]": list[int | float],
    "list[int | bool | str]": list[int | bool | str],
}

# Simple generic type not assigned to a named alias
simple_generic = {
    "list[int]": list[int],
}


class Command(UserModel):
    body: str
    comment: str
    xcoord: float
    ycoord: float
    zcoord: float
    feedrate: int


user_model_aliases = {
    "Command": Command,
}
