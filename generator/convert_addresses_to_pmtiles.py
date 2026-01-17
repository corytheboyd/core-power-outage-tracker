import shutil
import subprocess
import tempfile
from pathlib import Path

import geopandas
from loguru import logger


def main():
    # Check if tippecanoe is installed
    if shutil.which("tippecanoe") is None:
        logger.error(
            "tippecanoe is not installed. Install it with: brew install tippecanoe"
        )
        return

    input_file = Path("data/addresses.parquet")
    output_file = Path("data/addresses.pmtiles")

    if not input_file.exists():
        logger.error(f"Input file not found: {input_file}")
        logger.info("Run 'just build_addresses' first to generate the addresses table")
        return

    logger.info(f"Reading {input_file}...")
    gdf = geopandas.read_parquet(input_file)
    logger.info(f"Loaded {len(gdf)} addresses")

    # Ensure CRS is set to WGS84 (required for vector tiles)
    if gdf.crs is None:
        gdf = gdf.set_crs("EPSG:4326")
    elif gdf.crs != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")

    # Export to temporary GeoJSON for tippecanoe
    with tempfile.NamedTemporaryFile(suffix=".geojson", delete=False) as tmp:
        tmp_path = Path(tmp.name)

    logger.info(f"Exporting to temporary GeoJSON: {tmp_path}")
    gdf.to_file(tmp_path, driver="GeoJSON")

    # Run tippecanoe
    logger.info("Generating vector tiles with tippecanoe...")
    cmd = [
        "tippecanoe",
        "-o",
        str(output_file),
        "--force",  # Overwrite existing file
        "--layer=addresses",
        "--minimum-zoom=8",
        "--maximum-zoom=20",
        "--no-feature-limit",
        "--no-tile-size-limit",
        str(tmp_path),
    ]

    logger.info(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        logger.error(f"tippecanoe failed: {result.stderr}")
        tmp_path.unlink()
        return

    logger.info(result.stderr)  # tippecanoe outputs progress to stderr

    # Clean up temp file
    tmp_path.unlink()

    output_size = output_file.stat().st_size / (1024 * 1024)
    logger.info(f"Generated {output_file} ({output_size:.2f} MB)")


if __name__ == "__main__":
    main()
