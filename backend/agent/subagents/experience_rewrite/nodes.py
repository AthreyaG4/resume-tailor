from agent.subagents.experience_rewrite.prompts import (
    EXPERIENCE_REWRITE_SYSTEM_PROMPT,
    experience_rewrite_user_prompt,
)
from agent.subagents.experience_rewrite.state import ExperienceSubgraphState
from langchain.chat_models import init_chat_model
from schemas import ExperienceRewriteResponse, HumanReviewResponse
from langgraph.types import interrupt
from typing import Literal
from langgraph.graph import END

model = init_chat_model("gpt-5-nano")
experience_rewrite_model = model.with_structured_output(ExperienceRewriteResponse)


def experience_rewrite_node(state: ExperienceSubgraphState):
    company = state.experience.get("company", "?") if isinstance(state.experience, dict) else "?"
    role = state.experience.get("role", "?") if isinstance(state.experience, dict) else "?"
    iteration = len([m for m in state.experience_rewrite_messages if m.get("role") == "user"]) + 1

    print("\n--- experience_rewrite_node ---")
    print(f"    experience : '{role} @ {company}'")
    print(f"    iteration  : {iteration}")
    print(f"    messages   : {len(state.experience_rewrite_messages)} in history")

    messages = state.experience_rewrite_messages or [
        {"role": "system", "content": EXPERIENCE_REWRITE_SYSTEM_PROMPT},
        {"role": "user", "content": experience_rewrite_user_prompt(state)},
    ]

    response = experience_rewrite_model.invoke(messages)
    entry = response.rewritten_experience

    print(f"    produced   : {len(entry.bullets)} bullets")
    for b in entry.bullets:
        print(f"      * {b[:80]}{'...' if len(b) > 80 else ''}")

    if not state.experience_rewrite_messages:
        messages_to_store = messages + [
            {"role": "assistant", "content": response.model_dump_json()}
        ]
    else:
        messages_to_store = [
            {"role": "assistant", "content": response.model_dump_json()}
        ]

    return {
        "rewritten_experience": entry,
        "experience_rewrite_messages": messages_to_store,
    }


def experience_rewrite_review_node(state: ExperienceSubgraphState):
    entry = state.rewritten_experience
    role = entry.role if entry else "?"
    company = entry.company if entry else "?"

    print("\n--- experience_rewrite_review_node ---")
    print(f"    experience : '{role} @ {company}'")
    print("    waiting for human review...")

    human_response = interrupt(
        {
            "rewritten_experience": state.rewritten_experience,
            "message": "Review the rewritten experience. Approve or provide feedback.",
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
            "experience_rewrite_messages": [
                {
                    "role": "user",
                    "content": f"Human feedback: {response.feedback}. Please revise.",
                }
            ]
        }


def should_rewrite_experience(
    state: ExperienceSubgraphState,
) -> Literal["experience_rewrite_node", "__end__"]:
    last = state.experience_rewrite_messages[-1] if state.experience_rewrite_messages else None
    if last and last.get("role") == "user":
        print("\n-> routing back to experience_rewrite_node")
        return "experience_rewrite_node"

    print("\n-> routing to END")
    return END
