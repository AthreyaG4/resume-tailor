from agent.tailor.nodes import (
    jd_parsing_node,
    skill_match_node,
    project_selection_node,
    project_selection_review_node,
    skill_selection_node,
    skill_selection_review_node,
    project_rewrite_node,
    project_rewrite_review_node,
    experience_rewrite_node,
    experience_rewrite_review_node,
    assemble_resume_node,
    should_reselect_projects,
    should_reselect_skills,
    should_rewrite_projects,
    should_rewrite_experience,
)
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver
from agent.tailor.state import TailorState
from IPython.display import Image, display

tailor_graph = StateGraph(TailorState)
checkpointer = InMemorySaver()

tailor_graph.add_node("jd_parsing_node", jd_parsing_node)
tailor_graph.add_node("skill_match_node", skill_match_node)
tailor_graph.add_node("project_selection_node", project_selection_node)
tailor_graph.add_node("project_selection_review_node", project_selection_review_node)
tailor_graph.add_node("skill_selection_node", skill_selection_node)
tailor_graph.add_node("skill_selection_review_node", skill_selection_review_node)
tailor_graph.add_node("project_rewrite_node", project_rewrite_node)
tailor_graph.add_node("project_rewrite_review_node", project_rewrite_review_node)
tailor_graph.add_node("experience_rewrite_node", experience_rewrite_node)
tailor_graph.add_node("experience_rewrite_review_node", experience_rewrite_review_node)
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
    should_reselect_skills,
    ["skill_selection_node", "project_rewrite_node"],
)
tailor_graph.add_edge("project_rewrite_node", "project_rewrite_review_node")
tailor_graph.add_conditional_edges(
    "project_rewrite_review_node",
    should_rewrite_projects,
    ["project_rewrite_node", "experience_rewrite_node"],
)
tailor_graph.add_edge("experience_rewrite_node", "experience_rewrite_review_node")
tailor_graph.add_conditional_edges(
    "experience_rewrite_review_node",
    should_rewrite_experience,
    ["experience_rewrite_node", "assemble_resume_node"],
)
tailor_graph.add_edge("assemble_resume_node", END)

tailor_agent = tailor_graph.compile(checkpointer=checkpointer)
display(Image(tailor_agent.get_graph(xray=True).draw_mermaid_png()))
