"""Convert Colorado Public Address Composite shapefile to parquet."""

from pathlib import Path

import duckdb
from loguru import logger

from lib.AddressModel import AddressModel

# Paths
SHAPEFILE_ZIP_FILE_PATH = (
    Path(__file__).parent / "data" / "Colorado_Public_Address_Composite.zip"
)
OUTPUT_FILE_PATH = Path(__file__).parent / "data" / "addresses.parquet"
FULL_OUTPUT_FILE_PATH = Path(__file__).parent / "data" / "addresses_full.parquet"


def main():
    logger.info("Initialize duckdb")

    con = duckdb.connect()
    con.execute("INSTALL zipfs FROM community; LOAD zipfs")
    con.execute("INSTALL spatial; LOAD spatial")

    shapefile_path = (
        f"zip://{SHAPEFILE_ZIP_FILE_PATH}/Colorado_Public_Address_Composite.shp"
    )

    logger.info(f"Reading shapefile: {shapefile_path}")
    df = con.execute(
        f"""
        SELECT * 
        FROM ST_Read('{shapefile_path}')
        WHERE 1=1
        AND
            AddrNum IS NOT NULL
        AND
            StreetName IS NOT NULL
        AND
            PlaceName IS NOT NULL
    """
    ).df()

    logger.info(
        f"Exporting full address table to parquet file: {FULL_OUTPUT_FILE_PATH}"
    )
    df.to_parquet(FULL_OUTPUT_FILE_PATH, index=False)

    # Convert to list of dicts for sane processing
    logger.info(f"Parsing shapefile rows to models")
    models = [AddressModel(**r) for r in df.to_dict("records")]

    logger.info(f"Creating intermediate temp table")
    con.execute(
        """
        CREATE TABLE temp_addresses (
            id INTEGER,
            address_line_1 VARCHAR,
            address_line_2 VARCHAR,
            city VARCHAR,
            zipcode VARCHAR,
            latitude DOUBLE,
            longitude DOUBLE
         )
        """
    )
    con.executemany(
        "INSERT INTO temp_addresses VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            (
                model.id,
                model.address_line_1(),
                model.address_line_2(),
                model.city,
                model.zipcode,
                model.latitude,
                model.longitude,
            )
            for model in models
        ],
    )

    logger.info(f"Exporting addresses to parquet file: {OUTPUT_FILE_PATH}")
    con.execute(
        f"""
        COPY (
            SELECT
                id,
                address_line_1,
                address_line_2,
                city,
                zipcode,
                ST_AsWKB(ST_Point2D(latitude, longitude)) as location
            FROM temp_addresses
        )
        TO '{OUTPUT_FILE_PATH}'
        (FORMAT PARQUET)
    """
    )

    con.close()


if __name__ == "__main__":
    main()
