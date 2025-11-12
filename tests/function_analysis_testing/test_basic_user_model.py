from devtools import debug as d

from app.analysis.functions_analysis import analyze_function
from examples.basic_user_model import Point2D, two_point_distance
from tests.assets.user_model_not_used_in_function import add


def test_user_model_detection():
    """Analyzes the two_point_distance function and verifies the correct parsing of
    its arguments, the Point2D user model"""

    # Make sure the function works as expected
    p1 = Point2D(x=0.0, y=0.0)
    p2 = Point2D(x=3.0, y=4.0)
    assert two_point_distance(p1, p2) == 5.0

    _, schema, _, found_types = analyze_function(two_point_distance)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "two_point_distance"
    assert schema.arguments == {
        "a": {"type": "Point2D", "value": None},
        "b": {"type": "Point2D", "value": None},
    }
    assert schema.output_style == "single"
    assert schema.outputs == {"return": {"type": "float"}}

    # Make sure we found the Point2D UserModel and float type
    d(found_types)
    assert "float" in found_types
    assert found_types["float"] == {"kind": "builtin", "_class": float}
    assert "Point2D" in found_types
    assert found_types["Point2D"]["kind"] == "user_model"
    assert found_types["Point2D"]["_class"] == Point2D
    assert found_types["Point2D"]["properties"] == {"x": "float", "y": "float"}


def test_user_model_not_used_in_function():
    """Tests that the Point2D model is not discovered even though it is defined
    in the same file as a function that is analyzed"""
    _, schema, _, found_types = analyze_function(add)
    d(schema)

    assert schema.name == "add"
    assert schema.arguments == {
        "a": {"type": "int", "value": None},
        "b": {"type": "int", "value": None},
    }
    assert schema.output_style == "single"
    assert schema.outputs == {"return": {"type": "int"}}

    # Make sure we only found the int type and not any of the types associated with the Point2D model
    d(found_types)
    assert "Point2D" not in found_types
    assert "float" not in found_types


if __name__ == "__main__":
    test_user_model_detection()
    # test_user_model_not_used_in_function()
