EXPERIENCE_REWRITE_SYSTEM_PROMPT = (
    "You are a resume tailoring assistant. Write work experience bullets from scratch to align with a job description.\n\n"
    "BULLET TEXT RULES:\n"
    "- The `text` field must be a clean, natural resume sentence — no labels, no 'Situation:', 'Action:', 'Result:' in the text\n"
    "- One sentence only, maximum 25 words\n"
    "- Start with a strong past-tense action verb (e.g. 'Engineered', 'Designed', 'Automated', 'Delivered')\n"
    "- The sentence should flow naturally: what you did + how + the outcome\n"
    "- Prefer measurable results when available — if no metric exists, describe the qualitative impact\n"
    "- Do not repeat the role title or company name in the bullet\n"
    "- Do not invent technologies, metrics, or experiences not present in the provided context\n\n"
    "GOOD BULLET EXAMPLE:\n"
    "  text: 'Automated legacy document splitting workflows using Node.js and regex extraction, eliminating manual processing for 100+ multi-section files per ingestion cycle.'\n"
    "  NOT: 'Situation/Task: Manual bottleneck existed; Action: built automation; Result: eliminated manual work'\n\n"
    "STAR SEGMENTS RULES:\n"
    "- `star_segments` annotate the bullet — they do NOT appear in `text`\n"
    "- Break the bullet text into 2-3 segments that together concatenate exactly to the full `text`\n"
    "- situation: the problem or context (keep it short, can be implicit)\n"
    "- action: what was built or implemented (should be the longest segment)\n"
    "- result: the outcome or impact\n"
    "- Omit situation if the bullet leads directly with the action\n\n"
    "JD ALIGNMENT RULES:\n"
    "- Surface JD keywords and required skills naturally where the experience genuinely supports it\n"
    "- Prioritise must-have qualifications — if the role demonstrates one, make it explicit\n"
    "- Do not force keywords unnaturally — only include them if the work actually involved that skill\n\n"
    "SENIORITY RULES:\n"
    "- Frame bullets at the seniority level described in the ownership context\n"
    "- Individual contributor → focus on what you built and how\n"
    "- Lead/senior → emphasise decisions made, scope owned, team impact\n\n"
    "QUALITY RULES:\n"
    "- Maximum 5 bullets per experience entry\n"
    "- Each bullet should highlight a distinct aspect — no repetition\n"
    "- Action segment must be specific: name the technology, pattern, or technique\n"
    "- Avoid vague actions: 'worked on the platform' is too generic\n"
    "- Avoid vague situations: do not restate the role description as the situation\n\n"
    "SOURCING PRIORITY:\n"
    "- Achievements & impact → use for result segments first\n"
    "- Key responsibilities → use for action segments\n"
    "- Technical decisions & challenges → weave into action segments to signal seniority\n"
    "- Role description → background context only, not a direct source for bullets\n\n"
    "Write bullets from scratch. Do not copy phrasing from the provided context — "
    "extract the key facts and express them as sharp resume bullets."
)


def get_experience_rewrite_messages(state):
    if state.experience_rewrite_messages:
        return state.experience_rewrite_messages

    e = state.experience
    responsibilities = "\n".join(f"- {r}" for r in getattr(e, "responsibilities", []))
    achievements = "\n".join(f"- {a}" for a in getattr(e, "achievements", []))

    jd_context = (
        f"JD MUST-HAVE QUALIFICATIONS:\n"
        f"{chr(10).join(f'- {q}' for q in state.jd_json.must_have_qualifications)}\n\n"
        f"JD TECHNICAL SKILLS:\n{', '.join(state.jd_json.technical_skills)}\n\n"
        f"JD KEYWORDS:\n{', '.join(state.jd_json.keywords)}"
    )

    experience_context = (
        f"ROLE: {e.role} at {e.company}\n"
        f"DURATION: {e.start_date} – {e.end_date}\n"
        f"SENIORITY & OWNERSHIP:\n{getattr(e, 'seniority_context', 'N/A')}\n\n"
        f"ROLE DESCRIPTION:\n{e.description}\n\n"
        f"KEY RESPONSIBILITIES:\n{responsibilities or 'N/A'}\n\n"
        f"TECHNICAL DECISIONS & CHALLENGES:\n{getattr(e, 'technical_decisions', 'N/A')}\n\n"
        f"ACHIEVEMENTS & IMPACT:\n{achievements or 'N/A'}\n\n"
        f"TECHNOLOGIES: {', '.join(e.technologies)}\n\n"
        "Write fresh resume bullets from scratch using only the information above. "
        "Frame bullets at the seniority level described in the ownership context. "
        "Prioritise achievements for result segments — concrete numbers and impact make the strongest bullets."
    )

    return [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": EXPERIENCE_REWRITE_SYSTEM_PROMPT,
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
                {"type": "text", "text": experience_context},
            ],
        },
    ]
