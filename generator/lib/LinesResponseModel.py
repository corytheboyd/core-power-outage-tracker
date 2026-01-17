from pydantic import BaseModel

from lib.LineModel import LineModel


class LinesResponseModel(BaseModel):
    lines: list[LineModel]

    def to_geojson(self) -> dict:
        return {
            "type": "FeatureCollection",
            "features": [line.to_geojson() for line in self.lines],
        }
