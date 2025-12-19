import re
import time


def slow_add(a: int, b: int) -> int:
    for i in range(10):
        remaining = 10 - i
        print(f"Adding {a} and {b} in {remaining} seconds")
        time.sleep(1)
    result = a + b
    print(f"{a} + {b} = {result}")
    return result
