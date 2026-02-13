from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime


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
