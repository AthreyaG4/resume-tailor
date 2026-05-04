from agent.subagents.project_rewrite.prompts import get_project_rewrite_messages
from agent.subagents.project_rewrite.state import ProjectSubgraphState
from langchain_anthropic import ChatAnthropic
from langchain_core.callbacks import UsageMetadataCallbackHandler
from schemas import ProjectRewriteResponse, HumanReviewResponse, NodeTokenUsage
from agent.utils import extract_tokens
from langgraph.types import interrupt
from typing import Literal
from langgraph.graph import END

sonnet_model = ChatAnthropic(
    model="claude-sonnet-4-6",
    model_kwargs={"extra_headers": {"anthropic-beta": "prompt-caching-2024-07-31"}},
)
project_rewrite_model = sonnet_model.with_structured_output(ProjectRewriteResponse)


def project_rewrite_node(state: ProjectSubgraphState):
    messages = get_project_rewrite_messages(state)
    callback = UsageMetadataCallbackHandler()

    response = project_rewrite_model.invoke(messages, config={"callbacks": [callback]})
    inp, out, cached, model = extract_tokens(callback)

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
        "token_usage_log": [
            NodeTokenUsage(
                node="project_rewrite_node",
                model=model,
                input_tokens=inp,
                output_tokens=out,
                cached_tokens=cached,
            )
        ],
    }


def project_rewrite_review_node(state: ProjectSubgraphState):
    human_response = interrupt(
        {
            "rewritten_project": state.rewritten_project,
            "message": "Review the rewritten project. Approve or provide feedback.",
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
    last = (
        state.project_rewrite_messages[-1] if state.project_rewrite_messages else None
    )
    if last and last.get("role") == "user":
        return "project_rewrite_node"
    return END
