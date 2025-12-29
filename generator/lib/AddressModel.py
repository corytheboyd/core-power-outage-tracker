from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AddressModel(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: int = Field(alias="OBJECTID")
    latitude: float = Field(alias="Latitude")
    longitude: float = Field(alias="Longitude")
    type: str | None = Field(alias="Place_Type")
    city: str = Field(alias="PlaceName")
    county: str = Field(alias="County")
    zipcode: str = Field(alias="Zipcode")
    address_street_name: str = Field(alias="StreetName")
    address_number: str = Field(alias="AddrNum")
    address_number_suffix: str | None = Field(alias="NumSuf")
    address_building: str | None = Field(alias="Building")
    address_floor: str | None = Field(alias="Floor")
    address_unit: str | None = Field(alias="Unit")

    street_pre_mod: str | None = Field(alias="St_PreMod")
    """
    Street Name Pre-Modifier: Word/phrase that precedes and modifies the street name

    Example: "Old" in "Old Highway 50"
    """

    street_pre_dir: str | None = Field(alias="PreDir")
    """
    Street Name Pre-Directional: Directional word preceding the street name

    Example: "North" in "North Main Street"
    """

    street_pre_type: str | None = Field(alias="PreType")
    """
    Street Name Pre-Type: Street type that precedes the street name

    Example: "Highway" in "Highway 50"
    """

    street_pre_sep: int | None = Field(alias="St_PreSep")
    """
    Street Name Pre-Type Separator: Preposition/phrase between the pre-type and street name

    Example: "of" in "Avenue of the Americas"
    """

    street_post_type: str | None = Field(alias="PostType")
    """
    Street Name Post-Type: Street type that follows the street name

    Example: "Avenue" in "Park Avenue", "Street" in "Main Street"
    """

    street_post_dir: str | None = Field(alias="PostDir")
    """
    (Street Name Post-Directional): Directional word following the street name
    Example: "Southwest" in "Canyon Road Southwest", Example: "East" in "42nd Street East"
    """

    street_post_mod: str | None = Field(alias="St_PosMod")
    """
    Street Name Post-Modifier: Word/phrase that follows and modifies the street name

    Example: "Extended" in "Main Street Extended", "Connector" in "Highway 50 Connector"
    """

    @field_validator(
        "type",
        "address_number_suffix",
        "address_building",
        "address_floor",
        "address_unit",
        "street_pre_mod",
        "street_pre_dir",
        "street_pre_type",
        "street_pre_sep",
        "street_post_type",
        "street_post_dir",
        "street_post_mod",
        mode="before",
    )
    @classmethod
    def convert_null_strings(cls, v: Any) -> Any:
        """Convert string '<Null>' values to None."""
        if isinstance(v, str) and v == "<Null>":
            return None
        return v

    def address_line_1(self) -> str:
        """Construct USPS-compliant address line 1 from NENA components."""
        parts = []

        # Primary address number
        if self.address_number:
            parts.append(self.address_number)
        if self.address_number_suffix:
            parts.append(self.address_number_suffix)

        # Street pre-components
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

        # Street post-components
        if self.street_post_type:
            parts.append(self.street_post_type)
        if self.street_post_dir:
            parts.append(self.street_post_dir)
        if self.street_post_mod:
            parts.append(self.street_post_mod)

        return " ".join(parts)

    def address_line_2(self) -> str:
        """Construct USPS-compliant address line 2 from secondary address components."""
        parts = []

        # Secondary unit designators (per USPS Pub 28)
        if self.address_building:
            parts.append(f"BLDG {self.address_building}")
        if self.address_floor:
            parts.append(f"FL {self.address_floor}")
        if self.address_unit:
            parts.append(f"UNIT {self.address_unit}")

        return " ".join(parts)

    def to_row_data(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "address_line_1": self.address_line_1().upper(),
            "address_line_2": self.address_line_2().upper(),
            "city": self.city.upper(),
            "zipcode": self.zipcode.upper(),
            "location": self.location,
        }
