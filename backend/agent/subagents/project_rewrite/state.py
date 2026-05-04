from pydantic import BaseModel
from typing import Optional, Annotated, List
import operator
from schemas import ProjectWithSTAR, JDResponseSchema, Project, NodeTokenUsage
from agent.utils import merge_token_usage


class ProjectSubgraphState(BaseModel):
    jd_json: JDResponseSchema
    project: Project
    project_rewrite_messages: Annotated[List, operator.add] = []
    rewritten_project: Optional[ProjectWithSTAR] = None
    token_usage_log: Annotated[List[NodeTokenUsage], merge_token_usage] = []
