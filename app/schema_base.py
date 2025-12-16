from typing import ClassVar, Literal, TypeAlias

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class UserModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    _deconstruct_node: ClassVar[bool] = True
    _construct_node: ClassVar[bool] = True


# Base types that don't depend on anything
# Note: UserModel is included to support user-defined model instances
# Note: list and dict are included to support structured types like list[float], dict[str, float]
BASE_DATATYPES: TypeAlias = int | float | str | list | dict | UserModel


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


class TypeDefModel(BaseModel):
    """Base model for type definitions. Does not use CamelBaseModel."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    kind: str
    class_: type | None = Field(default=None, exclude=True)


class UserTypeDefModel(TypeDefModel):
    """Type definition for user-defined models with properties"""

    category: list[str]
    properties: dict[str, str | StructDescr | UnionDescr] | None = None


class CachedTypeDefModel(TypeDefModel):
    """Type definition for cached types"""

    category: list[str]
    referenced_datamodel: type | None = Field(default=None, exclude=True)
