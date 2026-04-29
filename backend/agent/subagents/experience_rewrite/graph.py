from agent.subagents.experience_rewrite.nodes import (
    experience_rewrite_node,
    experience_rewrite_review_node,
    should_rewrite_experience,
)
from agent.subagents.experience_rewrite.state import ExperienceSubgraphState
from langgraph.graph import END, StateGraph

builder = StateGraph(ExperienceSubgraphState)

builder.add_node("experience_rewrite_node", experience_rewrite_node)
builder.add_node("experience_rewrite_review_node", experience_rewrite_review_node)

builder.set_entry_point("experience_rewrite_node")
builder.add_edge("experience_rewrite_node", "experience_rewrite_review_node")
builder.add_conditional_edges(
    "experience_rewrite_review_node",
    should_rewrite_experience,
    ["experience_rewrite_node", END],
)

graph = builder.compile()
