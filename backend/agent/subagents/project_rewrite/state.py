from pydantic import BaseModel


class ProjectSubgraphState(BaseModel):
    jd_json: dict
    project: dict
    project_rewrite_messages: list
    rewritten_project: dict
