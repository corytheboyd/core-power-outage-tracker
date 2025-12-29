"""Convert Colorado Public Address Composite shapefile to parquet."""

from pathlib import Path

import duckdb
import pandas as pd
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

    logger.info(f"Converting models to rows")
    rows = [m.to_row_data() for m in models]

    logger.info(f"Writing rows to parquet file: {OUTPUT_FILE_PATH}")
    output_df = pd.DataFrame(rows)
    output_df.to_parquet(OUTPUT_FILE_PATH, index=False, compression="gzip")

    logger.info(f"Converted {len(rows):,} addresses")

    con.close()


if __name__ == "__main__":
    main()
