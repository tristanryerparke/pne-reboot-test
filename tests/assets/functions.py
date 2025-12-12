def add(a: int, b: int) -> int:
    return a + b


def subtract(a: int, b: int) -> int:
    return a - b


def multiply(a: int, b: int) -> int:
    return a * b


def divide(a: int, b: int) -> float:
    return a / b


def power(a: int, b: int) -> int:
    return a**b


def percentage(x: float, percentage: int) -> float:
    return x * (percentage / 100)


def nth_root(x: float, root: int = 2) -> float:
    if x < 0:
        raise ValueError("Cannot compute the root of a negative number")
    if root <= 0:
        raise ValueError("Root must be a positive integer")
    return x ** (1 / root)


def add_with_union(a: int | float, b: int) -> float:
    return a + b


def process_data(x: int) -> int:
    print(f"Starting to process data with input: {x}")
    print("Step 1: Doubling the value...")
    result = x * 2
    print(f"Step 2: Result is {result}")
    print("Processing complete!")
    return result


def divide_by_zero(x: float) -> float:
    return x / 0
