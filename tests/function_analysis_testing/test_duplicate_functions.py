import pytest
from devtools import debug as d

from app.analysis.utils import (
    DuplicateFunctionError,
    analyze_file,
    check_for_duplicate_callable_ids,
)


def test_duplicate_function_error():
    """Test that analyzing two files with the same function name raises DuplicateFunctionError."""

    file1_path = "tests/assets/duplicate_functions_file1.py"
    file2_path = "tests/assets/duplicate_functions_file2.py"

    # Analyze both files
    functions1, callables1, types1 = analyze_file(file1_path)
    functions2, callables2, types2 = analyze_file(file2_path)

    d(functions1)
    d(functions2)

    # Combine the function schemas
    all_functions = functions1 + functions2

    # This should raise DuplicateFunctionError
    with pytest.raises(DuplicateFunctionError) as exc_info:
        check_for_duplicate_callable_ids(all_functions)

    # Verify the error message contains information about both functions
    error_msg = str(exc_info.value)
    d(error_msg)

    assert "Duplicate function(s) found" in error_msg
    assert "add" in error_msg
    assert file1_path in error_msg
    assert file2_path in error_msg


if __name__ == "__main__":
    test_duplicate_function_error()
