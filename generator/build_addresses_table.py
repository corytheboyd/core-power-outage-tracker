"""Convert Colorado Public Address Composite shapefile to parquet."""

from pathlib import Path

import duckdb

# Paths
SHAPEFILE_ZIP_FILE_PATH = Path(__file__).parent / "data" / "Colorado_Public_Address_Composite.zip"
OUTPUT_FILE_PATH = Path(__file__).parent / "data" / "addresses.parquet"

def main():
    con = duckdb.connect()
    con.execute("INSTALL spatial")
    con.execute("LOAD spatial")

    shapefile_path = f"zip://{SHAPEFILE_ZIP_FILE_PATH}/Colorado_Public_Address_Composite.shp"

    query = f"""
        COPY (
            SELECT
                geom AS location,
                COALESCE({addr_expr}, '') AS address,
                COALESCE({city_expr}, '') AS city,
                COALESCE({zip_expr}, '') AS zip
            FROM ST_Read('{shapefile_path}')
            WHERE geom IS NOT NULL
        ) TO '{OUTPUT_FILE_PATH}' (FORMAT PARQUET)
    """

    con.execute(query)

    count = con.execute(f"SELECT COUNT(*) FROM '{OUTPUT_FILE_PATH}'").fetchone()[0]
    print(f"Converted {count:,} addresses")

    con.close()

if __name__ == "__main__":
    main()
