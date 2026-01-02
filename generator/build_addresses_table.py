import pandas as pd
from loguru import logger

from lib.Config import Config

config = Config.from_file("config.yml")
zipcodes = config.zipcodes

dfs = []
for zipcode in zipcodes:
    file = f"data/addresses_{zipcode}.parquet"
    try:
        df = pd.read_parquet(file)
        dfs.append(df)
        logger.info(f"Loaded {len(df)} rows from {file}")
    except FileNotFoundError:
        logger.warning(f"File not found: {file}")

if dfs:
    combined = pd.concat(dfs, ignore_index=True)
    logger.info(f"Combined {len(combined)} total rows from {len(dfs)} files")
    combined.to_parquet("data/addresses.parquet")
    logger.info("Saved to data/addresses.parquet")
else:
    logger.error("No parquet files found to combine")
