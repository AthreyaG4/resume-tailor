from agent.subagents.project_rewrite.nodes import (
    project_rewrite_node,
    project_rewrite_review_node,
    should_rewrite_project,
)
from agent.subagents.project_rewrite.state import ProjectSubgraphState
from langgraph.graph import END, StateGraph

builder = StateGraph(ProjectSubgraphState)

builder.add_node("project_rewrite_node", project_rewrite_node)
builder.add_node("project_rewrite_review_node", project_rewrite_review_node)

builder.set_entry_point("project_rewrite_node")
builder.add_edge("project_rewrite_node", "project_rewrite_review_node")
builder.add_conditional_edges(
    "project_rewrite_review_node",
    should_rewrite_project,
    ["project_rewrite_node", END],
)

graph = builder.compile()
