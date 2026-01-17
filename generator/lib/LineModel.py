import polyline
from pydantic import BaseModel, Field


class LineModel(BaseModel):
    polyline: str = Field(alias="g")

    def to_geojson(self) -> dict:
        coords = polyline.decode(self.polyline)
        # Swap lat/lng to lng/lat for GeoJSON
        geojson_coords = [[lng, lat] for lat, lng in coords]
        return {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": geojson_coords,
            },
            "properties": {},
        }
