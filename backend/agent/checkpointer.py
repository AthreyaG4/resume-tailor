from psycopg_pool import ConnectionPool
from langgraph.checkpoint.postgres import PostgresSaver
from db import DATABASE_URL

connection_kwargs = {
    "autocommit": True,
    "prepare_threshold": 0,
}

pool = ConnectionPool(
    conninfo=DATABASE_URL,
    max_size=20,
    kwargs=connection_kwargs,
    open=False,
)

checkpointer = PostgresSaver(pool)
