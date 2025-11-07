from basic_user_model import Point2D
from pydantic import BaseModel


class Polygon(BaseModel):
    vertices: list[Point2D]


def move_polygon(polygon: Polygon, dx: float, dy: float) -> Polygon:
    """Move a polygon by a given amount in the x and y directions."""
    return Polygon(
        vertices=[
            Point2D(x=vertex.x + dx, y=vertex.y + dy) for vertex in polygon.vertices
        ]
    )
