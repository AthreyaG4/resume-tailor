JD_PARSING_SYSTEM_PROMPT = (
    "You are a precise job description parser. Extract structured data from job descriptions into JSON. "
    "Follow these rules strictly:\n\n"
    "MUST-HAVE vs NICE-TO-HAVE QUALIFICATIONS:\n"
    "- must_have_qualifications: extract ONLY from sections labelled 'required', 'requirements', 'qualifications', 'all about you', 'responsibilities', or equivalent\n"
    "- nice_to_have_qualifications: extract ONLY from sections labelled 'preferred', 'bonus', 'nice to have', 'what makes you stand out', 'advantageous', or equivalent\n"
    "- Never move items between sections based on your own judgment — respect the JD's own categorisation strictly\n"
    "- Each item must be a short phrase under 10 words — not copy-pasted, but faithfully summarised\n"
    "- Strip filler language: remove 'ability to', 'experience working as', 'basic understanding of', 'strong interest in', 'willingness to'\n"
    "- Start each item with a noun or skill: 'Python proficiency', 'ML model deployment', '2+ years ML engineering'\n"
    "- Merge related points into one item — do not repeat the same requirement in different words\n"
    "- Do not infer attitude, mindset, curiosity, or growth potential — only extract explicitly stated, verifiable requirements\n"
    "- If no nice-to-have section exists, return an empty list\n\n"
    "TECHNICAL SKILLS:\n"
    "- Extract only concrete technical skills — tools, languages, frameworks, platforms, methodologies\n"
    "- Must be atomic keywords of 1-3 words (e.g. 'Python', 'CI/CD', 'React', 'Docker')\n"
    "- Normalize variations: 'Postgres' → 'PostgreSQL', 'JS' → 'JavaScript'\n"
    "- No duplicates, no soft skills\n"
    "- Never return sentences or phrases — only skill keywords\n\n"
    "SOFT SKILLS:\n"
    "- Extract interpersonal and behavioural skills only (e.g. 'collaboration', 'communication', 'stakeholder management')\n"
    "- Single words or short noun phrases only — never sentences\n"
    "- Keep separate from technical_skills\n"
    "- If none are mentioned, return an empty list\n\n"
    "KEYWORDS:\n"
    "- Domain-specific buzzwords and concepts central to the role (e.g. 'Generative AI', 'RAG', 'LLMOps', 'NLP', 'agile')\n"
    "- Distinct from technical_skills — keywords are broader concepts, not specific tools\n"
    "- Used for ATS matching — include terms a recruiter would search for\n"
    "- 1-4 words, no duplicates with technical_skills\n\n"
    "ROLE METADATA:\n"
    "- seniority_level: one of 'junior', 'mid', 'senior', 'lead', 'manager', or 'not specified' — infer from years of experience and responsibilities if not explicit\n"
    "- years_of_experience: minimum years as an integer, 0 if not mentioned\n\n"
    "Return only valid JSON. Do not include any explanation or commentary outside the JSON."
)


def get_jd_parsing_messages(state):
    return [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": JD_PARSING_SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
        },
        {"role": "user", "content": f"JD:\n{state.raw_html}"},
    ]


SKILL_MATCH_SYSTEM_PROMPT = (
    "You are an expert skill matching assistant for resume screening. "
    "Given resume skills, project descriptions, and experience bullets, identify which unmatched JD requirements are semantically covered by the resume.\n\n"
    "MATCHING RULES FOR TECHNICAL SKILLS:\n"
    "- Abbreviations and aliases: 'k8s' matches 'Kubernetes', 'JS' matches 'JavaScript', 'Postgres' matches 'PostgreSQL'\n"
    "- Same technology family: if JD lists multiple options (e.g. 'MySQL, PostgreSQL, or SQL Server'), match if resume contains ANY one\n"
    "- Category-level matches: 'SQL database' or 'relational database' matches if resume has PostgreSQL, MySQL, or similar\n"
    "- Framework/library to language: 'React' or 'Node.js' implies 'JavaScript' — match in both directions\n"
    "- Cloud provider services: 'AWS S3' or 'AWS Lambda' covers 'AWS' and vice versa\n"
    "- Version agnostic: 'Python 3' matches 'Python', 'React 18' matches 'React'\n"
    "- Superset/subset: 'TypeScript' covers 'JavaScript', 'scikit-learn' implies 'Python'\n\n"
    "MATCHING RULES FOR QUALIFICATIONS:\n"
    "- Must-haves and nice-to-haves are qualifications, not just skill keywords — look for evidence in project descriptions and experience bullets, not just the skills list\n"
    "- 'ML model deployment experience' is matched if any project or experience bullet mentions deploying, serving, or productionising a model\n"
    "- 'RAG frameworks' is matched if any project description mentions building or working with RAG pipelines\n"
    "- 'Production system experience' is matched if any bullet mentions production, monitoring, uptime, or scaling\n"
    "- Match the intent of the qualification, not just the keywords\n\n"
    "NEVER match on:\n"
    "- Completely unrelated technologies (e.g. 'Java' does not match 'JavaScript')\n"
    "- Soft skills or general terms with no technical overlap\n"
    "- Qualifications with no supporting evidence anywhere in the resume\n\n"
    "Return only the JD items that are genuinely covered. Be liberal with semantic matches but strict about requiring actual evidence."
)


