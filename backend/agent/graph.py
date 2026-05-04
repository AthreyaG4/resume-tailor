from agent.nodes import (
    project_join_node,
    jd_parsing_node,
    skill_match_node,
    project_selection_node,
    project_selection_review_node,
    skill_selection_node,
    skill_selection_review_node,
    continue_to_project_rewrite_node,
    execute_project_rewrite_node,
    continue_to_experience_rewrite_node,
    execute_experience_rewrite_node,
    certification_selection_review_node,
    should_include_cert_pub_review,
    summary_generation_node,
    summary_generation_review_node,
    should_regenerate_summary,
    section_order_node,
    cover_letter_review_node,
    should_generate_cover_letter,
    cover_letter_node,
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
tailor_graph.add_node("certification_selection_review_node", certification_selection_review_node)
tailor_graph.add_node("summary_generation_node", summary_generation_node)
tailor_graph.add_node("summary_generation_review_node", summary_generation_review_node)
tailor_graph.add_node("section_order_node", section_order_node)
tailor_graph.add_node("cover_letter_review_node", cover_letter_review_node)
tailor_graph.add_node("cover_letter_node", cover_letter_node)
tailor_graph.add_node("assemble_resume_node", assemble_resume_node)

tailor_graph.add_edge(START, "jd_parsing_node")
tailor_graph.add_edge("jd_parsing_node", "skill_match_node")
tailor_graph.add_edge("skill_match_node", "project_selection_node")
tailor_graph.add_edge("project_selection_node", "project_selection_review_node")
tailor_graph.add_edge("project_selection_review_node", "skill_selection_node")
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
tailor_graph.add_conditional_edges(
    "execute_experience_rewrite_node",
    should_include_cert_pub_review,
    ["certification_selection_review_node", "summary_generation_node"],
)
tailor_graph.add_edge("certification_selection_review_node", "summary_generation_node")
tailor_graph.add_edge("summary_generation_node", "summary_generation_review_node")
tailor_graph.add_conditional_edges(
    "summary_generation_review_node",
    should_regenerate_summary,
    ["summary_generation_node", "section_order_node"],
)
tailor_graph.add_edge("section_order_node", "cover_letter_review_node")
tailor_graph.add_conditional_edges(
    "cover_letter_review_node",
    should_generate_cover_letter,
    ["cover_letter_node", "assemble_resume_node"],
)
tailor_graph.add_edge("cover_letter_node", "assemble_resume_node")
tailor_graph.add_edge("assemble_resume_node", END)

tailor_agent = tailor_graph.compile(checkpointer=checkpointer)
