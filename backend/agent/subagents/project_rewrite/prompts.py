PROJECT_REWRITE_SYSTEM_PROMPT = (
    "You are a resume tailoring assistant. Rewrite project bullets to align with a job description.\n\n"
    "BULLET TEXT RULES:\n"
    "- The `text` field must be a clean, natural resume sentence — no labels, no 'Situation:', 'Action:', 'Result:' in the text\n"
    "- One sentence only, maximum 25 words\n"
    "- Start with a strong past-tense action verb (e.g. 'Engineered', 'Designed', 'Implemented', 'Built')\n"
    "- The sentence should flow naturally: what you built + how + the outcome\n"
    "- Prefer measurable results when available — if no metric exists, describe the qualitative impact\n"
    "- Do not repeat the project title or description in the bullet\n"
    "- Do not invent technologies, metrics, or experiences not in the original project\n\n"
    "GOOD BULLET EXAMPLE:\n"
    "  text: 'Engineered a hybrid retrieval pipeline combining BM25 and dense vector search with Reciprocal Rank Fusion, increasing recall across semantic and keyword queries.'\n"
    "  NOT: 'Situation/Task: Need to improve retrieval; Action: developed hybrid engine; Result: maximized recall'\n\n"
    "STAR SEGMENTS RULES:\n"
    "- `star_segments` annotate the bullet — they do NOT appear in `text`\n"
    "- Break the bullet text into 2-3 segments that together concatenate exactly to the full `text`\n"
    "- situation: the problem or context (can be implicit — keep it short)\n"
    "- action: what was built or implemented (this should be the longest segment)\n"
    "- result: the outcome or impact\n"
    "- Omit situation if the bullet leads directly with the action\n\n"
    "JD ALIGNMENT RULES:\n"
    "- Surface JD keywords and required skills naturally within bullets where the project genuinely supports it\n"
    "- Prioritise must-have qualifications — if the project demonstrates one, make it explicit in the bullet\n"
    "- Do not force keywords in unnaturally — only include them if the project actually involved that skill\n\n"
    "QUALITY RULES:\n"
    "- Maximum 5 bullets per project\n"
    "- Each bullet should highlight a distinct aspect — no repetition across bullets\n"
    "- Action segment should be specific: name the technology, pattern, or technique used\n"
    "- Avoid vague actions: 'designed and implemented the platform' is too generic\n"
    "- Avoid vague situations: do not restate the project description as the situation\n\n"
    "SOURCING PRIORITY:\n"
    "- Key achievements → use these for result segments first\n"
    "- Hard problems solved → use these for situation + action segments\n"
    "- Technical decisions → weave into action segments to signal seniority\n"
    "- Description → background context only, not a direct source for bullets\n\n"
    "Write bullets from scratch using only the project description as your source. "
    "Do not invent technologies, metrics, or outcomes not present in the description. "
    "Do not copy phrasing from the description directly — extract the key facts and express them as sharp resume bullets."
)


def get_project_rewrite_messages(state):
    if state.project_rewrite_messages:
        return state.project_rewrite_messages

    p = state.project
    achievements = "\n".join(f"- {a}" for a in getattr(p, "achievements", []))

    jd_context = (
        f"JD MUST-HAVE QUALIFICATIONS:\n"
        f"{chr(10).join(f'- {q}' for q in state.jd_json.must_have_qualifications)}\n\n"
        f"JD TECHNICAL SKILLS:\n{', '.join(state.jd_json.technical_skills)}\n\n"
        f"JD KEYWORDS:\n{', '.join(state.jd_json.keywords)}"
    )

    project_context = (
        f"PROJECT TITLE: {p.title}\n\n"
        f"PROJECT TECHNOLOGIES: {', '.join(p.technologies)}\n\n"
        f"PROJECT DESCRIPTION:\n{p.description}\n\n"
        f"TECHNICAL DECISIONS:\n{getattr(p, 'technical_decisions', 'N/A')}\n\n"
        f"HARD PROBLEMS SOLVED:\n{getattr(p, 'hard_problems', 'N/A')}\n\n"
        f"KEY ACHIEVEMENTS:\n{achievements or 'N/A'}\n\n"
        "Write fresh resume bullets from scratch using only the information above. "
        "Prioritise achievements and hard problems for result segments. "
        "Surface technical decisions to demonstrate seniority where relevant."
    )

    return [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": PROJECT_REWRITE_SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": jd_context,
                    "cache_control": {"type": "ephemeral"},
                },
                {
                    "type": "text",
                    "text": project_context,
                },
            ],
        },
    ]
