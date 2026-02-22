from agent.ingestion.state import IngestionState
from langchain.chat_models import init_chat_model
from schemas import ResumeSchema
from langgraph.types import interrupt
from agent.ingestion.prompts import INGESTION_SYSTEM_PROMPT

ingestion_model = init_chat_model("gpt-5-nano").with_structured_output(ResumeSchema)


def ingestion_node(state: IngestionState) -> IngestionState:
    messages = [
        {
            "role": "system",
            "content": INGESTION_SYSTEM_PROMPT,
        },
        {"role": "user", "content": f"Resume:\n{state.raw_text}"},
    ]

    response = ingestion_model.invoke(messages)
    return {"resume_json": response}


def human_review_node(state: IngestionState) -> IngestionState:
    human_edits = interrupt(
        {
            "resume_json": state.resume_json.model_dump(),
            "message": "Please review and edit your extracted resume data.",
        }
    )

    return {"resume_json": ResumeSchema(**human_edits)}