def get_skill_match_messages(
    resume_skills: set[str],
    unresolved_must: set[str],
    unresolved_nice: set[str],
    unresolved_technical: set[str],
    project_context: str,
    experience_context: str,
) -> list:

    resume_context = (
        f"RESUME SKILLS:\n{', '.join(sorted(resume_skills))}\n\n"
        f"PROJECT DESCRIPTIONS:\n{project_context}\n\n"
        f"EXPERIENCE BULLETS:\n{experience_context}"
    )

    unresolved_context = (
        f"UNRESOLVED MUST-HAVE QUALIFICATIONS:\n"
        f"{chr(10).join(f'- {item}' for item in sorted(unresolved_must)) or 'None'}\n\n"
        f"UNRESOLVED NICE-TO-HAVE QUALIFICATIONS:\n"
        f"{chr(10).join(f'- {item}' for item in sorted(unresolved_nice)) or 'None'}\n\n"
        f"UNRESOLVED TECHNICAL SKILLS:\n"
        f"{chr(10).join(f'- {item}' for item in sorted(unresolved_technical)) or 'None'}\n\n"
        "For each list, return only the items genuinely covered by the resume. "
        "For qualifications, look for evidence in project descriptions and experience bullets."
    )

    return [
        {
            "role": "system",
            "content": SKILL_MATCH_SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": resume_context,
        },
        {
            "role": "assistant",
            "content": "Understood. Please provide the unresolved JD items to match against.",
        },
        {
            "role": "user",
            "content": unresolved_context,
        },
    ]


PROJECT_SELECTION_SYSTEM_PROMPT = (
    "You are a resume tailoring assistant selecting the most relevant projects for a job description.\n\n"
    "SELECTION RULES:\n"
    "- Select a MAXIMUM of 3 projects — never more than 3 under any circumstance\n"
    "- If there are 3 or fewer projects, select ALL of them — no project should be left out\n"
    "- If there are more than 3 projects, select the 3 most relevant\n"
    "- Order selections by relevance — most relevant first\n"
    "- Each project index must appear EXACTLY ONCE across selected_projects and not_selected_projects\n"
    "- No duplicate indexes — every project appears in exactly one list\n"
    "- Every project must appear in either selected_projects or not_selected_projects — none omitted\n\n"
    "RELEVANCE CRITERIA (in order of importance):\n"
    "1. Directly matches must-have qualifications or required technical skills\n"
    "2. Demonstrates experience with similar technologies, tools, or frameworks\n"
    "3. Involves similar responsibilities or types of work\n"
    "4. Shows transferable domain or technical experience\n\n"
    "USE THE DETAILED DESCRIPTION:\n"
    "- Each project includes a detailed description beyond what appears on the resume\n"
    "- Use this to understand the full scope of the project, not just its title and bullets\n"
    "- A project may be highly relevant even if its title doesn't match the JD\n\n"
    "REASONING RULES:\n"
    "- For selected projects: one sentence referencing the specific JD requirement or skill it satisfies\n"
    "- For not selected projects: one sentence explaining what it lacks relative to the JD\n"
    "- Be specific in both cases — 'Limited overlap with required LLM and production ML skills' not 'Not relevant'\n\n"
    "Return valid JSON only. No explanations outside the JSON."
)


