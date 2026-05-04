from pydantic import BaseModel, Field
from typing import Optional, List, Annotated
import operator
from agent.utils import merge_token_usage
from schemas import (
    JDResponseSchema,
    ResumeSchema,
    TailoredResumeSchema,
    SectionOrderPayload,
    SelectedProject,
    SkillMatchResultSchema,
    SkillCategory,
    ProjectWithSTAR,
    ExperienceWithSTAR,
    Certification,
    Publication,
    NodeTokenUsage,
)


class TailorState(BaseModel):
    raw_html: str = ""
    jd_json: Optional[JDResponseSchema] = None
    company_name: Optional[str] = None
    role_title: Optional[str] = None
    resume_json: Optional[ResumeSchema] = None
    skill_match_results: Optional[SkillMatchResultSchema] = None
    selected_projects: list[SelectedProject] = Field(default_factory=list)
    selected_skills: Optional[List[SkillCategory]] = None
    rewritten_projects: Annotated[List[ProjectWithSTAR], operator.add] = []
    rewritten_experience: Annotated[List[ExperienceWithSTAR], operator.add] = []
    selected_certifications: Optional[List[Certification]] = None
    selected_publications: Optional[List[Publication]] = None
    generated_summary: Optional[str] = None
    summary_messages: list = Field(default_factory=list)
    section_order: Optional[SectionOrderPayload] = None
    wants_cover_letter: Optional[bool] = None
    cover_letter_messages: list = Field(default_factory=list)
    cover_letter: Optional[str] = None
    tailored_resume_json: Optional[TailoredResumeSchema] = None
    token_usage_log: Annotated[List[NodeTokenUsage], merge_token_usage] = []
