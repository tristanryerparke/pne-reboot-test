from humps import camelize
from pydantic import BaseModel, ConfigDict


def to_camel(string):
    return camelize(string)


class CamelBaseModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    def model_dump(self, **kwargs):
        kwargs.setdefault("by_alias", True)
        return super().model_dump(**kwargs)

    def model_dump_json(self, **kwargs):
        kwargs.setdefault("by_alias", True)
        return super().model_dump_json(**kwargs)


class MotherFucker(CamelBaseModel):
    am_i_an_mf: bool
    are_you_an_mf: bool


if __name__ == "__main__":
    inst = MotherFucker(am_i_an_mf=False, are_you_an_mf=True)

    print("model_dump():")
    print(inst.model_dump())

    print("\nmodel_dump(by_alias=True):")
    print(inst.model_dump(by_alias=True))

    print("\nmodel_dump_json():")
    print(inst.model_dump_json())
