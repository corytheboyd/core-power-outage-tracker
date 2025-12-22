"""Convert Colorado Public Address Composite shapefile to parquet."""

from pathlib import Path

import duckdb

# Paths
SHAPEFILE_ZIP = Path(__file__).parent / "data" / "Colorado_Public_Address_Composite.zip"
OUTPUT_PARQUET = Path(__file__).parent / "data" / "addresses.parquet"

def main():
    con = duckdb.connect()
    con.execute("INSTALL spatial")
    con.execute("LOAD spatial")

    shapefile_path = f"/vsizip/{SHAPEFILE_ZIP}/Colorado_Public_Address_Composite.shp"

    # Get column names without loading data
    cols = [row[0] for row in con.execute(f"DESCRIBE SELECT * FROM ST_Read('{shapefile_path}')").fetchall()]

    # Detect address fields using SQL pattern matching
    full_addr = next((c for c in cols if 'FULL' in c.upper() and 'ADDR' in c.upper()), None)
    full_addr = full_addr or next((c for c in cols if c.upper() in ['ADDRESS', 'FULLADDR', 'FULL_ADDRESS']), None)

    addr_num = next((c for c in cols if 'NUM' in c.upper() and 'HOUSE' in c.upper()), None)
    addr_num = addr_num or next((c for c in cols if c.upper() in ['ADD_NUMBER', 'ADDNUM', 'HSE_NBR']), None)

    street = next((c for c in cols if 'STREET' in c.upper() or 'ST_NAME' in c.upper()), None)
    city = next((c for c in cols if c.upper() in ['CITY', 'CITYNAME', 'MUNICIPAL', 'PLACENAME']), None)
    zip_code = next((c for c in cols if 'ZIP' in c.upper() or 'POSTAL' in c.upper()), None)

    # Build expressions
    if full_addr:
        addr_expr = f'"{full_addr}"'
    else:
        parts = []
        if addr_num:
            parts.append(f'"{addr_num}"')
        if street:
            parts.append(f'"{street}"')
        addr_expr = f"CONCAT_WS(' ', {', '.join(parts)})" if parts else "''"

    city_expr = f'"{city}"' if city else "''"
    zip_expr = f'"{zip_code}"' if zip_code else "''"

    query = f"""
        COPY (
            SELECT
                ST_Point(ST_X(geom), ST_Y(geom)) as location,
                COALESCE({addr_expr}, '') as address,
                COALESCE({city_expr}, '') as city,
                COALESCE({zip_expr}, '') as zip
            FROM ST_Read('{shapefile_path}')
            WHERE geom IS NOT NULL
        ) TO '{OUTPUT_PARQUET}' (FORMAT PARQUET)
    """

    con.execute(query)

    count = con.execute(f"SELECT COUNT(*) FROM '{OUTPUT_PARQUET}'").fetchone()[0]
    print(f"Converted {count:,} addresses")

    con.close()

if __name__ == "__main__":
    main()