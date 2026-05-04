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
    "certification_selection_review_node": "Certifications & publications",
    "summary_generation_node": "Generating summary",
    "summary_generation_review_node": "Summary review",
    "section_order_node": "Section order",
    "cover_letter_review_node": "Cover letter",
    "cover_letter_node": "Generating cover letter",
    "assemble_resume_node": "Assembling resume",
}

STRUCTURED_OUTPUT_NODES = {
    "jd_parsing_node",
    "skill_match_node",
}

REVIEW_TO_NODE = {
    "project_selection_review_node": "project_selection_node",
    "skill_selection_review_node": "skill_selection_node",
    "execute_project_rewrite_node": "execute_project_rewrite_node",
    "execute_experience_rewrite_node": "execute_experience_rewrite_node",
    "certification_selection_review_node": "certification_selection_review_node",
    "summary_generation_review_node": "summary_generation_review_node",
    "section_order_node": "section_order_node",
    "cover_letter_review_node": "cover_letter_review_node",
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
            raw_output = event["data"].get("output", {})
            output = serialize_output(raw_output)

            token_log = raw_output.get("token_usage_log", [])
            usage = token_log[0] if token_log else None
            inp = usage.input_tokens if usage else 0
            out = usage.output_tokens if usage else 0

            if db and application_id:
                step = ApplicationStep(
                    application_id=application_id,
                    node=node,
                    label=NODE_LABELS.get(node, node),
                    data=output,
                    input_tokens=inp,
                    output_tokens=out,
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

        # Update all steps with latest token data from state.
        # Carousel nodes aren't in state until the node returns (after user approval),
        # and summary tokens live under a different node name than the step.
        _STEP_TOKEN_MAP = {"summary_generation_review_node": "summary_generation_node"}
        _token_log = final_state.values.get("token_usage_log", [])
        if _token_log:
            _token_by_node: dict[str, list[int]] = {}
            for _t in _token_log:
                _k = _t.node
                if _k not in _token_by_node:
                    _token_by_node[_k] = [0, 0]
                _token_by_node[_k][0] += _t.input_tokens
                _token_by_node[_k][1] += _t.output_tokens
            _steps = (
                db.query(ApplicationStep)
                .filter(ApplicationStep.application_id == application_id)
                .all()
            )
            for _step in _steps:
                _lookup = _STEP_TOKEN_MAP.get(_step.node, _step.node)
                if _lookup in _token_by_node:
                    _step.input_tokens = _token_by_node[_lookup][0]
                    _step.output_tokens = _token_by_node[_lookup][1]

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
            section_order = final_state.values.get("section_order")

            pdf_bytes, latex = make_pdf(tailored_resume_json, section_order)
            key = f"resumes/{app.user_id}/{app.id}.pdf"
            upload_to_s3(pdf_bytes, key)

            app.skill_match_results = json.loads(
                json.dumps(skill_match_results.model_dump(), cls=SetEncoder)
            )
            app.tailored_resume_json = tailored_resume_json.model_dump()
            app.pdf_key = key
            app.latex = latex
            token_usage_log = final_state.values.get("token_usage_log", [])
            _combined: dict[str, dict] = {}
            for _t in token_usage_log:
                if _t.node not in _combined:
                    _combined[_t.node] = {"node": _t.node, "label": None, "model": _t.model,
                                          "input_tokens": 0, "output_tokens": 0, "cached_tokens": 0}
                _combined[_t.node]["input_tokens"] += _t.input_tokens
                _combined[_t.node]["output_tokens"] += _t.output_tokens
                _combined[_t.node]["cached_tokens"] += _t.cached_tokens
                if not _combined[_t.node]["model"]:
                    _combined[_t.node]["model"] = _t.model
            app.token_usage_log = list(_combined.values())
            cover_letter = final_state.values.get("cover_letter")
            if cover_letter:
                app.cover_letter = cover_letter
                token_log = final_state.values.get("token_usage_log", [])
                cl_inp = sum(t.input_tokens for t in token_log if t.node == "cover_letter_node")
                cl_out = sum(t.output_tokens for t in token_log if t.node == "cover_letter_node")
                db.add(
                    ApplicationStep(
                        application_id=application_id,
                        node="cover_letter_node",
                        label=NODE_LABELS["cover_letter_node"],
                        data={"cover_letter": cover_letter},
                        input_tokens=cl_inp,
                        output_tokens=cl_out,
                    )
                )

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
            job_description, company_name, title, location, emp_type = (
                fetch_job_description(payload.job_id)
            )
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
        location=location,
        emp_type=emp_type,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    config: RunnableConfig = {"configurable": {"thread_id": str(application.id)}}
    background_tasks.add_task(
        graph_stream,
        {
            "company_name": company_name,
            "role_title": title,
            "raw_html": job_description,
            "resume_json": resume_json,
        },
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
    payloads_by_id = {
        p["id"]: p["value"] for p in (application.interrupt_payloads or [])
    }

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
            all_items = [
                item.model_dump() if hasattr(item, "model_dump") else item
                for item in prev_items
            ] + this_round
            token_log = current_state.values.get("token_usage_log", [])
            inp = sum(t.input_tokens for t in token_log if t.node == node_name)
            out = sum(t.output_tokens for t in token_log if t.node == node_name)
            db.add(
                ApplicationStep(
                    application_id=application_id,
                    node=node_name,
                    label=NODE_LABELS[node_name],
                    data={carousel["state_key"]: all_items},
                    input_tokens=inp,
                    output_tokens=out,
                )
            )
        else:
            current_state = tailor_agent.get_state(config)
            token_log = current_state.values.get("token_usage_log", [])
            inp = sum(t.input_tokens for t in token_log if t.node == node_name)
            out = sum(t.output_tokens for t in token_log if t.node == node_name)
            for r in feedback.responses:
                payload_value = payloads_by_id.get(r.interrupt_id)
                if payload_value:
                    step_data = dict(payload_value)
                    if r.section_order is not None:
                        step_data["sections"] = r.section_order
                    if r.edited_skills is not None:
                        step_data["selected_skills"] = r.edited_skills
                    if r.selected_project_indices is not None:
                        resume_json = current_state.values.get("resume_json")
                        agent_selected = current_state.values.get(
                            "selected_projects", []
                        )
                        all_projects = resume_json.projects if resume_json else []
                        reasoning_map = {
                            sp.title: sp.reasoning for sp in agent_selected
                        }
                        new_projects = []
                        for i in r.selected_project_indices:
                            if 0 <= i < len(all_projects):
                                p = all_projects[i]
                                d = p.model_dump()
                                d["reasoning"] = reasoning_map.get(p.title, "")
                                new_projects.append(d)
                        step_data["selected_projects"] = new_projects
                    db.add(
                        ApplicationStep(
                            application_id=application_id,
                            node=node_name,
                            label=NODE_LABELS[node_name],
                            data=step_data,
                            input_tokens=inp,
                            output_tokens=out,
                        )
                    )

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
