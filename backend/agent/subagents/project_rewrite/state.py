from pydantic import BaseModel
from typing import Optional, Annotated, List
import operator
from schemas import Project


class ProjectSubgraphState(BaseModel):
    jd_json: dict
    project: dict
    project_rewrite_messages: Annotated[List, operator.add] = []
    rewritten_project: Optional[Project] = None
