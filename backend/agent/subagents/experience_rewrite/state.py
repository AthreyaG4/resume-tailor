from pydantic import BaseModel
from typing import Optional, Annotated, List
import operator
from schemas import Experience


class ExperienceSubgraphState(BaseModel):
    jd_json: dict
    experience: dict
    experience_rewrite_messages: Annotated[List, operator.add] = []
    rewritten_experience: Optional[Experience] = None
