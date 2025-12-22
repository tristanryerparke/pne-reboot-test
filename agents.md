5. When creating tests for function analysis use this file as a reference for how to write the assertions:

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

if __name__ == "__main__":
    test_on_simple_add()


6. You can use the app's cli to run the backend analysis functions like so: uv run pne-run-analyze examples/basic_dynamic_inputs.py -v

7. I'm using Pydantic V2 in this project.
