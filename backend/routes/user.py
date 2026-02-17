from fastapi import Depends, APIRouter, HTTPException, status
from schemas import UserCreateRequest, UserResponse
from db import get_db
from models import User
from sqlalchemy.orm import Session
from security.jwt import get_current_active_user
from security.password import password_hash

route = APIRouter(prefix="/api/users", tags=["users"])


@route.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@route.post("/", response_model=UserResponse)
def create_user(user: UserCreateRequest, db: Session = Depends(get_db)):
    existingUser = db.query(User).filter(User.username == user.username).first()

    if existingUser:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"username": "Username already exists"},
        )

    existingEmail = db.query(User).filter(User.email == user.email).first()

    if existingEmail:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"email": "Email already exists"},
        )

    hashed_password = password_hash.hash(user.password)

    db_user = User(
        name=user.name,
        username=user.username,
        password_hash=hashed_password,
        email=user.email,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
