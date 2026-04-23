from agent.subagents.project_rewrite.prompts import (
    PROJECT_REWRITE_SYSTEM_PROMPT,
    project_rewrite_user_prompt,
)
from agent.subagents.project_rewrite.state import ProjectSubgraphState
from langchain.chat_models import init_chat_model
from schemas import ProjectRewriteResponse, HumanReviewResponse
from langgraph.types import interrupt
from typing import Literal
from langgraph.graph import END

model = init_chat_model("gpt-5-nano")
project_rewrite_model = model.with_structured_output(ProjectRewriteResponse)


def project_rewrite_node(state: ProjectSubgraphState):
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
        "rewritten_project": response.rewritten_projects,
        "project_rewrite_messages": messages_to_store,
    }


def project_rewrite_review_node(state: ProjectSubgraphState):
    human_response = interrupt(
        {
            "rewritten_projects": [p.model_dump() for p in state.rewritten_project],
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


def should_rewrite_project(
    state: ProjectSubgraphState,
) -> Literal["project_rewrite_node", "__end__"]:
    if (
        state.project_rewrite_messages
        and state.project_rewrite_messages[-1]["role"] == "user"
    ):
        return "project_rewrite_node"

    return END
