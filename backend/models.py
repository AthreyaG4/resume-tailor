import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db import Base
import enum


class ApplicationStatus(enum.Enum):
    TAILORING = "tailoring"
    TAILORED = "tailored"
    APPLIED = "applied"
    INTERVIEWING = "interviewing"
    REJECTED = "rejected"
    ACCEPTED = "accepted"
    ERROR = "error"
    INTERRUPTED = "interrupted"


class ResumeStatus(enum.Enum):
    PARSING = "parsing"
    ERROR = "error"
    SUCCESS = "success"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    resume = relationship("Resume", back_populates="user", uselist=False)  # one-to-one
    applications = relationship("Application", back_populates="user")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    resume_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    status = Column(Enum(ResumeStatus), default=ResumeStatus.PARSING, nullable=False)

    user = relationship("User", back_populates="resume")


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    company_name = Column(String, nullable=True)
    title = Column(String, nullable=True)
    job_id = Column(String, nullable=False)
    job_description = Column(Text)
    skill_match_results = Column(JSON)
    tailored_resume_json = Column(JSON)
    pdf_key = Column(String, nullable=True)
    status = Column(
        Enum(ApplicationStatus), default=ApplicationStatus.TAILORING, nullable=False
    )
    current_node = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="applications")
    steps = relationship(
        "ApplicationStep",
        back_populates="application",
        order_by="ApplicationStep.created_at",
    )


class ApplicationStep(Base):
    __tablename__ = "application_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"))
    node = Column(String, nullable=False)
    label = Column(String, nullable=False)
    data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    application = relationship("Application", back_populates="steps")
