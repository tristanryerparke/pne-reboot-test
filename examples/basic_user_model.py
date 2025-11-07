import sys

sys.path.append("app")
from app.schema import UserModel


class Point2D(UserModel):
    x: float
    y: float


def two_point_distance(a: Point2D, b: Point2D) -> float:
    """Calculates the distance between two 2D points."""
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5


# if __name__ == "__main__":
#     p = Point2D(x=1.0, y=2.0)
#     print(p)
#     print(p._deconstruct_node)
#     print(p._construct_node)