def get_project_selection_messages(state) -> list:
    projects_formatted = "\n\n".join(
        f"Project {i}:\n"
        f"  Title: {p.title}\n"
        f"  Technologies: {', '.join(p.technologies)}\n"
        f"  Description: {p.description}"
        for i, p in enumerate(state.resume_json.projects)
    )

    resume_context = f"PROJECTS:\n{projects_formatted}"

    jd_context = (
        f"JD MUST-HAVE QUALIFICATIONS:\n{', '.join(state.jd_json.must_have_qualifications)}\n\n"
        f"JD TECHNICAL SKILLS:\n{', '.join(state.jd_json.technical_skills)}\n\n"
        f"JD KEYWORDS:\n{', '.join(state.jd_json.keywords)}\n\n"
        "Select the most relevant projects for this JD following the rules above."
    )

    return [
        {"role": "system", "content": PROJECT_SELECTION_SYSTEM_PROMPT},
        {"role": "user", "content": resume_context},
        {
            "role": "assistant",
            "content": "Understood. Please provide the job description requirements.",
        },
        {"role": "user", "content": jd_context},
    ]


SKILL_SELECTION_SYSTEM_PROMPT = (
    "You are a resume tailoring assistant. Select and reorder the candidate's existing skills to best align with a job description.\n\n"
    "SELECTION RULES:\n"
    "- Only select skills the candidate actually has — never invent or add new ones\n"
    "- Prioritize skills that directly match JD technical skills or keywords\n"
    "- Include adjacent skills in the same domain even if not explicitly in the JD "
    "(e.g. if JD mentions PyTorch, include HuggingFace if the candidate has it)\n"
    "- Include broadly useful skills even if not in the JD: SQL, Git, LaTeX, Linux, Docker — "
    "these are safe additions for most technical roles\n"
    "- Drop skills completely unrelated to the role domain\n"
    "(e.g. drop mobile development skills for a backend ML role)\n\n"
    "ORDERING RULES:\n"
    "- Within each category, put JD-matched skills first\n"
    "- Keep the category names and structure from the candidate's original resume\n"
    "- Keep category order the same as the original\n\n"
    "SIZE RULES:\n"
    "- Aim for 5-10 skills per category — enough to show depth without padding\n"
    "- If a category has fewer than 3 relevant skills after filtering, drop the category entirely\n\n"
    "Return only skills the candidate has. Do not invent or infer skills not in the candidate's list."
)


def get_skill_selection_messages(state) -> list:
    jd = state.jd_json
    match = state.skill_match_results

    resume_skills_context = "CANDIDATE FULL SKILL LIST:\n" + "\n".join(
        f"{cat.category}: {', '.join(cat.skills)}" for cat in state.resume_json.skills
    )

    jd_context = (
        f"JD TECHNICAL SKILLS:\n{', '.join(jd.technical_skills)}\n\n"
        f"JD KEYWORDS:\n{', '.join(jd.keywords)}\n\n"
        f"JD MUST-HAVE QUALIFICATIONS:\n{', '.join(jd.must_have_qualifications)}\n\n"
        f"CANDIDATE MATCHED SKILLS:\n{', '.join(match.matched_must_have | match.matched_technical)}\n\n"
        "Select and reorder the candidate's skills to best align with this JD."
    )

    return [
        {"role": "system", "content": SKILL_SELECTION_SYSTEM_PROMPT},
        {"role": "user", "content": resume_skills_context},
        {
            "role": "assistant",
            "content": "Understood. Please provide the job description requirements.",
        },
        {"role": "user", "content": jd_context},
    ]


SUMMARY_GENERATION_SYSTEM_PROMPT = (
    "You are a resume writer. Write a concise, tailored professional summary.\n\n"
    "RULES:\n"
    "- 2-3 sentences maximum, under 60 words total\n"
    "- Sentence 1: Who you are + years of experience + domain\n"
    "- Sentence 2: What you bring that's specific to this role — "
    "reference 1-2 concrete things from the projects or experience\n"
    "- Sentence 3 (optional): A forward-looking statement about what you want to contribute\n\n"
    "TONE:\n"
    "- Third person implied — do not start with 'I'\n"
    "- Confident and specific — never generic\n"
    "- No buzzwords: 'passionate', 'dynamic', 'results-driven', 'team player'\n\n"
    "GOOD EXAMPLE:\n"
    "AI engineer with 3 years building production LLM systems and agentic workflows. "
    "Designed a multi-node LangGraph pipeline with human-in-the-loop checkpoints that reduced "
    "resume tailoring from hours to minutes. Seeking to bring applied GenAI engineering depth "
    "to a team pushing the boundaries of intelligent document processing.\n\n"
    "BAD EXAMPLE:\n"
    "'Passionate and results-driven AI professional with strong communication skills "
    "seeking an exciting opportunity to leverage my expertise in a dynamic environment.'\n\n"
    "Return only the summary text. No labels, no quotes, no explanation."
)


