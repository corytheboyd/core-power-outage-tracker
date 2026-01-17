from requests import Request
from requests_cache import SQLiteCache, CachedSession

BASE_URL = "'https://cache.sienatech.com/apex/siena_ords/webmaps/lines/CORE"


class CorePowerApi:
    def __init__(self):
        self.base_url = BASE_URL
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

    def service_lines(self):
        request = Request(
            method="GET",
            url=f"{self.base_url}/base",
            params={
                "zoom": 20,
            },
        )
        response = self.session.send(self.session.prepare_request(request))
        response.raise_for_status()
