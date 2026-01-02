from typing import List

import yaml
from pydantic import BaseModel


class ArcGisConfig(BaseModel):
    max_page_size: int


class Config(BaseModel):
    zipcodes: List[str]
    arc_gis: ArcGisConfig

    @classmethod
    def from_file(cls, path: str) -> "Config":
        with open(path) as f:
            return cls.model_validate(yaml.safe_load(f))
