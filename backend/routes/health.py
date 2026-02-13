from fastapi import APIRouter

route = APIRouter(prefix="/api/health", tags=["health"])


@route.get("/")
def health_check():
    return {"status": "healthy"}
