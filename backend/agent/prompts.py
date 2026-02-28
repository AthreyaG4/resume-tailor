JD_PARSING_SYSTEM_PROMPT = (
    "Parse job descriptions into structured JSON. "
    "Extract only what is explicitly stated. "
    "Skills must be atomic keywords (1-3 words, normalized, no duplicates, no 'experience with')."
)

SKILL_MATCH_SYSTEM_PROMPT = (
    "You are a skill matching assistant. Given a list of resume skills and unmatched JD skills, "
    "identify which JD skills are semantically covered by resume skills "
    "(e.g. 'k8s' matches 'Kubernetes', 'Postgres' matches 'PostgreSQL'). "
    "Return only the JD skills that are actually covered."
)


def skill_match_user_prompt(resume, missing_must_have, missing_nice_to_have):
    return (
        f"Resume skills: {list(resume)}\n\n"
        f"Unmatched must-have JD skills: {list(missing_must_have)}\n"
        f"Unmatched nice-to-have JD skills: {list(missing_nice_to_have)}\n\n"
        f"Which unmatched JD skills are semantically covered by the resume skills?"
    )


PROJECT_SELECTION_SYSTEM_PROMPT = (
    "You are a resume tailoring assistant. Select the most relevant projects that align with the job description.\n\n"
    "Rules:\n"
    "- If 3 or fewer projects exist, select all of them.\n"
    "- If more than 3 projects exist, select the 3 most relevant.\n"
    "- Relevance is not just exact skill matches — consider transferable skills, similar tools, and domain experience.\n"
    "- A strong work experience that demonstrates the same competency is also valid context for selection.\n\n"
    "Return only the selected project objects."
)


def project_selection_user_prompt(state):
    return (
        f"JD Keywords: {state.jd_json.keywords}\n"
        f"Must-have skills: {state.skill_match_results.matched_must_have}\n\n"
        f"Projects:\n{state.resume_json.projects}"
    )


SKILL_SELECTION_SYSTEM_PROMPT = (
    "You are a resume tailoring assistant. Select and reorder the candidate's skills to best align with the job description.\n\n"
    "Rules:\n"
    "- Prioritize skills that directly match the JD.\n"
    "- Include adjacent and complementary skills in the same domain even if not explicitly mentioned "
    "(e.g. if JD mentions PyTorch, including HuggingFace is a good idea).\n"
    "- Drop skills that are completely irrelevant to the role.\n"
    "- Order by relevance — most relevant first.\n"
    "- Do not invent skills the candidate doesn't have."
)


def skill_selection_user_prompt(state):
    return (
        f"JD Keywords: {state.jd_json.keywords}\n"
        f"Must-have skills: {state.skill_match_results.matched_must_have}\n"
        f"Missing skills: {state.skill_match_results.missing_must_have}\n\n"
        f"Candidate skills: {state.resume_json.skills}"
    )


PROJECT_REWRITE_SYSTEM_PROMPT = (
    "You are a resume tailoring assistant. Rewrite project bullets to better align with the job description.\n\n"
    "Rules:\n"
    "- Rewrite bullets to emphasize relevant skills and technologies from the JD.\n"
    "- Keep bullets concise and achievement-focused (use numbers/metrics where possible).\n"
    "- Do not invent technologies or experiences not present in the original.\n"
    "- Maintain the same project structure, only rewrite the bullets.\n"
    "- Use action verbs that align with the JD's language."
)


def project_rewrite_user_prompt(state):
    return (
        f"JD Keywords: {state.jd_json.keywords}\n"
        f"Must-have skills: {state.skill_match_results.matched_must_have}\n\n"
        f"Projects to rewrite:\n{state.selected_projects}"
    )


EXPERIENCE_REWRITE_SYSTEM_PROMPT = (
    "You are a resume tailoring assistant. Rewrite experience bullets to better align with the job description.\n\n"
    "Rules:\n"
    "- Rewrite bullets to emphasize relevant skills and technologies from the JD.\n"
    "- Keep bullets concise and achievement-focused (use numbers/metrics where possible).\n"
    "- Do not invent technologies or experiences not present in the original.\n"
    "- Maintain the same experience structure, only rewrite the bullets.\n"
    "- Use action verbs that align with the JD's language.\n"
    "- Do not change company, role, dates or location."
)


def experience_rewrite_user_prompt(state):
    return (
        f"JD Keywords: {state.jd_json.keywords}\n"
        f"Must-have skills: {state.skill_match_results.matched_must_have}\n\n"
        f"Experience to rewrite:\n{state.resume_json.experience}"
    )
