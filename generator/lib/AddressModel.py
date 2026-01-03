from typing import Any, Annotated

import usaddress
from pydantic import BaseModel, ConfigDict, Field, BeforeValidator


def convert_null_string(v: Any) -> Any:
    """Convert string '<Null>' values to None."""
    if isinstance(v, str) and v == "<Null>":
        return None
    return v


DumbNullableStr = Annotated[str | None, BeforeValidator(convert_null_string)]

UnitPrefixes = ["APT", "UNIT"]


def has_unit_prefix(value: str) -> bool:
    v = value.upper()
    for prefix in UnitPrefixes:
        if v.startswith(prefix):
            return True
    return False


class AddressModel(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True, extra="ignore")

    id: int = Field(alias="OBJECTID")
    city: DumbNullableStr = Field(alias="PlaceName")
    county: DumbNullableStr = Field(alias="County")
    zipcode: DumbNullableStr = Field(alias="Zipcode")
    address_street_name: DumbNullableStr = Field(alias="StreetName")
    address_number: DumbNullableStr = Field(alias="AddrNum")
    address_number_suffix: DumbNullableStr = Field(alias="NumSuf")
    address_building: DumbNullableStr = Field(alias="Building")
    address_floor: DumbNullableStr = Field(alias="Floor")
    address_unit: DumbNullableStr = Field(alias="Unit")
    street_pre_mod: DumbNullableStr = Field(alias="St_PreMod")
    street_pre_dir: DumbNullableStr = Field(alias="PreDir")
    street_pre_type: DumbNullableStr = Field(alias="PreType")
    street_pre_sep: int | None = Field(alias="St_PreSep")
    street_post_type: DumbNullableStr = Field(alias="PostType")
    street_post_dir: DumbNullableStr = Field(alias="PostDir")
    street_post_mod: DumbNullableStr = Field(alias="St_PosMod")

    def address_line_1(self) -> str:
        """Construct USPS-compliant address line 1 from NENA components."""
        parts = []

        if self.address_number:
            parts.append(self.address_number)
        if self.address_number_suffix:
            parts.append(self.address_number_suffix)

        if self.street_pre_mod:
            parts.append(self.street_pre_mod)
        if self.street_pre_dir:
            parts.append(self.street_pre_dir)
        if self.street_pre_type:
            parts.append(self.street_pre_type)
        if self.street_pre_sep:
            parts.append(str(self.street_pre_sep))

        # Street name (required)
        if self.address_street_name:
            parts.append(self.address_street_name)

        if self.street_post_type:
            parts.append(self.street_post_type)
        if self.street_post_dir:
            parts.append(self.street_post_dir)
        if self.street_post_mod:
            parts.append(self.street_post_mod)

        return " ".join(parts).strip()

    def address_line_2(self) -> str:
        parts = []

        if self.address_building:
            parts.append(f"BLDG {self.address_building}")
        if self.address_floor:
            parts.append(f"FL {self.address_floor}")
        if self.address_unit:
            if has_unit_prefix(self.address_unit):
                parts.append(self.address_unit)
            else:
                parts.append(f"UNIT {self.address_unit}")

        return " ".join(parts).strip()

    def normalized_address(self) -> str:
        full_address = self.address_line_1()
        address_line_2 = self.address_line_2()
        if len(address_line_2) > 0:
            full_address += ", " + address_line_2

        parts = usaddress.parse(full_address)
        return " ".join([p[0].title() for p in parts])
