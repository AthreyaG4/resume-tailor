from fastapi import FastAPI
from routes.health import route as health_route

app = FastAPI()

app.include_router(health_route)
