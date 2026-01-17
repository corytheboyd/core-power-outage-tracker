import math

import geopandas
from loguru import logger

from lib.ColoradoArcGisApi import ColoradoArcGisApi
from lib.Config import Config

api = ColoradoArcGisApi()
config = Config.from_file("config.yml")
zipcodes = config.zipcodes
page_size = config.arc_gis.max_page_size

for zipcode in zipcodes:
    count = api.count(where=f"Zipcode = '{zipcode}'")

    total_pages = math.ceil(count / page_size)
    logger.info(f"zipcode={zipcode} count={count} total_pages={total_pages}")

    dfs = []
    for page in range(total_pages):
        logger.info(f"zipcode={zipcode} page={page + 1}/{total_pages}")
        df = api.query(
            fields="*",
            where=f"Zipcode = '{zipcode}'",
            limit=page_size,
            offset=page_size * page,
        )
        dfs.append(df)

    if len(dfs) == 0:
        continue

    geopandas.pd.concat(dfs, ignore_index=True).to_parquet(
        f"data/addresses_{zipcode}.parquet"
    )
