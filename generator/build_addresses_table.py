"""Convert Colorado Public Address Composite shapefile to parquet."""

from pathlib import Path

import duckdb

# Paths
SHAPEFILE_ZIP_FILE_PATH = Path(
    __file__).parent / "data" / "Colorado_Public_Address_Composite.zip"
OUTPUT_FILE_PATH = Path(__file__).parent / "data" / "addresses.parquet"
FULL_OUTPUT_FILE_PATH = Path(
    __file__).parent / "data" / "addresses_full.parquet"


def main():
    con = duckdb.connect()
    con.execute("INSTALL zipfs FROM community; LOAD zipfs")
    con.execute("INSTALL spatial; LOAD spatial")

    shapefile_path = f"zip://{SHAPEFILE_ZIP_FILE_PATH}/Colorado_Public_Address_Composite.shp"

    con.execute(f"""
        COPY (
            SELECT * FROM ST_Read('{shapefile_path}')
        ) TO '{FULL_OUTPUT_FILE_PATH}' (FORMAT PARQUET)
        ;
        COPY (
            SELECT
                OBJECTID AS id,
                geom AS location,
                AddrFull AS address,
                PlaceName AS city,
                Zipcode AS zipcode,
                MOD_DATE AS lastModifiedAt,
            FROM ST_Read('{shapefile_path}')
            WHERE
                AddrFull IS NOT NULL
            AND
                PlaceName IS NOT NULL
        ) TO '{OUTPUT_FILE_PATH}' (FORMAT PARQUET)
        ;
    """)

    count = \
        con.execute(f"SELECT COUNT(*) FROM '{OUTPUT_FILE_PATH}'").fetchone()[0]
    print(f"Converted {count:,} addresses")

    con.close()


if __name__ == "__main__":
    main()
