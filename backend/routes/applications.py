from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response
from security.jwt import get_current_active_user
from sqlalchemy.orm import Session
from models import User, ApplicationStatus, ApplicationStep
from db import get_db
from utils.fetch import fetch_job_description
from agent.graph import tailor_agent
from langchain_core.runnables import RunnableConfig
from schemas import (
    ContinueRequest,
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
    "execute_project_rewrite_node": "Rewriting project bullets",
    "execute_experience_rewrite_node": "Rewriting experience bullets",
    "assemble_resume_node": "Assembling resume",
}

STRUCTURED_OUTPUT_NODES = {
    "jd_parsing_node",
    "skill_match_node",
}

REVIEW_TO_NODE = {
    "project_selection_review_node":    "project_selection_node",
    "skill_selection_review_node":      "skill_selection_node",
    "execute_project_rewrite_node":     "execute_project_rewrite_node",
    "execute_experience_rewrite_node":  "execute_experience_rewrite_node",
}

CAROUSEL_CONFIG = {
    "execute_project_rewrite_node": {
        "state_key": "rewritten_projects",
        "payload_key": "rewritten_project",
    },
    "execute_experience_rewrite_node": {
        "state_key": "rewritten_experience",
        "payload_key": "rewritten_experience",
    },
}


async def graph_stream(input, config: dict, application_id=None, db=None):
    async for event in tailor_agent.astream_events(input, config=config, version="v2"):
        event_name = event["event"]
        name = event["name"]
        node = event.get("metadata", {}).get("langgraph_node", "")

        # print(node)

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

    rewritten = final_state.values.get("rewritten_projects", [])
    interrupts = final_state.interrupts or []
    print(f"\n{'='*60}")
    print(f"  graph_stream complete | next={final_state.next}")
    print(f"  rewritten_projects in state : {len(rewritten)}")
    for p in rewritten:
        title = p.title if hasattr(p, 'title') else p.get('title', '?')
        print(f"    - {title}")
    print(f"  interrupts count : {len(interrupts)}")
    for i in interrupts:
        val = i.value or {}
        proj = val.get("rewritten_project", {})
        title = proj.get("title", "?") if isinstance(proj, dict) else getattr(proj, "title", "?")
        print(f"    id={i.id}  project='{title}'")
    print(f"{'='*60}\n")

    if db and application_id:
        app = db.query(Application).filter(Application.id == application_id).first()

        if final_state.next:
            app.current_node = final_state.next[0]
            app.status = ApplicationStatus.INTERRUPTED
            resolved = set(app.resolved_interrupt_ids or [])
            app.interrupt_payloads = [
                {"id": i.id, "value": serialize_output(i.value)}
                for i in final_state.interrupts
                if i.id not in resolved
            ]
        else:
            app.current_node = None
            app.status = ApplicationStatus.TAILORED

            tailored_resume_json = final_state.values["tailored_resume_json"]
            skill_match_results = final_state.values["skill_match_results"]

            pdf_bytes, latex = make_pdf(tailored_resume_json)
            key = f"resumes/{app.user_id}/{app.id}.pdf"
            upload_to_s3(pdf_bytes, key)

            app.skill_match_results = json.loads(
                json.dumps(skill_match_results.model_dump(), cls=SetEncoder)
            )
            app.tailored_resume_json = tailored_resume_json.model_dump()
            app.pdf_key = key
            app.latex = latex

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
    db_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if not db_resume:
        raise HTTPException(status_code=404, detail="No resume found.")

    resume_json = ResumeSchema(**db_resume.resume_json)

    if payload.job_id:
        try:
            job_description, company_name, title = fetch_job_description(payload.job_id)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        job_description = payload.job_description
        company_name = payload.company_name
        title = payload.title

    application = Application(
        user_id=current_user.id,
        job_id=payload.job_id,
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
    feedback: ContinueRequest,
    background_tasks: BackgroundTasks,
    application_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    config = {"configurable": {"thread_id": str(application.id)}}

    all_approved = all(r.approved for r in feedback.responses)
    node_name = REVIEW_TO_NODE.get(application.current_node)
    payloads_by_id = {p["id"]: p["value"] for p in (application.interrupt_payloads or [])}

    approved_ids = [r.interrupt_id for r in feedback.responses if r.approved]
    existing_resolved = application.resolved_interrupt_ids or []
    application.resolved_interrupt_ids = existing_resolved + approved_ids

    application.status = ApplicationStatus.TAILORING
    application.current_node = None
    application.interrupt_payloads = None

    if node_name and all_approved:
        carousel = CAROUSEL_CONFIG.get(node_name)
        if carousel:
            current_state = tailor_agent.get_state(config)
            prev_items = current_state.values.get(carousel["state_key"], [])
            this_round = [
                payloads_by_id[r.interrupt_id][carousel["payload_key"]]
                for r in feedback.responses
                if r.interrupt_id in payloads_by_id
            ]
            all_items = (
                [item.model_dump() if hasattr(item, "model_dump") else item for item in prev_items]
                + this_round
            )
            db.add(ApplicationStep(
                application_id=application_id,
                node=node_name,
                label=NODE_LABELS[node_name],
                data={carousel["state_key"]: all_items},
            ))
        else:
            for r in feedback.responses:
                payload_value = payloads_by_id.get(r.interrupt_id)
                if payload_value:
                    step_data = dict(payload_value)
                    if r.edited_skills is not None:
                        step_data["selected_skills"] = r.edited_skills
                    db.add(ApplicationStep(
                        application_id=application_id,
                        node=node_name,
                        label=NODE_LABELS[node_name],
                        data=step_data,
                    ))

    db.commit()

    resume_map = {
        r.interrupt_id: r.model_dump(exclude={"interrupt_id"})
        for r in feedback.responses
    }

    background_tasks.add_task(
        graph_stream,
        Command(resume=resume_map),
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
