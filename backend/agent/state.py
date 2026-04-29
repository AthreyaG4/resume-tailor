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
    rewritten_projects: Annotated[List[Project], operator.add] = []
    rewritten_experience: Annotated[List[Experience], operator.add] = []
    tailored_resume_json: Optional[ResumeSchema] = None
