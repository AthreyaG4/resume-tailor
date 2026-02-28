from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from models import ApplicationStatus


class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class JWTToken(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


class ResumeResponse(BaseModel):
    id: UUID
    user_id: UUID
    resume_json: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
    status: str

    model_config = {"from_attributes": True}


class ApplicationCreateRequest(BaseModel):
    job_id: str


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationsResponse(BaseModel):
    id: UUID
    status: ApplicationStatus
    company_name: Optional[str] = None
    title: Optional[str] = None
    created_at: datetime


class ApplicationResponse(BaseModel):
    id: UUID
    user_id: UUID
    company_name: Optional[str] = None
    title: Optional[str] = None
    job_id: str
    job_description: Optional[str] = None
    skill_match_results: Optional[dict] = None
    tailored_resume_json: Optional["ResumeSchema"] = None
    resume_json: Optional["ResumeSchema"] = None
    pdf_key: Optional[str] = None
    status: ApplicationStatus
    current_node: Optional[str] = None
    steps: list["ApplicationStepResponse"] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ApplicationStepResponse(BaseModel):
    id: UUID
    application_id: UUID
    node: str
    label: str
    data: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class Experience(BaseModel):
    company: str
    role: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = []
    bullets: List[str]


class Project(BaseModel):
    title: str
    description: Optional[str] = None
    technologies: List[str] = []
    bullets: List[str]
    link: Optional[str] = None


class Education(BaseModel):
    institution: str
    degree: str
    field_of_study: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    gpa: Optional[str] = None


class SkillCategory(BaseModel):
    category: str
    skills: list[str]


class ResumeSchema(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    summary: str
    skills: list[SkillCategory]
    experience: list[Experience]
    projects: list[Project]
    education: list[Education]


class JDResponseSchema(BaseModel):
    location: str = Field(description="Job Location")
    responsibilities: list[str] = Field(description="List of responsibilities")
    must_have_qualifications: list[str] = Field(
        description="List of must have qualifications"
    )
    nice_to_have_qualifications: list[str] = Field(
        description="List of nice to have qualifications"
    )
    keywords: list[str] = Field(description="List of keywords")


class SemanticMatchResponseSchema(BaseModel):
    matched_must_have: list[str] = Field(
        description="JD must-have skills semantically covered by resume"
    )
    matched_nice_to_have: list[str] = Field(
        description="JD nice-to-have skills semantically covered by resume"
    )


class SkillMatchResultSchema(BaseModel):
    matched_must_have: set[str]
    missing_must_have: set[str]
    matched_nice_to_have: set[str]
    missing_nice_to_have: set[str]
    must_have_score: float
    nice_to_have_score: float
    final_score: float


class ProjectSelectResponseSchema(BaseModel):
    selected_projects: list[Project]


class SkillSelectionResponse(BaseModel):
    selected_skills: list[SkillCategory] = Field(
        description="List of selected and reordered skills"
    )


class ProjectRewriteResponse(BaseModel):
    rewritten_projects: list[Project]


class ExperienceRewriteResponse(BaseModel):
    rewritten_experience: list[Experience]


class HumanReviewResponse(BaseModel):
    approved: bool
    feedback: Optional[str] = None
