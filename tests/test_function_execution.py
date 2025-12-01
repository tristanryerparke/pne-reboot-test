from devtools import debug as d

from app.analysis.functions_analysis import analyze_function
from app.schema import FieldDataWrapper, NodeDataFromFrontend, NodeFromFrontend
from app.schema_base import UnionDescr


def return_string_or_float_1(arg1: str, arg2: float) -> str | float:
    return 20.5


def return_string_or_float_2(arg1: str, arg2: float) -> str | float:
    return "mf2"


def setup_function_analysis(func):
    callable_id, func_schema, callable_obj, func_types = analyze_function(func)

    callables = {callable_id: callable_obj}
    functions = {func_schema.name: func_schema}
    types = func_types

    exec_data = NodeDataFromFrontend(
        callable_id=callable_id,
        arguments={
            "arg1": FieldDataWrapper(type="str", value="mf"),
            "arg2": FieldDataWrapper(type="float", value=3.14),
        },
        outputs={
            "return": FieldDataWrapper(type=UnionDescr(any_of=["str", "float"])),
        },
    )

    exec_node = NodeFromFrontend(
        id="abcdefg", data=exec_data, position={"x": 100, "y": 100}
    )

    return callable_obj, types, exec_node


# Test both functions
callable_obj_1, types_1, exec_node_1 = setup_function_analysis(return_string_or_float_1)
callable_obj_2, types_2, exec_node_2 = setup_function_analysis(return_string_or_float_2)

d(types_1)


def execute_function(node: NodeFromFrontend, callable_obj, types):
    node_data = node.data

    result = callable_obj(**node_data.arguments)

    # construct the output data object
    for output_type in node_data.outputs["return"].type.any_of:
        for type_name, type_def in types.items():
            if isinstance(result, type_def["_class"]):
                output_data = FieldDataWrapper(type=type_name, value=result)
                break
        else:
            raise ValueError(f"Unexpected output type: {type(result)}")

    update_object = {
        "id": node.id,
        "data": {
            "outputs": {
                "return": output_data,
            },
        },
    }

    d(update_object)


execute_function(exec_node_1, callable_obj_1, types_1)
execute_function(exec_node_2, callable_obj_2, types_2)
