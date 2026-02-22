import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from security.jwt import get_current_active_user
from sqlalchemy.orm import Session
from models import User
from db import get_db
from utils.fetch import fetch_job_description
from agent.tailor.graph import tailor_agent
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import AIMessageChunk
from fastapi.responses import StreamingResponse
from schemas import HumanReviewResponse, ResumeSchema
from langgraph.types import Command
from models import Resume, Application
from utils.makepdf import make_pdf
from utils.s3 import upload_to_s3

route = APIRouter(prefix="/api/tailor", tags=["tailor"])


@route.post("/")
async def start(
    jobID: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    db_resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.updated_at.desc())
        .first()
    )
    if not db_resume:
        raise HTTPException(
            status_code=404, detail="No resume found. Please upload your resume first."
        )

    resume_json = ResumeSchema(**db_resume.resume_json)
    job_description, _, _ = fetch_job_description(jobID)
    thread_id = str(uuid.uuid4())

    application = Application(
        user_id=current_user.id,
        job_id=jobID,
        job_description=job_description,
        thread_id=thread_id,
    )
    db.add(application)
    db.commit()

    config: RunnableConfig = {"configurable": {"thread_id": thread_id}}

    async def stream():
        yield f"data: {json.dumps({'thread_id': thread_id})}\n\n"
        async for mode, chunk in tailor_agent.astream(
            {"job_description": job_description, "resume_json": resume_json},
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
        yield 'data: {"status": "complete"}\n\n'

    return StreamingResponse(stream(), media_type="text/event-stream")


@route.post("/resume")
async def resume(
    feedback: HumanReviewResponse,
    thread_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    config = {"configurable": {"thread_id": thread_id}}

    async def stream():
        async for mode, chunk in tailor_agent.astream(
            Command(resume=feedback.model_dump()),
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

        final_state = tailor_agent.get_state(config)
        tailored_resume_json = final_state.values["tailored_resume_json"]
        skill_match_results = final_state.values["skill_match_results"]

        pdf_bytes = make_pdf(tailored_resume_json)
        key = f"resumes/{current_user.id}/{thread_id}.pdf"
        upload_to_s3(pdf_bytes, key)

        application = (
            db.query(Application).filter(Application.thread_id == thread_id).first()
        )
        application.tailored_resume_json = tailored_resume_json.model_dump()
        application.skill_match_results = skill_match_results.model_dump()
        application.pdf_key = key
        db.commit()

        yield f"data: {json.dumps({'status': 'complete'})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
