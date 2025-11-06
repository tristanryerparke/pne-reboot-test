from devtools import debug as d
from pydantic import BaseModel


class MultipleOutputs(BaseModel):
    pass


class IntegerDivisionOutputs(MultipleOutputs):
    quotient: int
    remainder: int


def integer_division(numerator: int, denominator: int) -> IntegerDivisionOutputs:
    quotient = numerator // denominator
    remainder = numerator % denominator
    return IntegerDivisionOutputs(quotient=quotient, remainder=remainder)


def integer_division_2(numerator: int, denominator: int) -> int:
    quotient = numerator // denominator
    return quotient


if __name__ == "__main__":
    import inspect
    import typing

    func_entry = {}

    func = integer_division

    # Get the function signature and type hints
    sig = inspect.signature(func)
    type_hints = typing.get_type_hints(func)

    # Parse the arguments
    func_entry["arguments"] = {}
    for arg in sig.parameters.values():
        ann = type_hints.get(arg.name, arg.annotation)
        # You need to type annotate!
        if ann is inspect.Parameter.empty:
            raise Exception(f"Parameter {arg.name} has no annotation")
        arg_entry: dict[str, str | None] = {"type": str(ann.__name__)}
        if arg.default is not inspect.Parameter.empty:
            arg_entry["value"] = arg.default
        else:
            arg_entry["value"] = None
        func_entry["arguments"][arg.name] = arg_entry

    # Detect the use of the MultipleOutputs class or just a regular return type
    ret_ann = type_hints.get("return", sig.return_annotation)
    func_entry["outputs"] = {}
    if inspect.isclass(ret_ann) and issubclass(ret_ann, MultipleOutputs):
        # Get the model fields using Pydantic's model_fields
        func_entry["output_style"] = "multiple"
        for field_name, field_info in ret_ann.model_fields.items():
            if field_info.annotation is not None:
                output_entry = {"type": str(field_info.annotation.__name__)}
                func_entry["outputs"][field_name] = output_entry
    else:
        func_entry["output_style"] = "single"
        func_entry["outputs"]["return"] = {"type": str(ret_ann.__name__)}

    d(func_entry)
