from langchain.chat_models import init_chat_model
from schemas import (
    JDResponseSchema,
    SemanticMatchResponseSchema,
    ProjectSelectResponseSchema,
    SkillSelectionResponse,
    ProjectRewriteResponse,
    ExperienceRewriteResponse,
    SkillMatchResultSchema,
    HumanReviewResponse,
)
from agent.tailor.state import TailorState
from langgraph.types import interrupt
from typing import Literal
from agent.tailor.prompts import (
    JD_PARSING_SYSTEM_PROMPT,
    SKILL_MATCH_SYSTEM_PROMPT,
    skill_match_user_prompt,
    PROJECT_SELECTION_SYSTEM_PROMPT,
    project_selection_user_prompt,
    SKILL_SELECTION_SYSTEM_PROMPT,
    skill_selection_user_prompt,
    PROJECT_REWRITE_SYSTEM_PROMPT,
    project_rewrite_user_prompt,
    EXPERIENCE_REWRITE_SYSTEM_PROMPT,
    experience_rewrite_user_prompt,
)


model = init_chat_model("gpt-5-nano")

jd_parsing_model = model.with_structured_output(JDResponseSchema)
semantic_skill_match_model = model.with_structured_output(SemanticMatchResponseSchema)
project_selection_model = model.with_structured_output(ProjectSelectResponseSchema)
skill_selection_model = model.with_structured_output(SkillSelectionResponse)
project_rewrite_model = model.with_structured_output(ProjectRewriteResponse)
experience_rewrite_model = model.with_structured_output(ExperienceRewriteResponse)


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

    if not state.project_messages:
        messages_to_store = messages + [
            {"role": "assistant", "content": response.model_dump_json()}
        ]
    else:
        messages_to_store = [
            {"role": "assistant", "content": response.model_dump_json()}
        ]

    return {
        "selected_projects": response.selected_projects,
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
            "message": "Review the selected skills. Approve or provide feedback.",
        }
    )

    response = HumanReviewResponse(**human_response)

    if response.approved:
        return {}
    else:
        return {
            "skill_messages": [
                {
                    "role": "user",
                    "content": f"Human feedback: {response.feedback}. Please revise.",
                }
            ]
        }


def should_reselect_skills(
    state: TailorState,
) -> Literal["skill_selection_node", "project_rewrite_node"]:
    if state.skill_messages and state.skill_messages[-1]["role"] == "user":
        return "skill_selection_node"
    return "project_rewrite_node"


def project_rewrite_node(state: TailorState):
    messages = state.project_rewrite_messages or [
        {"role": "system", "content": PROJECT_REWRITE_SYSTEM_PROMPT},
        {"role": "user", "content": project_rewrite_user_prompt(state)},
    ]

    response = project_rewrite_model.invoke(messages)

    if not state.project_rewrite_messages:
        messages_to_store = messages + [
            {"role": "assistant", "content": response.model_dump_json()}
        ]
    else:
        messages_to_store = [
            {"role": "assistant", "content": response.model_dump_json()}
        ]

    return {
        "rewritten_projects": response.rewritten_projects,
        "project_rewrite_messages": messages_to_store,
    }


def project_rewrite_review_node(state: TailorState):
    human_response = interrupt(
        {
            "rewritten_projects": [p.model_dump() for p in state.rewritten_projects],
            "message": "Review the rewritten projects. Approve or provide feedback.",
        }
    )

    response = HumanReviewResponse(**human_response)

    if response.approved:
        return {}
    else:
        return {
            "project_rewrite_messages": [
                {
                    "role": "user",
                    "content": f"Human feedback: {response.feedback}. Please revise.",
                }
            ]
        }


def should_rewrite_projects(
    state: TailorState,
) -> Literal["project_rewrite_node", "experience_rewrite_node"]:
    if (
        state.project_rewrite_messages
        and state.project_rewrite_messages[-1]["role"] == "user"
    ):
        return "project_rewrite_node"
    return "experience_rewrite_node"


def experience_rewrite_node(state: TailorState):
    messages = state.experience_rewrite_messages or [
        {"role": "system", "content": EXPERIENCE_REWRITE_SYSTEM_PROMPT},
        {"role": "user", "content": experience_rewrite_user_prompt(state)},
    ]

    response = experience_rewrite_model.invoke(messages)

    if not state.experience_rewrite_messages:
        messages_to_store = messages + [
            {"role": "assistant", "content": response.model_dump_json()}
        ]
    else:
        messages_to_store = [
            {"role": "assistant", "content": response.model_dump_json()}
        ]

    return {
        "rewritten_experience": response.rewritten_experience,
        "experience_rewrite_messages": messages_to_store,
    }


def experience_rewrite_review_node(state: TailorState):
    human_response = interrupt(
        {
            "rewritten_experience": [
                p.model_dump() for p in state.rewritten_experience
            ],
            "message": "Review the rewritten experience. Approve or provide feedback.",
        }
    )

    response = HumanReviewResponse(**human_response)

    if response.approved:
        return {}
    else:
        return {
            "experience_rewrite_messages": [
                {
                    "role": "user",
                    "content": f"Human feedback: {response.feedback}. Please revise.",
                }
            ]
        }


def should_rewrite_experience(
    state: TailorState,
) -> Literal["experience_rewrite_node", "assemble_resume_node"]:
    if (
        state.experience_rewrite_messages
        and state.experience_rewrite_messages[-1]["role"] == "user"
    ):
        return "experience_rewrite_node"
    return "assemble_resume_node"


def assemble_resume_node(state: TailorState):
    tailored = state.resume_json.model_copy(deep=True)
    tailored.projects = state.rewritten_projects
    tailored.skills = state.selected_skills
    tailored.experience = state.rewritten_experience
    return {"tailored_resume_json": tailored}
