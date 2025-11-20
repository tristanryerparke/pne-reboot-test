from app.schema import UserModel


class Point2D(UserModel):
    x: float
    y: float


def two_point_distance(a: Point2D, b: Point2D) -> float:
    """Calculates the distance between two 2D points."""
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5


# class Point3D(UserModel):
#     x: float
#     y: float
#     z: float


# def three_point_distance(a: Point3D, b: Point3D) -> float:
#     """Calculates the distance between two 3D points."""
#     return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2) ** 0.5
