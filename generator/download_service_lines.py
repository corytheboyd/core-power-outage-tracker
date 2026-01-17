import json

from lib.CorePowerApi import CorePowerApi

api = CorePowerApi()
lines = api.service_lines()

with open("data/service_lines.geojson", "w") as f:
    json.dump(lines.to_geojson(), f)
