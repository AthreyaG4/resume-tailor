from pydantic import BaseModel, EmailStr, Field, model_validator
from uuid import UUID
from datetime import datetime
from typing import List, Literal, Optional
from models import ApplicationStatus


class NodeTokenUsage(BaseModel):
    node: str
    label: Optional[str] = None
    model: str = ""
    input_tokens: int
    output_tokens: int
    cached_tokens: int = 0


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
    job_id: Optional[str] = None
    job_description: Optional[str] = None
    company_name: Optional[str] = None
    title: Optional[str] = None

    @model_validator(mode="after")
    def validate_input(self):
        if not self.job_id and not self.job_description:
            raise ValueError("Either job_id or job_description must be provided.")
        return self


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
    location: Optional[str] = None
    emp_type: Optional[str] = None
    job_id: str
    job_description: Optional[str] = None
    skill_match_results: Optional[dict] = None
    tailored_resume_json: Optional["TailoredResumeSchema"] = None
    resume_json: Optional["ResumeSchema"] = None
    pdf_key: Optional[str] = None
    latex: Optional[str] = None
    cover_letter: Optional[str] = None
    status: ApplicationStatus
    current_node: Optional[str] = None
    interrupt_payloads: Optional[list] = None
    steps: list["ApplicationStepResponse"] = []
    token_usage_log: Optional[list] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ApplicationStepResponse(BaseModel):
    id: UUID
    application_id: UUID
    node: str
    label: str
    data: Optional[dict] = None
    input_tokens: int = 0
    output_tokens: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class ParsedExperience(BaseModel):
    company: str
    role: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    technologies: List[str] = []


class Experience(BaseModel):
    company: str
    role: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    technologies: List[str] = []
    description: Optional[str] = None
    emp_type: Optional[str] = None
    industry: Optional[str] = None
    seniority_ownership: Optional[str] = None
    responsibilities: List[str] = []
    technical_decisions: Optional[str] = None
    achievements: List[str] = []
    challenges_learnings: Optional[str] = None


class ParsedProject(BaseModel):
    title: str
    technologies: List[str] = []
    link: Optional[str] = None


class Project(BaseModel):
    title: str
    technologies: List[str] = []
    link: Optional[str] = None
    description: Optional[str] = None
    role: Optional[str] = None
    technical_decisions: Optional[str] = None
    challenges: Optional[str] = None
    achievements: List[str] = []
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    team_size: Optional[int] = None


class STARSegment(BaseModel):
    text: str
    type: Literal["situation", "action", "result"]


class BulletPoint(BaseModel):
    text: str
    star_segments: List[STARSegment]


class ProjectWithSTAR(BaseModel):
    title: str
    technologies: List[str] = []
    bullets: List[BulletPoint]
    link: Optional[str] = None


class ExperienceWithSTAR(BaseModel):
    company: str
    role: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    technologies: List[str] = []
    bullets: List[BulletPoint]


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


class Certification(BaseModel):
    name: str
    issuing_organization: str
    issue_date: str | None = None
    expiry_date: str | None = None
    credential_id: str | None = None
    credential_url: str | None = None


class Publication(BaseModel):
    title: str
    authors: list[str] = []
    publication_venue: str | None = None
    publication_date: str | None = None
    url: str | None = None
    description: str | None = None


class ResumeSchema(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    skills: list[SkillCategory]
    experience: list[Experience]
    projects: list[Project]
    education: list[Education]
    certifications: Optional[list[Certification]] = None
    publications: Optional[list[Publication]] = None


class ParsedResumeSchema(ResumeSchema):
    projects: list[ParsedProject]
    experience: list[ParsedExperience]


class SummaryGenerationResponse(BaseModel):
    summary: str


class CoverLetterSchema(BaseModel):
    cover_letter: str


class TailoredResumeSchema(ResumeSchema):
    summary: Optional[str] = None
    projects: list[ProjectWithSTAR]
    experience: list[ExperienceWithSTAR]


class JDResponseSchema(BaseModel):
    seniority_level: str
    years_of_experience: int
    responsibilities: list[str]
    must_have_qualifications: list[str]
    nice_to_have_qualifications: list[str]
    technical_skills: list[str]
    soft_skills: list[str]
    keywords: list[str]


class SemanticMatchResponseSchema(BaseModel):
    matched_must_have: list[str] = Field(
        description="Must-have qualifications semantically covered by the resume"
    )
    matched_nice_to_have: list[str] = Field(
        description="Nice-to-have qualifications semantically covered by the resume"
    )
    matched_technical: list[str] = Field(
        description="Technical skills semantically covered by the resume"
    )


class SkillMatchResultSchema(BaseModel):
    matched_must_have: set[str]
    missing_must_have: set[str]
    matched_nice_to_have: set[str]
    missing_nice_to_have: set[str]
    matched_technical: set[str]
    missing_technical: set[str]
    must_have_score: float
    nice_to_have_score: float
    tech_score: float
    final_score: float


class ProjectSelectionItem(BaseModel):
    index: int = Field(description="0-based index of the project")
    reasoning: str = Field(
        description="One sentence explaining why this project is relevant to the JD"
    )


class ProjectSelectResponseSchema(BaseModel):
    selected_projects: list[ProjectSelectionItem] = Field(
        description="Selected projects with reasoning, ordered by relevance (most relevant first)"
    )


class SelectedProject(BaseModel):
    title: str
    technologies: list[str]
    description: str | None = None
    link: str | None = None
    reasoning: str


class SkillSelectionResponse(BaseModel):
    selected_skills: list[SkillCategory] = Field(
        description="List of selected and reordered skills"
    )


class ProjectRewriteResponse(BaseModel):
    rewritten_project: ProjectWithSTAR


class ExperienceRewriteResponse(BaseModel):
    rewritten_experience: ExperienceWithSTAR


class SectionConfig(BaseModel):
    id: str
    label: str
    visible: bool


class SectionOrderPayload(BaseModel):
    sections: list[SectionConfig]


class HumanReviewResponse(BaseModel):
    interrupt_id: Optional[str] = None
    approved: bool
    feedback: Optional[str] = None
    edited_skills: Optional[list[dict]] = None
    selected_project_indices: Optional[list[int]] = None
    selected_certification_indices: Optional[list[int]] = None
    selected_publication_indices: Optional[list[int]] = None
    section_order: Optional[list[dict]] = None


class ContinueRequest(BaseModel):
    responses: list[HumanReviewResponse]
