from langchain.chat_models import init_chat_model
from langchain_anthropic import ChatAnthropic
from schemas import (
    JDResponseSchema,
    SelectedProject,
    SemanticMatchResponseSchema,
    ProjectSelectResponseSchema,
    SkillSelectionResponse,
    SkillMatchResultSchema,
    HumanReviewResponse,
    SkillCategory,
    TailoredResumeSchema,
    SectionOrderPayload,
    SectionConfig,
    ProjectWithSTAR,
    ExperienceWithSTAR,
    SummaryGenerationResponse,
)
from agent.state import TailorState
from langgraph.types import interrupt, Send
from typing import Literal
from agent.prompts import (
    get_jd_parsing_messages,
    get_skill_match_messages,
    get_project_selection_messages,
    get_skill_selection_messages,
    get_summary_generation_messages,
    COVER_LETTER_SYSTEM_PROMPT,
    cover_letter_user_prompt,
)
from langchain_core.callbacks import UsageMetadataCallbackHandler
from schemas import NodeTokenUsage
from agent.utils import extract_tokens
from rapidfuzz import fuzz
from langchain_tavily import TavilySearch
from langchain.agents import create_agent
from langchain_core.messages import SystemMessage
from agent.subagents.project_rewrite.graph import graph as project_rewrite_graph
from agent.subagents.experience_rewrite.graph import graph as experience_rewrite_graph


search_tool = TavilySearch(max_results=5, topic="general")

gpt_mini_model = init_chat_model("gpt-5-mini")
sonnet_model = ChatAnthropic(
    model="claude-sonnet-4-6",
    model_kwargs={"extra_headers": {"anthropic-beta": "prompt-caching-2024-07-31"}},
)


