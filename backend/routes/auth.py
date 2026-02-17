from fastapi.security import OAuth2PasswordRequestForm
from security.password import password_hash
from fastapi import Depends, APIRouter, HTTPException, status
from schemas import JWTToken
from db import get_db
from models import User
from sqlalchemy.orm import Session
from security.jwt import create_access_token

route = APIRouter(prefix="/api/login", tags=["login"])


def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.email == username).first()

    if not user:
        return None

    if not password_hash.verify(password, user.password_hash):  # type: ignore
        return None

    return user


@route.post("/", response_model=JWTToken)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    username = form_data.username
    password = form_data.password

    user = authenticate_user(db, username, password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})

    return {"access_token": access_token, "token_type": "bearer"}
