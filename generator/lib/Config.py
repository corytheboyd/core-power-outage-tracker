from typing import List

import yaml
from pydantic import BaseModel


class ArcGisConfig(BaseModel):
    max_page_size: int


class ReplaceRule(BaseModel):
    field: str
    match: str
    replacement: str


class ExcludeRule(BaseModel):
    field: str
    match: str


class CleanupRules(BaseModel):
    replace: List[ReplaceRule] = []
    exclude: List[ExcludeRule] = []


class Config(BaseModel):
    zipcodes: List[str]
    arc_gis: ArcGisConfig
    cleanup_rules: CleanupRules = CleanupRules()

    @classmethod
    def from_file(cls, path: str) -> "Config":
        with open(path) as f:
            return cls.model_validate(yaml.safe_load(f))