jd_parsing_model = sonnet_model.with_structured_output(JDResponseSchema)
semantic_skill_match_model = gpt_mini_model.with_structured_output(
    SemanticMatchResponseSchema
)
project_selection_model = gpt_mini_model.with_structured_output(
    ProjectSelectResponseSchema
)
skill_selection_model = gpt_mini_model.with_structured_output(SkillSelectionResponse)
summary_generation_model = gpt_mini_model.with_structured_output(
    SummaryGenerationResponse
)
cover_letter_agent = create_agent(
    sonnet_model,
    [search_tool],
    system_prompt=SystemMessage(
        content=[
            {
                "type": "text",
                "text": COVER_LETTER_SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ]
    ),
)


def jd_parsing_node(state: TailorState) -> TailorState:
    messages = get_jd_parsing_messages(state)
    callback = UsageMetadataCallbackHandler()
    response = jd_parsing_model.invoke(messages, config={"callbacks": [callback]})
    inp, out, cached, model = extract_tokens(callback)
    return {
        "jd_json": response,
        "token_usage_log": [
            NodeTokenUsage(
                node="jd_parsing_node",
                model=model,
                input_tokens=inp,
                output_tokens=out,
                cached_tokens=cached,
            )
        ],
    }


def skill_match_node(state: TailorState) -> TailorState:

    def normalize(items: list[str]) -> set[str]:
        return {s.strip().lower() for s in items if s.strip()}

    def flatten_resume_skills(skill_categories) -> set[str]:
        return {
            skill.strip().lower()
            for category in skill_categories
            for skill in category.skills
        }

    def fuzzy_match(item: str, candidates: set[str], threshold: int = 82) -> bool:
        return any(fuzz.ratio(item.lower(), c.lower()) >= threshold for c in candidates)

    def split_fuzzy(targets: set[str], candidates: set[str]):
        matched, unresolved = set(), set()
        for item in targets:
            if fuzzy_match(item, candidates):
                matched.add(item)
            else:
                unresolved.add(item)
        return matched, unresolved

    resume_skills = flatten_resume_skills(state.resume_json.skills)

    resume_project_context = "\n\n".join(
        f"Project: {p.title}\n"
        f"Technologies: {', '.join(p.technologies)}\n"
        f"Description: {p.description}\n"
        for p in state.resume_json.projects
    )

    resume_experience_context = "\n\n".join(
        f"Role: {e.role} at {e.company}\n"
        f"Responsibilities: {chr(10).join(f'- {r}' for r in e.responsibilities)}\n"
        f"Description: {e.description}"
        for e in state.resume_json.experience
    )

    must_have = normalize(state.jd_json.must_have_qualifications)
    nice_to_have = normalize(state.jd_json.nice_to_have_qualifications)
    technical_skills = normalize(state.jd_json.technical_skills)

    matched_technical, unresolved_technical = split_fuzzy(
        technical_skills, resume_skills
    )
    missing_technical = unresolved_technical

    matched_must_have, unresolved_must = split_fuzzy(must_have, resume_skills)
    matched_nice_to_have, unresolved_nice = split_fuzzy(nice_to_have, resume_skills)

    callback = UsageMetadataCallbackHandler()
    if unresolved_must or unresolved_nice or unresolved_technical:
        messages = get_skill_match_messages(
            resume_skills=resume_skills,
            unresolved_must=unresolved_must,
            unresolved_nice=unresolved_nice,
            unresolved_technical=unresolved_technical,
            project_context=resume_project_context,
            experience_context=resume_experience_context,
        )

        semantic = semantic_skill_match_model.invoke(
            messages, config={"callbacks": [callback]}
        )

        matched_must_have |= set(semantic.matched_must_have)
        unresolved_must -= set(semantic.matched_must_have)

        matched_nice_to_have |= set(semantic.matched_nice_to_have)
        unresolved_nice -= set(semantic.matched_nice_to_have)

        matched_technical |= set(semantic.matched_technical)
        missing_technical = unresolved_technical - set(semantic.matched_technical)

    inp, out, cached, model = extract_tokens(callback)
    must_score = len(matched_must_have) / max(len(must_have), 1)
    nice_score = len(matched_nice_to_have) / max(len(nice_to_have), 1)
    tech_score = len(matched_technical) / max(len(technical_skills), 1)

    return {
        "skill_match_results": SkillMatchResultSchema(
            matched_must_have=matched_must_have,
            missing_must_have=unresolved_must,
            matched_nice_to_have=matched_nice_to_have,
            missing_nice_to_have=unresolved_nice,
            matched_technical=matched_technical,
            missing_technical=missing_technical,
            must_have_score=round(must_score, 3),
            nice_to_have_score=round(nice_score, 3),
            tech_score=round(tech_score, 3),
            final_score=round(
                (0.6 * must_score) + (0.25 * nice_score) + (0.15 * tech_score), 3
            ),
        ),
        "token_usage_log": [
            NodeTokenUsage(
                node="skill_match_node",
                model=model,
                input_tokens=inp,
                output_tokens=out,
                cached_tokens=cached,
            )
        ],
    }


def project_selection_node(state: TailorState):
    messages = get_project_selection_messages(state)
    callback = UsageMetadataCallbackHandler()
    response = project_selection_model.invoke(
        messages, config={"callbacks": [callback]}
    )
    inp, out, cached, model = extract_tokens(callback)

    selected_projects = []
    for item in response.selected_projects:
        if 0 <= item.index < len(state.resume_json.projects):
            p = state.resume_json.projects[item.index]
            selected_projects.append(
                SelectedProject(
                    title=p.title,
                    technologies=p.technologies,
                    description=p.description,
                    link=getattr(p, "link", None),
                    reasoning=item.reasoning,
                )
            )

    return {
        "selected_projects": selected_projects,
        "token_usage_log": [
            NodeTokenUsage(
                node="project_selection_node",
                model=model,
                input_tokens=inp,
                output_tokens=out,
                cached_tokens=cached,
            )
        ],
    }


def project_selection_review_node(state: TailorState):
    human_response = interrupt(
        {
            "selected_projects": [p.model_dump() for p in state.selected_projects],
            "message": "Review the selected projects.",
        }
    )

    response = HumanReviewResponse(**human_response)

    indices = response.selected_project_indices or []
    if not indices:
        return {}

    new_selected = []
    for idx in indices:
        if 0 <= idx < len(state.resume_json.projects):
            p = state.resume_json.projects[idx]
            existing = next(
                (sp for sp in state.selected_projects if sp.title == p.title), None
            )
            new_selected.append(
                SelectedProject(
                    title=p.title,
                    technologies=p.technologies,
                    description=p.description,
                    link=getattr(p, "link", None),
                    reasoning=existing.reasoning if existing else "",
                )
            )

    return {"selected_projects": new_selected}


def skill_selection_node(state: TailorState):
    messages = get_skill_selection_messages(state)
    callback = UsageMetadataCallbackHandler()
    response = skill_selection_model.invoke(messages, config={"callbacks": [callback]})
    inp, out, cached, model = extract_tokens(callback)
    return {
        "selected_skills": response.selected_skills,
        "token_usage_log": [
            NodeTokenUsage(
                node="skill_selection_node",
                model=model,
                input_tokens=inp,
                output_tokens=out,
                cached_tokens=cached,
            )
        ],
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
    project_title = (
        project_in.get("title")
        if isinstance(project_in, dict)
        else getattr(project_in, "title", "")
    )

    result = project_rewrite_graph.invoke(
        {
            "jd_json": state["jd_json"].model_dump(),
            "project": project_in.model_dump()
            if hasattr(project_in, "model_dump")
            else project_in,
        }
    )

    sub_log = result.get("token_usage_log", [])
    inp = sum(e.input_tokens for e in sub_log)
    out = sum(e.output_tokens for e in sub_log)
    cached = sum(e.cached_tokens for e in sub_log)
    model = sub_log[0].model if sub_log else ""

    raw = result["rewritten_project"]
    project_out = ProjectWithSTAR(**raw) if isinstance(raw, dict) else raw

    return {
        "rewritten_projects": [project_out],
        "token_usage_log": [
            NodeTokenUsage(
                node="execute_project_rewrite_node",
                label=project_title,
                model=model,
                input_tokens=inp,
                output_tokens=out,
                cached_tokens=cached,
            )
        ],
    }


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
    if isinstance(experience_in, dict):
        exp_label = (
            f"{experience_in.get('role', '')} at {experience_in.get('company', '')}"
        )
    else:
        exp_label = f"{getattr(experience_in, 'role', '')} at {getattr(experience_in, 'company', '')}"
    result = experience_rewrite_graph.invoke(
        {
            "jd_json": state["jd_json"].model_dump(),
            "experience": experience_in.model_dump()
            if hasattr(experience_in, "model_dump")
            else experience_in,
        }
    )

    sub_log = result.get("token_usage_log", [])
    inp = sum(e.input_tokens for e in sub_log)
    out = sum(e.output_tokens for e in sub_log)
    cached = sum(e.cached_tokens for e in sub_log)
    model = sub_log[0].model if sub_log else ""

    raw = result["rewritten_experience"]
    experience_out = ExperienceWithSTAR(**raw) if isinstance(raw, dict) else raw

    return {
        "rewritten_experience": [experience_out],
        "token_usage_log": [
            NodeTokenUsage(
                node="execute_experience_rewrite_node",
                label=exp_label,
                model=model,
                input_tokens=inp,
                output_tokens=out,
                cached_tokens=cached,
            )
        ],
    }


def certification_selection_review_node(state: TailorState):
    certifications = state.resume_json.certifications or []
    publications = state.resume_json.publications or []
    human_response = interrupt(
        {
            "certifications": [c.model_dump() for c in certifications],
            "publications": [p.model_dump() for p in publications],
            "message": "Select which certifications and publications to include.",
        }
    )
    return {
        "selected_certifications": [
            certifications[i]
            for i in human_response.get("selected_certification_indices", [])
        ],
        "selected_publications": [
            publications[i]
            for i in human_response.get("selected_publication_indices", [])
        ],
    }


def should_include_cert_pub_review(state: TailorState):
    has_certs = bool(state.resume_json.certifications)
    has_pubs = bool(state.resume_json.publications)
    return (
        "certification_selection_review_node"
        if (has_certs or has_pubs)
        else "summary_generation_node"
    )


def summary_generation_node(state: TailorState):
    messages = get_summary_generation_messages(state)
    callback = UsageMetadataCallbackHandler()
    result = summary_generation_model.invoke(messages, config={"callbacks": [callback]})
    inp, out, cached, model = extract_tokens(callback)

    if not state.summary_messages:
        messages_to_store = messages + [
            {"role": "assistant", "content": result.summary}
        ]
    else:
        messages_to_store = state.summary_messages + [
            {"role": "assistant", "content": result.summary}
        ]

    return {
        "generated_summary": result.summary,
        "summary_messages": messages_to_store,
        "token_usage_log": [
            NodeTokenUsage(
                node="summary_generation_node",
                model=model,
                input_tokens=inp,
                output_tokens=out,
                cached_tokens=cached,
            )
        ],
    }


def summary_generation_review_node(state: TailorState):
    human_response = interrupt(
        {
            "summary": state.generated_summary,
            "message": "Review the generated summary. Approve or provide feedback.",
        }
    )
    response = HumanReviewResponse(**human_response)

    if response.approved:
        return {}

    return {
        "summary_messages": state.summary_messages
        + [
            {
                "role": "user",
                "content": f"Human feedback: {response.feedback}. Please revise.",
            }
        ]
    }


def should_regenerate_summary(
    state: TailorState,
) -> Literal["summary_generation_node", "section_order_node"]:
    last = state.summary_messages[-1] if state.summary_messages else None
    if last and last.get("role") == "user":
        return "summary_generation_node"
    return "section_order_node"


def section_order_node(state: TailorState):
    resume = state.resume_json
    sections = [
        {"id": "summary", "label": "Summary", "visible": bool(state.generated_summary)},
        {"id": "experience", "label": "Experience", "visible": True},
        {"id": "projects", "label": "Projects", "visible": True},
        {"id": "skills", "label": "Skills", "visible": True},
        {"id": "education", "label": "Education", "visible": bool(resume.education)},
        {
            "id": "certifications",
            "label": "Certifications",
            "visible": bool(state.selected_certifications),
        },
        {
            "id": "publications",
            "label": "Publications",
            "visible": bool(state.selected_publications),
        },
    ]
    human_response = interrupt(
        {"sections": sections, "message": "Reorder or hide sections as needed."}
    )
    return {
        "section_order": SectionOrderPayload(
            sections=[SectionConfig(**s) for s in human_response["section_order"]]
        )
    }


def cover_letter_review_node(state: TailorState):
    human_response = interrupt(
        {"message": "Would you like to generate a cover letter for this position?"}
    )
    response = HumanReviewResponse(**human_response)
    return {"wants_cover_letter": response.approved}


def should_generate_cover_letter(
    state: TailorState,
) -> Literal["cover_letter_node", "assemble_resume_node"]:
    if state.wants_cover_letter:
        return "cover_letter_node"
    return "assemble_resume_node"


def cover_letter_node(state: TailorState):
    messages = [
        {"role": "user", "content": cover_letter_user_prompt(state)},
    ]
    callback = UsageMetadataCallbackHandler()
    result = cover_letter_agent.invoke(
        {"messages": messages}, config={"callbacks": [callback]}
    )
    inp, out, cached, model = extract_tokens(callback)

    final_message = result["messages"][-1]
    cover_letter_text = final_message.content

    if isinstance(cover_letter_text, list):
        cover_letter_text = " ".join(
            block["text"]
            for block in cover_letter_text
            if isinstance(block, dict) and block.get("type") == "text"
        )

    return {
        "cover_letter": cover_letter_text,
        "token_usage_log": [
            NodeTokenUsage(
                node="cover_letter_node",
                model=model,
                input_tokens=inp,
                output_tokens=out,
                cached_tokens=cached,
            )
        ],
    }


def assemble_resume_node(state: TailorState):
    base = state.resume_json
    tailored = TailoredResumeSchema(
        name=base.name,
        email=base.email,
        phone=base.phone,
        linkedin=base.linkedin,
        github=base.github,
        summary=state.generated_summary,
        skills=state.selected_skills,
        education=base.education,
        projects=state.rewritten_projects,
        experience=state.rewritten_experience,
        certifications=state.selected_certifications,
        publications=state.selected_publications,
    )
    return {"tailored_resume_json": tailored}
