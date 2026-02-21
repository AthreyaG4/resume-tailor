from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver
from agent.ingestion.nodes import ingestion_node, human_review_node
from agent.ingestion.state import IngestionState
from IPython.display import Image, display

checkpointer = InMemorySaver()

ingestion_graph = StateGraph(IngestionState)
ingestion_graph.add_node("ingestion_node", ingestion_node)
ingestion_graph.add_node("human_review_node", human_review_node)
ingestion_graph.add_edge(START, "ingestion_node")
ingestion_graph.add_edge("ingestion_node", "human_review_node")
ingestion_graph.add_edge("human_review_node", END)

ingestion_agent = ingestion_graph.compile(checkpointer=checkpointer)

display(Image(ingestion_agent.get_graph(xray=True).draw_mermaid_png()))
