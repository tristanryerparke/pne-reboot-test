from typing import List

from pydantic import BaseModel

Number = int | float


def typed_func_float(a: float, b: float) -> float:
    return a + b


def typed_func_number_pydantic(a: Number, b: Number) -> Number:
    return a + b


def add_string_pydantic(a: str = "a", b: str = "b") -> str:
    return a + b


class Point2D(BaseModel):
    x: float
    y: float


def add_point2d_pydantic(a: Point2D, b: Point2D) -> Point2D:
    return Point2D(x=a.x + b.x, y=a.y + b.y)


class Polygon(BaseModel):
    points: List[Point2D]


def add_polygon_pydantic(a: Polygon, b: Polygon) -> Polygon:
    return Polygon(points=a.points + b.points)


if __name__ == "__main__":
    # print(add_point2d(Point2D(1, 2), Point2D(1, 2)))
    print("Point2D.__annotations__:", Point2D.__annotations__)
