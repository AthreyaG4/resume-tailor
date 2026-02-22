from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional


class UserCreateRequest(BaseModel):
    name: str
    username: str
    password: str
    email: EmailStr


class JWTToken(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: UUID
    name: str
    username: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


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


class IngestionHumanReviewResponse(BaseModel):
    edited_resume: ResumeSchema


class HumanReviewResponse(BaseModel):
    approved: bool
    feedback: Optional[str] = None
