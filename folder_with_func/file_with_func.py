from typing import Union, List
from pydantic import BaseModel


Number = Union[int, float]


def typed_func_float(a: float, b: float) -> float:
    return a + b


def typed_func_number(a: Number, b: Number) -> Number:
    return a + b


def add_string(a: str = "a", b: str = "b") -> str:
    return a + b


class Point2D(BaseModel):
    x: float
    y: float

    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y


def add_point2d(a: Point2D, b: Point2D) -> Point2D:
    return Point2D(a.x + b.x, a.y + b.y)


class Polygon(BaseModel):
    points: List[Point2D]

    def __init__(self, points: List[Point2D]):
        self.points = points


def add_polygon(a: Polygon, b: Polygon) -> Polygon:
    return Polygon(a.points + b.points)


if __name__ == "__main__":
    # print(add_point2d(Point2D(1, 2), Point2D(1, 2)))
    print("Point2D.__annotations__:", Point2D.__annotations__)
