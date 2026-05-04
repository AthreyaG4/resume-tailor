from pydantic import BaseModel
from typing import Optional, Annotated, List
import operator
from schemas import ExperienceWithSTAR, JDResponseSchema, Experience, NodeTokenUsage
from agent.utils import merge_token_usage


class ExperienceSubgraphState(BaseModel):
    jd_json: JDResponseSchema
    experience: Experience
    experience_rewrite_messages: Annotated[List, operator.add] = []
    rewritten_experience: Optional[ExperienceWithSTAR] = None
    token_usage_log: Annotated[List[NodeTokenUsage], merge_token_usage] = []
