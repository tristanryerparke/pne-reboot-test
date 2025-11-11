from devtools import debug as d

from app.analysis.functions_analysis import analyze_function
from examples.basic_multiple_outputs import (
    integer_division_multiple_outputs,
    integer_division_single_output,
)


def test_integer_division_multiple_outputs():
    """Test that functions returning MultipleOutputs are correctly analyzed with output_style='multiple'."""

    # Make sure the function works as expected
    result = integer_division_multiple_outputs(17, 5)
    assert result.quotient == 3
    assert result.remainder == 2

    _, schema, _, found_types = analyze_function(integer_division_multiple_outputs)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "integer_division_multiple_outputs"
    assert schema.arguments == {
        "numerator": {"type": "int", "value": None},
        "denominator": {"type": "int", "value": None},
    }
    assert schema.output_style == "multiple"
    assert schema.outputs == {
        "quotient": {"type": "int"},
        "remainder": {"type": "int"},
    }

    # Make sure we found the int type
    d(found_types)
    assert found_types == {"int": {"kind": "builtin", "class": int}}


def test_integer_division_single_output():
    """Test that a regular function with single output is correctly analyzed with output_style='single'."""

    # Make sure the function works as expected
    result = integer_division_single_output(17, 5)
    assert result == 3

    _, schema, _, found_types = analyze_function(integer_division_single_output)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "integer_division_single_output"
    assert schema.arguments == {
        "numerator": {"type": "int", "value": None},
        "denominator": {"type": "int", "value": None},
    }
    assert schema.output_style == "single"
    assert schema.outputs == {"return": {"type": "int"}}

    # Make sure we only found the int type
    d(found_types)
    assert found_types == {"int": {"kind": "builtin", "class": int}}


if __name__ == "__main__":
    test_integer_division_multiple_outputs()
    test_integer_division_single_output()
