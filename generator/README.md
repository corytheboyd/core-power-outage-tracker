# generator

## Data Learnings

These fields are part of the NENA (National Emergency Number Association) NG9-1-1 GIS Data Model standard, which defines standardized address components for emergency services.

  Field Definitions (build_addresses_table.py:28-31)

  - St_PreMod (Street Name Pre-Modifier): Word/phrase that precedes and modifies the street name
    - Example: "Old" in "Old Highway 50"
  - St_PreDir (Street Name Pre-Directional): Directional word preceding the street name
    - Example: "North" in "North Main Street"
  - St_PreType (Street Name Pre-Type): Street type that precedes the street name
    - Example: "Highway" in "Highway 50"
  - St_PreSep (Street Name Pre-Type Separator): Preposition/phrase between the pre-type and street name
    - Example: "of" in "Avenue of the Americas"
  - PostType (Street Name Post-Type): Street type that follows the street name
    - Example: "Avenue" in "Park Avenue"
    - Example: "Street" in "Main Street"
  - PostDir (Street Name Post-Directional): Directional word following the street name
    - Example: "Southwest" in "Canyon Road Southwest"
    - Example: "East" in "42nd Street East"
  - St_PosMod (Street Name Post-Modifier): Word/phrase that follows and modifies the street name
    - Example: "Extended" in "Main Street Extended"
    - Example: "Connector" in "Highway 50 Connector"


  Specification

  The current standard is NENA-STA-006.2-2022 (ANSI approved Sept 2022). This standard is used by:
  - Emergency 9-1-1 services
  - National Address Database (NAD)
  - Colorado's Public Address Composite dataset (which you're using)

  Sources:

  - https://cdn.ymaws.com/www.nena.org/resource/resmgr/standards/nena-sta-006.2-2022_ng9-1-1_.pdf
  - https://www.transportation.gov/sites/dot.gov/files/docs/mission/gis/national-address-database/308816/nad-schema-v1.pdf
  - https://www.nena.org/page/standards
  - https://github.com/NENA911/NG911GISDataModel
