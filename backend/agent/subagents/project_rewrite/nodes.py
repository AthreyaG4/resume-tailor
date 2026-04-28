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
    project_title = state.project.get("title", "?") if isinstance(state.project, dict) else "?"
    iteration = len([m for m in state.project_rewrite_messages if m.get("role") == "user"]) + 1

    print("\n--- project_rewrite_node ---")
    print(f"    project   : '{project_title}'")
    print(f"    iteration : {iteration}")
    print(f"    messages  : {len(state.project_rewrite_messages)} in history")

    messages = state.project_rewrite_messages or [
        {"role": "system", "content": PROJECT_REWRITE_SYSTEM_PROMPT},
        {"role": "user", "content": project_rewrite_user_prompt(state)},
    ]

    response = project_rewrite_model.invoke(messages)

    print(f"    produced  : {len(response.rewritten_project.bullets)} bullets")
    for b in response.rewritten_project.bullets:
        print(f"      • {b[:80]}{'...' if len(b) > 80 else ''}")

    if not state.project_rewrite_messages:
        messages_to_store = messages + [
            {"role": "assistant", "content": response.model_dump_json()}
        ]
    else:
        messages_to_store = [
            {"role": "assistant", "content": response.model_dump_json()}
        ]

    return {
        "rewritten_project": response.rewritten_project,
        "project_rewrite_messages": messages_to_store,
    }


def project_rewrite_review_node(state: ProjectSubgraphState):
    project_title = state.rewritten_project.title if state.rewritten_project else "?"

    print("\n--- project_rewrite_review_node ---")
    print(f"    project   : '{project_title}'")
    print("    waiting for human review...")

    human_response = interrupt(
        {
            "rewritten_project": state.rewritten_project,
            "message": "Review the rewritten project. Approve or provide feedback.",
        }
    )

    print("    interrupt resolved!")
    print(f"    raw response : {human_response}")

    response = HumanReviewResponse(**human_response)

    print(f"    approved  : {response.approved}")
    if not response.approved:
        print(f"    feedback  : '{response.feedback}'")

    if response.approved:
        print("    -> approved, routing to END")
        return {}
    else:
        print("    -> rejected, looping back to rewrite")
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
    last = state.project_rewrite_messages[-1] if state.project_rewrite_messages else None
    if last and last.get("role") == "user":
        print("\n-> routing back to project_rewrite_node")
        return "project_rewrite_node"

    print("\n-> routing to END")
    return END
