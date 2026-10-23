# Alembic env: reads the same SQLAlchemy models as the API (target PostgreSQL).
# DATABASE_URL env overrides sqlalchemy.url.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "services", "api"))
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.db import Base
from app import models  # noqa
config = context.config
if os.environ.get("DATABASE_URL"):
    config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])
target_metadata = Base.metadata
def run_migrations_offline():
    context.configure(url=config.get_main_option("sqlalchemy.url"), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction(): context.run_migrations()
def run_migrations_online():
    c = engine_from_config(config.get_section(config.config_ini_section), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with c.connect() as conn:
        context.configure(connection=conn, target_metadata=target_metadata)
        with context.begin_transaction(): context.run_migrations()
if context.is_offline_mode(): run_migrations_offline()
else: run_migrations_online()
