from fastapi import APIRouter, Depends, File, UploadFile
from security.jwt import get_current_active_user
from sqlalchemy.orm import Session
from models import User
from db import get_db
from utils.parse import parse_resume
from agent.ingestion.graph import ingestion_agent
from langchain_core.runnables import RunnableConfig


route = APIRouter(prefix="/api/tailor", tags=["tailor"])


@route.post("/")
def upload_resume(
    current_user: User = Depends(get_current_active_user),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    file_bytes = resume.read()
    text = parse_resume(file_bytes, resume.filename)

    config: RunnableConfig = {"configurable": {"thread_id": "1"}}

    # Stream here and save to db as needed
    ingestion_agent_response = ingestion_agent.invoke({"raw_text": text}, config=config)
    return {"response": ingestion_agent_response}
