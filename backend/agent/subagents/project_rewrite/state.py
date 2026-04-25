from pydantic import BaseModel
from typing import Optional
from schemas import Project


class ProjectSubgraphState(BaseModel):
    jd_json: dict
    project: dict
    project_rewrite_messages: list = []
    rewritten_project: Optional[Project] = None
