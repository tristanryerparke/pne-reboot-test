from devtools import debug as d

from app.analysis.utils import analyze_file

print("Analyzing basic_blur.py:")
functions, callables, types, types_datamodel = analyze_file(
    "examples/images/basic_blur.py"
)

print("\nFunctions:")
for func in functions:
    print(f"\n{func.name}:")
    print(f"  Arguments: {func.arguments}")
    print(f"  Outputs: {func.outputs}")

print("\nTypes:")
d(types)

print("\nTypes Datamodel:")
d(types_datamodel)
