import geopandas
from pathlib import Path
from loguru import logger


def main():
    input_file = Path("data/addresses.parquet")
    output_file = Path("data/addresses.geojson")

    if not input_file.exists():
        logger.error(f"Input file not found: {input_file}")
        logger.info("Run 'just build_addresses' first to generate the addresses table")
        return

    logger.info(f"Reading {input_file}...")
    gdf = geopandas.read_parquet(input_file)
    logger.info(f"Loaded {len(gdf)} addresses")

    # Ensure CRS is set to WGS84
    if gdf.crs is None:
        gdf = gdf.set_crs("EPSG:4326")
    elif gdf.crs != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")

    logger.info(f"Exporting to {output_file}...")
    gdf.to_file(output_file, driver="GeoJSON")

    output_size = output_file.stat().st_size / (1024 * 1024)
    logger.info(f"Generated {output_file} ({output_size:.2f} MB)")


if __name__ == "__main__":
    main()
