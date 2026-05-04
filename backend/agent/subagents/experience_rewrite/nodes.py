from agent.subagents.experience_rewrite.prompts import get_experience_rewrite_messages
from agent.subagents.experience_rewrite.state import ExperienceSubgraphState
from langchain_anthropic import ChatAnthropic
from langchain_core.callbacks import UsageMetadataCallbackHandler
from schemas import ExperienceRewriteResponse, HumanReviewResponse, NodeTokenUsage
from agent.utils import extract_tokens
from langgraph.types import interrupt
from typing import Literal
from langgraph.graph import END

sonnet_model = ChatAnthropic(
    model="claude-sonnet-4-6",
    model_kwargs={"extra_headers": {"anthropic-beta": "prompt-caching-2024-07-31"}},
)
experience_rewrite_model = sonnet_model.with_structured_output(
    ExperienceRewriteResponse
)


def experience_rewrite_node(state: ExperienceSubgraphState):
    messages = get_experience_rewrite_messages(state)
    callback = UsageMetadataCallbackHandler()

    response = experience_rewrite_model.invoke(
        messages, config={"callbacks": [callback]}
    )
    inp, out, cached, model = extract_tokens(callback)
    entry = response.rewritten_experience

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
        "token_usage_log": [
            NodeTokenUsage(
                node="experience_rewrite_node",
                model=model,
                input_tokens=inp,
                output_tokens=out,
                cached_tokens=cached,
            )
        ],
    }


def experience_rewrite_review_node(state: ExperienceSubgraphState):
    human_response = interrupt(
        {
            "rewritten_experience": state.rewritten_experience,
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
    state: ExperienceSubgraphState,
) -> Literal["experience_rewrite_node", "__end__"]:
    last = (
        state.experience_rewrite_messages[-1]
        if state.experience_rewrite_messages
        else None
    )
    if last and last.get("role") == "user":
        return "experience_rewrite_node"
    return END
