from agent.nodes import (
    project_join_node,
    jd_parsing_node,
    skill_match_node,
    project_selection_node,
    project_selection_review_node,
    should_reselect_projects,
    skill_selection_node,
    skill_selection_review_node,
    continue_to_project_rewrite_node,
    execute_project_rewrite_node,
    continue_to_experience_rewrite_node,
    execute_experience_rewrite_node,
    assemble_resume_node,
)
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver
from agent.state import TailorState

tailor_graph = StateGraph(TailorState)
checkpointer = InMemorySaver()

tailor_graph.add_node("jd_parsing_node", jd_parsing_node)
tailor_graph.add_node("skill_match_node", skill_match_node)
tailor_graph.add_node("project_selection_node", project_selection_node)
tailor_graph.add_node("project_selection_review_node", project_selection_review_node)
tailor_graph.add_node("skill_selection_node", skill_selection_node)
tailor_graph.add_node("skill_selection_review_node", skill_selection_review_node)
tailor_graph.add_node("execute_project_rewrite_node", execute_project_rewrite_node)
tailor_graph.add_node("project_join_node", project_join_node)
tailor_graph.add_node(
    "execute_experience_rewrite_node", execute_experience_rewrite_node
)
tailor_graph.add_node("assemble_resume_node", assemble_resume_node)

tailor_graph.add_edge(START, "jd_parsing_node")
tailor_graph.add_edge("jd_parsing_node", "skill_match_node")
tailor_graph.add_edge("skill_match_node", "project_selection_node")
tailor_graph.add_edge("project_selection_node", "project_selection_review_node")
tailor_graph.add_conditional_edges(
    "project_selection_review_node",
    should_reselect_projects,
    ["project_selection_node", "skill_selection_node"],
)
tailor_graph.add_edge("skill_selection_node", "skill_selection_review_node")
tailor_graph.add_conditional_edges(
    "skill_selection_review_node",
    continue_to_project_rewrite_node,
    ["execute_project_rewrite_node"],
)
tailor_graph.add_edge("execute_project_rewrite_node", "project_join_node")
tailor_graph.add_conditional_edges(
    "project_join_node",
    continue_to_experience_rewrite_node,
    ["execute_experience_rewrite_node"],
)
tailor_graph.add_edge("execute_experience_rewrite_node", "assemble_resume_node")
tailor_graph.add_edge("assemble_resume_node", END)

tailor_agent = tailor_graph.compile(checkpointer=checkpointer)
