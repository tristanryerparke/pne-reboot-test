import inspect
import types
from typing import Union, get_args, get_origin


def func_with_pipe(x: int | float) -> str:
    return str(x)


def func_with_union(x: Union[int, float]) -> str:
    return str(x)


# Get the annotations
pipe_annotation = inspect.signature(func_with_pipe).parameters["x"].annotation
union_annotation = inspect.signature(func_with_union).parameters["x"].annotation

print("=== Type Representations ===")
print(f"Pipe union (int | float): {pipe_annotation}")
print(f"Union[int, float]: {union_annotation}")
print()

print("=== Type Classes ===")
print(f"Pipe union type: {type(pipe_annotation)}")
print(f"Union type: {type(union_annotation)}")
print()

print("=== Are they equal? ===")
print(f"pipe_annotation == union_annotation: {pipe_annotation == union_annotation}")
print(f"pipe_annotation is union_annotation: {pipe_annotation is union_annotation}")
print()

print("=== get_origin() ===")
print(f"get_origin(pipe_annotation): {get_origin(pipe_annotation)}")
print(f"get_origin(union_annotation): {get_origin(union_annotation)}")
print()

print("=== get_args() ===")
print(f"get_args(pipe_annotation): {get_args(pipe_annotation)}")
print(f"get_args(union_annotation): {get_args(union_annotation)}")
print()

print("=== Instance checks ===")
print(
    f"isinstance(pipe_annotation, types.UnionType): {isinstance(pipe_annotation, types.UnionType)}"
)
print(
    f"isinstance(union_annotation, types.UnionType): {isinstance(union_annotation, types.UnionType)}"
)
print()

print("=== __class__.__name__ ===")
print(f"pipe_annotation.__class__.__name__: {pipe_annotation.__class__.__name__}")
print(f"union_annotation.__class__.__name__: {union_annotation.__class__.__name__}")