def get_summary_generation_messages(state) -> list:
    if state.summary_messages:
        return state.summary_messages

    approved_projects = "\n".join(
        f"- {p.title}: {p.bullets[0].text if p.bullets else ''}"
        for p in state.rewritten_projects
    )

    approved_experience = "\n".join(
        f"- {e.role} at {e.company}: {e.bullets[0].text if e.bullets else ''}"
        for e in state.rewritten_experience
    )

    user_content = (
        f"ROLE BEING APPLIED FOR: {state.role_title} at {state.company_name}\n\n"
        f"SENIORITY LEVEL: {state.jd_json.seniority_level}\n\n"
        f"JD MUST-HAVE QUALIFICATIONS:\n"
        f"{chr(10).join(f'- {q}' for q in state.jd_json.must_have_qualifications)}\n\n"
        f"JD KEYWORDS:\n{', '.join(state.jd_json.keywords)}\n\n"
        f"CANDIDATE EXPERIENCE:\n{approved_experience}\n\n"
        f"CANDIDATE PROJECTS:\n{approved_projects}\n\n"
        f"SELECTED SKILLS:\n"
        f"{', '.join(s for cat in state.selected_skills for s in cat.skills)}\n\n"
        "Write a tailored resume summary for this specific role."
    )

    return [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": SUMMARY_GENERATION_SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
        },
        {"role": "user", "content": user_content},
    ]


COVER_LETTER_SYSTEM_PROMPT = (
    "You are an expert cover letter writer. You have access to a web search tool.\n\n"
    "RESEARCH STEP — before writing, search for:\n"
    "1. The company's mission, values, and culture\n"
    "2. Recent news, product launches, or engineering work from the past 12 months\n"
    "3. What the specific team or department works on if available\n"
    "Use 3-5 targeted searches. Prioritise official sources and engineering blogs.\n\n"
    "STRUCTURE — exactly 3 paragraphs, under 280 words total:\n"
    "- Paragraph 1: Why THIS company specifically — reference something concrete and recent "
    "from your research. Show you know what they are actually working on, not just their tagline.\n"
    "- Paragraph 2: Why YOU are the right fit — connect 2 specific achievements from the "
    "resume directly to the role's must-have requirements. Be concrete, not generic.\n"
    "- Paragraph 3: Forward-looking — what you would bring, genuine enthusiasm to contribute "
    "to something specific you found in your research.\n\n"
    "TONE:\n"
    "- Confident but not arrogant\n"
    "- Human and direct — not corporate\n"
    "- Do not start with 'I'\n"
    "- Never use: 'I am passionate about', 'I am a team player', 'fast learner', "
    "'results-driven', 'dynamic', 'synergy'\n\n"
    "NEVER:\n"
    "- Summarise the resume — the resume does that\n"
    "- Make up facts about the company not found in your research\n"
    "- Use phrases that could apply to any company or any role\n"
    "- Mention salary, benefits, or relocation\n\n"
    "Return only the cover letter body text. No subject line, no greeting, "
    "no sign-off, no explanation outside the letter itself."
)


def cover_letter_user_prompt(state) -> str:
    projects_summary = "\n".join(
        f"- {p.title}: {p.bullets[0].text if p.bullets else ''}"
        for p in state.rewritten_projects[:3]
    )

    experience_summary = "\n".join(
        f"- {e.role} at {e.company}: {e.bullets[0].text if e.bullets else ''}"
        for e in state.rewritten_experience[:2]
    )

    top_skills = ", ".join(
        skill for cat in state.selected_skills for skill in cat.skills
    )[:200]

    return (
        f"COMPANY: {state.company_name}\n"
        f"ROLE: {state.role_title}\n\n"
        f"JD MUST-HAVES (top 5):\n"
        f"{chr(10).join(f'- {q}' for q in state.jd_json.must_have_qualifications[:5])}\n\n"
        f"JD KEYWORDS: {', '.join(state.jd_json.keywords[:10])}\n\n"
        f"CANDIDATE: {state.resume_json.name}\n"
        f"SUMMARY: {state.generated_summary or 'N/A'}\n\n"
        f"KEY PROJECTS:\n{projects_summary}\n\n"
        f"EXPERIENCE:\n{experience_summary}\n\n"
        f"SKILLS: {top_skills}\n\n"
        "Search for recent information about this company then write the cover letter."
    )
