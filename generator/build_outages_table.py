"""Fetch and process CORE power outage polyline data."""

from pathlib import Path

import duckdb

from lib.LinesResponseModel import LinesResponseModel

# Paths
INPUT_JSON = Path(__file__).parent / "data" / "temp.json"
OUTPUT_PARQUET = Path(__file__).parent / "data" / "outages.parquet"


def main():
    with open(INPUT_JSON) as f:
        response = LinesResponseModel.model_validate_json(f.read())

    # Use DuckDB to create LINESTRING_2D geometries and save to parquet
    con = duckdb.connect()
    con.execute("INSTALL spatial; LOAD spatial")

    con.execute(
        """
        CREATE TABLE outages
        (
            linestring BLOB
        )
        """
    )

    con.executemany(
        """
        INSERT INTO outages
        VALUES (?)
        """,
        [(line.to_wkb(),) for line in response.lines],
    )

    con.execute(
        f"""
        COPY outages TO '{OUTPUT_PARQUET}' (FORMAT PARQUET)
    """
    )

    con.close()


if __name__ == "__main__":
    main()
