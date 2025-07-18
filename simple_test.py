from fastapi import FastAPI
from pydantic import BaseModel, create_model
import inspect
from typing import get_type_hints


class Point2d(BaseModel):
    x: float
    y: float


def add(a: int, b: int) -> int:
    return a + b


def minus1(a: int, b: int = 1) -> int:
    return a - b


def length(a: str) -> int:
    return len(a)


def split(a: float, t: float) -> tuple[float, float]:
    return a * t, a * (1 - t)


def add_point(a: Point2d, b: Point2d) -> Point2d:
    return Point2d(x=a.x + b.x, y=a.y + b.y)


def get_y_mirror_and_origin(a: Point2d) -> tuple[Point2d, Point2d]:
    return Point2d(x=-a.x, y=a.y), a


def create_request_model(func):
    """Create a Pydantic model for function parameters to ensure JSON body usage."""
    sig = inspect.signature(func)
    type_hints = get_type_hints(func)

    fields = {}
    for param_name, param in sig.parameters.items():
        param_type = type_hints.get(param_name, str)
        if param.default != inspect.Parameter.empty:
            fields[param_name] = (param_type, param.default)
        else:
            fields[param_name] = (param_type, ...)

    return create_model(f"NodeParams_{func.__name__.title()}", **fields)


app = FastAPI()

funcs = [add, minus1, length, add_point, split, get_y_mirror_and_origin]

for func in funcs:
    request_model = create_request_model(func)

    def create_wrapper(original_func, req_model):
        def wrapper(request):
            sig = inspect.signature(original_func)
            kwargs = {}
            for param_name in sig.parameters:
                kwargs[param_name] = getattr(request, param_name)
            return original_func(**kwargs)

        wrapper.__annotations__ = {"request": req_model}
        return wrapper

    wrapper = create_wrapper(func, request_model)

    app.add_api_route(
        f"/{func.__name__}",
        wrapper,
        methods=["POST"],
        response_model=func.__annotations__.get("return"),
    )

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
