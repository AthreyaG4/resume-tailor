from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
    HTTPException,
    BackgroundTasks,
    Request,
)
from security.jwt import get_current_active_user
from sqlalchemy.orm import Session
from models import User
from db import get_db
from utils.parse import parse_resume
from uuid import UUID
from schemas import ResumeResponse, ResumeSchema
from models import Resume, ResumeStatus
from typing import Optional


route = APIRouter(prefix="/api/resume", tags=["resume"])


@route.get("/", response_model=Optional[ResumeResponse])
async def get_resume(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    db_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if not db_resume:
        return None
    return db_resume


@route.post("/parse")
async def parse(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    db_resume = Resume(user_id=current_user.id, resume_json={})
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)

    background_tasks.add_task(process_resume, db_resume.id, resume, db=next(get_db()))

    return {"resume_id": db_resume.id}


async def process_resume(resume_id: UUID, resume: UploadFile, db):
    db_resume = db.query(Resume).filter(Resume.id == resume_id).first()

    try:
        file_bytes = await resume.read()
        result = await parse_resume(file_bytes, resume.filename)

        db_resume.status = ResumeStatus.SUCCESS
        db_resume.resume_json = result
        db.commit()

    except Exception as e:
        print(f"Parse error: {e}")
        db_resume.status = ResumeStatus.ERROR
        db.commit()


@route.put("/save", response_model=ResumeResponse)
async def save_resume(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    body = await request.json()
    updated_resume = ResumeSchema(**body)
    db_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    db_resume.resume_json = updated_resume.model_dump()
    db.commit()
    db.refresh(db_resume)
    return db_resume


@route.delete("/")
async def delete_resume(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):

    db_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if not db_resume:
        return HTTPException(404, detail="Resume not found")

    db.delete(db_resume)
    db.commit()
    return
