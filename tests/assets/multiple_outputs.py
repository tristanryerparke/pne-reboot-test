from python_node_editor.schema import MultipleOutputs


class IntegerDivisionOutputs(MultipleOutputs):
    quotient: int
    remainder: int


def integer_division_multiple_outputs(
    numerator: int, denominator: int
) -> IntegerDivisionOutputs:
    quotient = numerator // denominator
    remainder = numerator % denominator
    return IntegerDivisionOutputs(quotient=quotient, remainder=remainder)


def integer_division_single_output(numerator: int, denominator: int) -> int:
    quotient = numerator // denominator
    return quotient
