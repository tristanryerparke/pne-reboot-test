import time


def slow_add(a: int, b: int) -> int:
    for remaining in range(5, 0, -1):
        print(f"Adding {a} and {b} in {remaining} seconds")
        time.sleep(1)
    result = a + b
    print(f"{a} + {b} = {result}")
    return result
