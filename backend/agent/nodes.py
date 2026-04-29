from langchain.chat_models import init_chat_model
from schemas import (
    JDResponseSchema,
    SemanticMatchResponseSchema,
    ProjectSelectResponseSchema,
    SkillSelectionResponse,
    SkillMatchResultSchema,
    HumanReviewResponse,
    SkillCategory,
    Project,
    Experience,
)
from agent.state import TailorState
from langgraph.types import interrupt, Send
from typing import Literal
from agent.prompts import (
    JD_PARSING_SYSTEM_PROMPT,
    SKILL_MATCH_SYSTEM_PROMPT,
    skill_match_user_prompt,
    PROJECT_SELECTION_SYSTEM_PROMPT,
    project_selection_user_prompt,
    SKILL_SELECTION_SYSTEM_PROMPT,
    skill_selection_user_prompt,
)
from agent.subagents.project_rewrite.graph import graph as project_rewrite_graph
from agent.subagents.experience_rewrite.graph import graph as experience_rewrite_graph
import json

model = init_chat_model("gpt-5-nano")

jd_parsing_model = model.with_structured_output(JDResponseSchema)
semantic_skill_match_model = model.with_structured_output(SemanticMatchResponseSchema)
project_selection_model = model.with_structured_output(ProjectSelectResponseSchema)
skill_selection_model = model.with_structured_output(SkillSelectionResponse)


def jd_parsing_node(state: TailorState) -> TailorState:
    messages = [
        {
            "role": "system",
            "content": JD_PARSING_SYSTEM_PROMPT,
        },
        {"role": "user", "content": f"JD:\n{state.raw_html}"},
    ]

    response = jd_parsing_model.invoke(messages)
    return {"jd_json": response}


def skill_match_node(state: TailorState) -> TailorState:
    def normalize(skills):
        return {s.strip().lower() for s in skills if s.strip()}

    def flatten_resume_skills(skill_categories):
        return {
            skill.strip().lower()
            for category in skill_categories
            for skill in category.skills
        }

    must_have = normalize(state.jd_json.must_have_qualifications)
    nice_to_have = normalize(state.jd_json.nice_to_have_qualifications)
    resume = flatten_resume_skills(state.resume_json.skills)

    matched_must_have = must_have & resume
    missing_must_have = must_have - resume
    matched_nice_to_have = nice_to_have & resume
    missing_nice_to_have = nice_to_have - resume

    if missing_must_have or missing_nice_to_have:
        messages = [
            {
                "role": "system",
                "content": SKILL_MATCH_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": skill_match_user_prompt(
                    resume, missing_must_have, missing_nice_to_have
                ),
            },
        ]

        semantic_matches = semantic_skill_match_model.invoke(messages)
        matched_must_have |= set(semantic_matches.matched_must_have)
        missing_must_have -= set(semantic_matches.matched_must_have)
        matched_nice_to_have |= set(semantic_matches.matched_nice_to_have)
        missing_nice_to_have -= set(semantic_matches.matched_nice_to_have)

    must_score = len(matched_must_have) / max(len(must_have), 1)
    nice_score = len(matched_nice_to_have) / max(len(nice_to_have), 1)

    return {
        "skill_match_results": SkillMatchResultSchema(
            matched_must_have=matched_must_have,
            missing_must_have=missing_must_have,
            matched_nice_to_have=matched_nice_to_have,
            missing_nice_to_have=missing_nice_to_have,
            must_have_score=round(must_score, 3),
            nice_to_have_score=round(nice_score, 3),
            final_score=round((0.7 * must_score) + (0.3 * nice_score), 3),
        )
    }


def project_selection_node(state: TailorState):
    messages = state.project_messages or [
        {"role": "system", "content": PROJECT_SELECTION_SYSTEM_PROMPT},
        {"role": "user", "content": project_selection_user_prompt(state)},
    ]

    response = project_selection_model.invoke(messages)

    selected_projects = [
        state.resume_json.projects[i]
        for i in response.selected_project_indexes
        if 0 <= i < len(state.resume_json.projects)
    ]

    assistant_payload = {
        "selected_projects": [p.model_dump() for p in selected_projects]
    }

    if not state.project_messages:
        messages_to_store = messages + [
            {"role": "assistant", "content": json.dumps(assistant_payload)}
        ]
    else:
        messages_to_store = [
            {"role": "assistant", "content": json.dumps(assistant_payload)}
        ]

    return {
        "selected_projects": selected_projects,
        "project_messages": messages_to_store,
    }


