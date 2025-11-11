from devtools import debug as d

from app.analysis.functions_analysis import analyze_function
from examples.basic_custominfo import (
    add_with_custom_name,
    add_with_docstring,
    calculate_rectangle_area,
)


def test_add_with_docstring():
    """Test that docstrings are correctly captured in the schema."""

    # Make sure the function works as expected
    assert add_with_docstring(3, 4) == 7

    _, schema, _, found_types = analyze_function(add_with_docstring)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "add_with_docstring"
    if schema.doc:
        assert schema.doc.startswith("Adds two numbers together.")
    else:
        assert False, "Docstring not found"
    assert schema.arguments == {
        "a": {"type": "int", "value": None},
        "b": {"type": "int", "value": None},
    }
    assert schema.output_style == "single"
    assert schema.outputs == {"return": {"type": "int"}}

    # Make sure we only found the int type
    d(found_types)
    assert found_types == {"int": {"kind": "builtin", "class": int}}


def test_add_with_custom_name():
    """Test that the @add_node_options decorator correctly sets a custom node name."""

    # Make sure the function works as expected
    assert add_with_custom_name(5, 6) == 11

    _, schema, _, found_types = analyze_function(add_with_custom_name)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "Add With Custom Name"
    assert schema.arguments == {
        "a": {"type": "int", "value": None},
        "b": {"type": "int", "value": None},
    }
    assert schema.output_style == "single"
    assert schema.outputs == {"return": {"type": "int"}}

    # Make sure we only found the int type
    d(found_types)
    assert found_types == {"int": {"kind": "builtin", "class": int}}


def test_custom_return_name():
    """Test that the @add_node_options decorator correctly sets a custom return value name."""

    # Make sure the function works as expected
    assert calculate_rectangle_area(10.0, 5.0) == 50.0

    _, schema, _, found_types = analyze_function(calculate_rectangle_area)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "calculate_rectangle_area"
    assert schema.arguments == {
        "width": {"type": "float", "value": None},
        "height": {"type": "float", "value": None},
    }
    assert schema.output_style == "single"
    assert schema.outputs == {"area": {"type": "float"}}

    # Make sure we only found the float type
    d(found_types)
    assert found_types == {"float": {"kind": "builtin", "class": float}}


if __name__ == "__main__":
    test_add_with_docstring()
    test_add_with_custom_name()
    test_custom_return_name()
