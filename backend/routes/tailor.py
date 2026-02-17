from fastapi import APIRouter, Depends, File, UploadFile
from security.jwt import get_current_active_user
from sqlalchemy.orm import Session
from models import User
from db import get_db

route = APIRouter(prefix="/api/tailor", tags=["tailor"])


@route.post("/")
def tailor_resume(
    current_user: User = Depends(get_current_active_user),
    resume: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    pass
