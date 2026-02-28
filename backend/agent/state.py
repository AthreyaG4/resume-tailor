from pydantic import BaseModel
from typing import Optional, List, Annotated
import operator
from schemas import (
    JDResponseSchema,
    ResumeSchema,
    SkillMatchResultSchema,
    Project,
    SkillCategory,
    Experience,
)


class TailorState(BaseModel):
    raw_html: str = ""
    jd_json: Optional[JDResponseSchema] = None
    resume_json: Optional[ResumeSchema] = None
    skill_match_results: Optional[SkillMatchResultSchema] = None
    project_messages: Annotated[list, operator.add] = []
    selected_projects: Optional[List[Project]] = None
    skill_messages: Annotated[list, operator.add] = []
    selected_skills: Optional[List[SkillCategory]] = None
    project_rewrite_messages: Annotated[list, operator.add] = []
    rewritten_projects: Optional[List[Project]] = None
    experience_rewrite_messages: Annotated[list, operator.add] = []
    rewritten_experience: Optional[List[Experience]] = None
    tailored_resume_json: Optional[ResumeSchema] = None
