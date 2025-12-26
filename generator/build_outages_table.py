"""Fetch and process CORE power outage polyline data."""

from pathlib import Path

import duckdb
import geojson
import polyline
import requests

# Paths
OUTPUT_PARQUET = Path(__file__).parent / "data" / "outages.parquet"

# API endpoint
OUTAGES_API = "https://cache.sienatech.com/apex/siena_ords/webmaps/lines/CORE/temp?zoom=20"


def main():
    # Fetch outage data from API
    print("Fetching outage data from API...")
    response = requests.get(OUTAGES_API, timeout=30)
    response.raise_for_status()
    data = response.json()

    lines = data.get("lines", [])
    print(f"Retrieved {len(lines)} outage lines")

    if not lines:
        print("No outage data available")
        return

    # Decode polylines and prepare data
    outage_records = []
    for line_obj in lines:
        encoded_polyline = line_obj.get("g", "")
        if not encoded_polyline:
            continue

        # Decode polyline to list of (lat, lon) coordinates
        coords = polyline.decode(encoded_polyline)

        # Convert to (lon, lat) for spatial functions
        if len(coords) < 2:
            # Need at least 2 points for a linestring
            continue

        # Convert to (lon, lat) tuples for GeoJSON
        linestring_coords = [(lon, lat) for lat, lon in coords]
        linestring = geojson.LineString(linestring_coords)

        outage_records.append(
            {
                "linestring_geojson": geojson.dumps(linestring),
                "outage_id": line_obj.get("f", ""),
                "status": line_obj.get("e", 0),
                "type": line_obj.get("t", ""),
            }
        )

    if not outage_records:
        print("No valid outage geometries found")
        return

    print(f"Processed {len(outage_records)} valid outage lines")

    # Use DuckDB to create LINESTRING_2D geometries and save to parquet
    con = duckdb.connect()
    con.execute("INSTALL spatial")
    con.execute("LOAD spatial")

    # Create temporary table with the data
    con.execute(
        """
        CREATE TABLE outages
        (
            outage_id  TEXT,
            status     INTEGER,
            type       TEXT,
            linestring LINESTRING_2D
        )
        """
    )

    # Insert records - convert coord tuples to list of structs
    con.executemany(
        """
        INSERT INTO outages
        VALUES (?, ?, ?, ST_GeomFromGeoJSON(?))
        """,
        [
            (
                r["outage_id"],
                r["status"],
                r["type"],
                r["linestring_geojson"],
            )
            for r in outage_records
        ],
    )

    con.execute(f"""
        COPY outages TO '{OUTPUT_PARQUET}' (FORMAT PARQUET)
    """)

    con.close()


if __name__ == "__main__":
    main()
