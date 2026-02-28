from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response
from security.jwt import get_current_active_user
from sqlalchemy.orm import Session
from models import User, ApplicationStatus, ApplicationStep
from db import get_db
from utils.fetch import fetch_job_description
from agent.graph import tailor_agent
from langchain_core.runnables import RunnableConfig
from schemas import (
    HumanReviewResponse,
    ResumeSchema,
    ApplicationResponse,
    ApplicationsResponse,
    ApplicationCreateRequest,
    ApplicationStatusUpdate,
)
from langgraph.types import Command
from models import Resume, Application
from utils.makepdf import make_pdf
from utils.s3 import upload_to_s3
from utils.serialize import serialize_output, SetEncoder
from uuid import UUID
import json

route = APIRouter(prefix="/api/applications", tags=["applications"])

NODE_LABELS = {
    "jd_parsing_node": "Parsing job description",
    "skill_match_node": "Matching skills",
    "project_selection_node": "Selecting projects",
    "skill_selection_node": "Selecting skills",
    "project_rewrite_node": "Rewriting project bullets",
    "experience_rewrite_node": "Rewriting experience bullets",
    "assemble_resume_node": "Assembling resume",
}

STRUCTURED_OUTPUT_NODES = {
    "jd_parsing_node",
    "skill_match_node",
    "project_selection_node",
    "skill_selection_node",
    "project_rewrite_node",
    "experience_rewrite_node",
}


async def graph_stream(input, config: dict, application_id=None, db=None):
    async for event in tailor_agent.astream_events(input, config=config, version="v2"):
        event_name = event["event"]
        name = event["name"]
        node = event.get("metadata", {}).get("langgraph_node", "")

        if event_name == "on_chain_start" and name == node and node in NODE_LABELS:
            if db and application_id:
                app = (
                    db.query(Application)
                    .filter(Application.id == application_id)
                    .first()
                )
                app.current_node = node
                db.commit()

        elif (
            event_name == "on_chain_end"
            and name == node
            and node in STRUCTURED_OUTPUT_NODES
        ):
            output = serialize_output(event["data"].get("output", {}))

            if db and application_id:
                step = ApplicationStep(
                    application_id=application_id,
                    node=node,
                    label=NODE_LABELS.get(node, node),
                    data=output,
                )
                db.add(step)
                app = (
                    db.query(Application)
                    .filter(Application.id == application_id)
                    .first()
                )
                app.current_node = node
                db.commit()

    final_state = tailor_agent.get_state(config)

    if db and application_id:
        app = db.query(Application).filter(Application.id == application_id).first()

        if final_state.next:
            app.current_node = final_state.next[0]
            app.status = ApplicationStatus.INTERRUPTED
        else:
            app.current_node = None
            app.status = ApplicationStatus.TAILORED

            tailored_resume_json = final_state.values["tailored_resume_json"]
            skill_match_results = final_state.values["skill_match_results"]

            pdf_bytes = make_pdf(tailored_resume_json)
            key = f"resumes/{app.user_id}/{app.id}.pdf"
            upload_to_s3(pdf_bytes, key)

            app.skill_match_results = json.loads(
                json.dumps(skill_match_results.model_dump(), cls=SetEncoder)
            )
            app.tailored_resume_json = tailored_resume_json.model_dump()
            app.pdf_key = key

        db.commit()


@route.get("/", response_model=list[ApplicationsResponse])
async def get_applications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    applications = (
        db.query(Application)
        .filter(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
        .all()
    )
    return applications


@route.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()

    response = ApplicationResponse.model_validate(application)
    response.resume_json = ResumeSchema(**resume.resume_json) if resume else None

    return response


@route.post("/")
async def create_application(
    payload: ApplicationCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    job_id = payload.job_id
    db_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if not db_resume:
        raise HTTPException(status_code=404, detail="No resume found.")

    resume_json = ResumeSchema(**db_resume.resume_json)
    job_description, company_name, title = fetch_job_description(job_id)

    application = Application(
        user_id=current_user.id,
        job_id=job_id,
        job_description=job_description,
        company_name=company_name,
        title=title,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    config: RunnableConfig = {"configurable": {"thread_id": str(application.id)}}
    background_tasks.add_task(
        graph_stream,
        {"raw_html": job_description, "resume_json": resume_json},
        config,
        application_id=application.id,
        db=next(get_db()),
    )

    return {"application_id": application.id}


@route.post("/{application_id}/continue")
async def continue_application(
    feedback: HumanReviewResponse,
    background_tasks: BackgroundTasks,
    application_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    config = {"configurable": {"thread_id": str(application.id)}}

    application.status = ApplicationStatus.TAILORING
    application.current_node = None
    db.commit()

    background_tasks.add_task(
        graph_stream,
        Command(resume=feedback.model_dump()),
        config,
        application_id=application.id,
        db=next(get_db()),
    )

    return {"status": "resuming"}


@route.patch("/{application_id}/status")
async def update_application_status(
    application_id: UUID,
    payload: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    application.status = payload.status
    db.commit()
    return {"status": application.status}


@route.delete("/{application_id}")
async def delete_application(
    application_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    db.delete(application)
    db.commit()
    return Response(status_code=204)
