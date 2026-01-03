from io import BytesIO

import geopandas
from geopandas import GeoDataFrame
from requests import Request
from requests_cache import CachedSession, SQLiteCache

ARC_GIS_BASE_URL = "https://gis.colorado.gov/public/rest/services/Address_and_Parcel/Colorado_Public_Addresses/FeatureServer/0/"


class ColoradoArcGisApi:
    def __init__(self):
        self.base_url = ARC_GIS_BASE_URL.rstrip("/")
        self.session = CachedSession(
            use_cache_dir="./data/http_cache.sqlite",
            backend=SQLiteCache(db_path="./data/http_cache.sqlite"),
            cache_control=True,
            stale_if_error=False,
        )
        self.session.headers.update(
            {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Accept-Encoding": "gzip",
            }
        )

    def query(
        self, fields: str = "*", where: str = "1=1", limit: int = 2000, offset: int = 0
    ) -> GeoDataFrame:
        request = Request(
            method="GET",
            url=f"{self.base_url}/query",
            params={
                "outFields": fields,
                "where": where,
                "resultRecordCount": limit,
                "resultOffset": offset,
                "geometryType": "esriGeometryPoint",
                "returnGeometry": "true",
                "f": "geojson",
            },
        )
        response = self.session.send(self.session.prepare_request(request))
        response.raise_for_status()
        return geopandas.read_file(BytesIO(response.content), use_arrow=True)

    def count(self, where: str = "1=1"):
        request = Request(
            method="GET",
            url=f"{self.base_url}/query",
            params={
                "where": where,
                "returnCountOnly": "true",
                "f": "json",
            },
        )
        response = self.session.send(self.session.prepare_request(request))
        response.raise_for_status()
        return response.json()["count"]
