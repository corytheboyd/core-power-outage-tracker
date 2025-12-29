from typing import Literal

from pydantic import BaseModel

from lib.LineModel import LineModel


class LinesResponseModel(BaseModel):
    state: str = Literal["change"] | Literal["nochange"]
    lines: list[LineModel]
