from devtools import debug as d
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelBaseModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        serialize_by_alias=True,
        validate_by_name=True,
        validate_by_alias=True,
    )


class MotherFucker(CamelBaseModel):
    am_i_an_mf: bool
    are_you_an_mf: bool


if __name__ == "__main__":
    inst = MotherFucker(am_i_an_mf=False, are_you_an_mf=True)

    print("model_dump():")
    print(inst.model_dump())

    print("\nmodel_dump(by_alias=False):")
    print(inst.model_dump(by_alias=False))

    print("\nmodel_dump_json():")
    print(inst.model_dump_json())

    data_raw = {"amIAnMf": False, "areYouAnMf": True}

    data = MotherFucker.model_validate(data_raw)
    d(data)
