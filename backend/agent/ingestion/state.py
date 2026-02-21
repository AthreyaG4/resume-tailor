from pydantic import BaseModel
from typing import Optional
from schemas import ResumeSchema


class IngestionState(BaseModel):
    raw_text: str = ""
    resume_json: Optional[ResumeSchema] = None
