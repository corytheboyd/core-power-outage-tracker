import polyline
from pydantic import BaseModel, Field
from shapely.geometry import LineString


class LineModel(BaseModel):
    polyline: str = Field(alias="g")

    def to_wkb(self):
        coords = polyline.decode(self.polyline)
        return LineString(coords).wkb
