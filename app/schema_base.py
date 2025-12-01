from typing import Literal, TypeAlias

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

# Base types that don't depend on anything
BASE_DATATYPES: TypeAlias = int | float | str


class CamelBaseModel(BaseModel):
    """The frontend uses camel case for its keys, this class handles
    automatic serialization and deserialization to and from camel case"""

    model_config = ConfigDict(
        alias_generator=to_camel,
        serialize_by_alias=True,
        populate_by_name=True,
    )


class UnionDescr(CamelBaseModel):
    any_of: list[str]


class StructDescr(CamelBaseModel):
    structure_type: Literal["list", "dict"]
    items_type: str | UnionDescr
