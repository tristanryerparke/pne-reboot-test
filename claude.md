1. For the backend I am using `uv` as the package manager and script runner.
    A. Install all python packages using `uv add xxx`
    B. Run all python scripts using `uv run xxx.py`
2. For the frontend (in the 'frontend/') I am using `bun` as the package manager and script runner.
    A. Install all typescript packages using `bun add xxx`
    B. Test for compilation errors using `bunx tsc -b`
    C. Run all scripts using `bunx` instead of `npx` 
    

3. When writing python functions, don't add docstrings unless prompted.
4. When editing python functions, don't add typing on your own unless fixing the types on an already typed function.
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
8. If I phrase my prompt as a question, don't immediately go into file editing mode. Answer the question first, pause and wait for further instructions.

9. If we change the name of a data's property or a function/class name, grep the code base for the old name and be sure to update all references.
