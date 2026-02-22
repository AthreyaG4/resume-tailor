from fastapi import FastAPI
from db import init_db
from routes.health import route as health_route
from routes.auth import route as login_route
from routes.user import route as user_route
from routes.ingest import route as ingest_route
from routes.tailor import route as tailor_route
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ["http://localhost", "http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


app.include_router(health_route)
app.include_router(login_route)
app.include_router(user_route)
app.include_router(ingest_route)
app.include_router(tailor_route)
