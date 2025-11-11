from app.schema import UserModel


class Vector2D(UserModel):
    x: float
    y: float


# This function purposely doesn't use the UserModel class
def add(a: int, b: int) -> int:
    return a + b
