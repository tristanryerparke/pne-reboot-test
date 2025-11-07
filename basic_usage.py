import os
import sys

from devtools import debug as d

from app.analysis.utils import get_all_functions_and_types

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python basic_usage.py <filename or directory>")
        sys.exit(1)

    target_path: str = sys.argv[1]
    all_functions, all_types = get_all_functions_and_types(target_path)

    print("\n" + "=" * 50)
    print("RESULTS")
    print("=" * 50)
    print("\nAll Functions:")
    d(all_functions)
    print("\nAll Types:")
    d(all_types)
