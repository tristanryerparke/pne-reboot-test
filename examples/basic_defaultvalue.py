def nth_root(x: float, root: int = 2) -> float:
    if x < 0:
        raise ValueError("Cannot compute the root of a negative number")
    if root <= 0:
        raise ValueError("Root must be a positive integer")
    return x ** (1 / root)