def project_selection_review_node(state: TailorState):
    human_response = interrupt(
        {
            "selected_projects": [p.model_dump() for p in state.selected_projects],
            "message": "Review the selected projects. Approve or provide feedback.",
        }
    )

    response = HumanReviewResponse(**human_response)

    if response.approved:
        return {}
    else:
        return {
            "project_messages": [
                {
                    "role": "user",
                    "content": f"Human feedback: {response.feedback}. Please revise.",
                }
            ]
        }


def should_reselect_projects(
    state: TailorState,
) -> Literal["project_selection_node", "skill_selection_node"]:
    if state.project_messages and state.project_messages[-1]["role"] == "user":
        return "project_selection_node"
    return "skill_selection_node"


def skill_selection_node(state: TailorState):
    messages = state.skill_messages or [
        {"role": "system", "content": SKILL_SELECTION_SYSTEM_PROMPT},
        {"role": "user", "content": skill_selection_user_prompt(state)},
    ]

    response = skill_selection_model.invoke(messages)

    if not state.skill_messages:
        messages_to_store = messages + [
            {"role": "assistant", "content": response.model_dump_json()}
        ]
    else:
        messages_to_store = [
            {"role": "assistant", "content": response.model_dump_json()}
        ]

    return {
        "selected_skills": response.selected_skills,
        "skill_messages": messages_to_store,
    }


def skill_selection_review_node(state: TailorState):
    human_response = interrupt(
        {
            "selected_skills": [s.model_dump() for s in state.selected_skills],
            "message": "Review the selected skills. Verify and Approve.",
        }
    )

    response = HumanReviewResponse(**human_response)

    return {"selected_skills": [SkillCategory(**s) for s in response.edited_skills]}


def continue_to_project_rewrite_node(state: TailorState):
    return [
        Send("execute_project_rewrite_node", {"jd_json": state.jd_json, "project": p})
        for p in state.selected_projects
    ]


def execute_project_rewrite_node(state: TailorState):
    project_in = state["project"]
    title = (
        project_in.title
        if hasattr(project_in, "title")
        else project_in.get("title", "?")
    )

    print(f"\n{'=' * 50}")
    print(f"  execute_project_rewrite_node : '{title}'")
    print(f"{'=' * 50}")

    result = project_rewrite_graph.invoke(
        {
            "jd_json": state["jd_json"].model_dump(),
            "project": project_in.model_dump()
            if hasattr(project_in, "model_dump")
            else project_in,
        }
    )

    raw = result["rewritten_project"]
    project_out = Project(**raw) if isinstance(raw, dict) else raw

    messages = result.get("project_rewrite_messages", [])
    print(f"\n  ✅ subgraph done — '{project_out.title}'")
    print(f"     rewritten bullets : {len(project_out.bullets)}")
    for b in project_out.bullets:
        print(f"       • {b[:80]}{'...' if len(b) > 80 else ''}")
    print(f"     total messages    : {len(messages)}")
    for msg in messages:
        role = msg.get("role", "?")
        content = str(msg.get("content", ""))
        preview = content[:60] + "..." if len(content) > 60 else content
        print(f"       [{role}] {preview}")

    return {"rewritten_projects": [project_out]}


def project_join_node(state: TailorState):
    return {}


def continue_to_experience_rewrite_node(state: TailorState):
    return [
        Send(
            "execute_experience_rewrite_node",
            {"jd_json": state.jd_json, "experience": e},
        )
        for e in state.resume_json.experience
    ]


def execute_experience_rewrite_node(state: TailorState):
    experience_in = state["experience"]
    company = (
        experience_in.company
        if hasattr(experience_in, "company")
        else experience_in.get("company", "?")
    )
    role = (
        experience_in.role
        if hasattr(experience_in, "role")
        else experience_in.get("role", "?")
    )

    print(f"\n{'=' * 50}")
    print(f"  execute_experience_rewrite_node : '{role} @ {company}'")
    print(f"{'=' * 50}")

    result = experience_rewrite_graph.invoke(
        {
            "jd_json": state["jd_json"].model_dump(),
            "experience": experience_in.model_dump()
            if hasattr(experience_in, "model_dump")
            else experience_in,
        }
    )

    raw = result["rewritten_experience"]
    experience_out = Experience(**raw) if isinstance(raw, dict) else raw

    print(f"\n  subgraph done - '{role} @ {company}'")
    print(f"     rewritten bullets : {len(experience_out.bullets)}")

    return {"rewritten_experience": [experience_out]}


def assemble_resume_node(state: TailorState):
    tailored = state.resume_json.model_copy(deep=True)
    tailored.projects = state.rewritten_projects
    tailored.skills = state.selected_skills
    tailored.experience = state.rewritten_experience
    return {"tailored_resume_json": tailored}
