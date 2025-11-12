from devtools import debug as d

from app.analysis.functions_analysis import analyze_function
from examples.basic_percentage import percentage
from examples.integer_math import add


def test_on_simple_add():
    """Test the analysis of the simple addition function from examples.integer_math and confirm the schema and found types are correct."""

    # Make sure the function works as expected
    assert add(1, 2) == 3

    _, schema, _, found_types = analyze_function(add)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "add"
    assert schema.arguments == {
        "a": {"type": "int", "value": None},
        "b": {"type": "int", "value": None},
    }
    assert schema.output_style == "single"
    assert schema.outputs == {"return": {"type": "int"}}

    # Make sure we only found the int type
    d(found_types)
    assert found_types == {"int": {"kind": "builtin", "class": int}}


def test_find_float_and_int():
    """Test the analysis of the percentage function from examples.basic_percentage and confirm the schema and found types are correct."""

    # Make sure the function works as expected
    assert percentage(100.0, 50) == 50.0

    _, schema, _, found_types = analyze_function(percentage)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "percentage"
    assert schema.arguments == {
        "x": {"type": "float", "value": None},
        "percentage": {"type": "int", "value": None},
    }
    assert schema.output_style == "single"
    assert schema.outputs == {"return": {"type": "float"}}

    # Make sure we found both float and int types
    d(found_types)
    assert found_types == {
        "float": {"kind": "builtin", "class": float},
        "int": {"kind": "builtin", "class": int},
    }


if __name__ == "__main__":
    test_on_simple_add()
    test_find_float_and_int()
