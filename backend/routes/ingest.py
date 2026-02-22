import json
import uuid
from fastapi import APIRouter, Depends, File, UploadFile
from security.jwt import get_current_active_user
from sqlalchemy.orm import Session
from models import User
from db import get_db
from utils.parse import parse_resume
from agent.ingestion.graph import ingestion_agent
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import AIMessageChunk
from fastapi.responses import StreamingResponse
from schemas import IngestionHumanReviewResponse
from langgraph.types import Command
from models import Resume


route = APIRouter(prefix="/api/ingest", tags=["ingest"])


@route.post("/")
async def start(
    current_user: User = Depends(get_current_active_user),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    file_bytes = await resume.read()
    text = parse_resume(file_bytes, resume.filename)
    thread_id = str(uuid.uuid4())

    config: RunnableConfig = {"configurable": {"thread_id": thread_id}}

    async def stream():
        yield f"data: {json.dumps({'thread_id': thread_id})}\n\n"
        async for mode, chunk in ingestion_agent.astream(
            {"raw_text": text},
            stream_mode=["messages", "updates"],
            config=config,
        ):
            if mode == "messages":
                msg, _ = chunk
                if isinstance(msg, AIMessageChunk):
                    yield f"data: {msg.content}\n\n"

            elif mode == "updates":
                if "__interrupt__" in chunk:
                    yield f"data: {json.dumps({'interrupt': chunk['__interrupt__'][0].value})}\n\n"
                    return

    return StreamingResponse(stream(), media_type="text/event-stream")


@route.post("/resume")
async def resume(
    feedback: IngestionHumanReviewResponse,
    thread_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    config = {"configurable": {"thread_id": thread_id}}

    async def stream():
        async for mode, chunk in ingestion_agent.astream(
            Command(resume=feedback.edited_resume.model_dump()),
            stream_mode=["messages", "updates"],
            config=config,
        ):
            if mode == "messages":
                msg, _ = chunk
                if isinstance(msg, AIMessageChunk):
                    yield f"data: {msg.content}\n\n"

            elif mode == "updates":
                if "__interrupt__" in chunk:
                    yield f"data: {json.dumps({'interrupt': chunk['__interrupt__'][0].value})}\n\n"
                    return

        final_state = ingestion_agent.get_state(config)
        resume_json = final_state.values["resume_json"]

        db_resume = Resume(
            user_id=current_user.id, resume_json=resume_json.model_dump()
        )
        db.add(db_resume)
        db.commit()

        yield 'data: {"status": "complete"}\n\n'

    return StreamingResponse(stream(), media_type="text/event-stream")
