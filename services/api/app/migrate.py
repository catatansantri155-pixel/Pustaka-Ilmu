"""Idempotent additive schema upgrade for both existing SQL-dump DBs and fresh DBs.

Run explicitly before starting production API/workers. Never drops data.
"""
from sqlalchemy import inspect, text
from .db import Base, engine
from . import models  # noqa: F401


def upgrade():
    with engine.begin() as conn:
        # Prevent two replicas applying the same additive DDL concurrently.
        if conn.dialect.name == "postgresql":
            conn.execute(text("SELECT pg_advisory_xact_lock(72411301)"))
        Base.metadata.create_all(conn)
        if conn.dialect.name == "postgresql":
            # New corpus inventory is private. Backend table owner retains access;
            # custom FastAPI JWT roles are not Supabase auth.uid() identities.
            conn.execute(text("ALTER TABLE corpus_candidates ENABLE ROW LEVEL SECURITY"))
            conn.execute(text("ALTER TABLE corpus_targets ENABLE ROW LEVEL SECURITY"))
            conn.execute(text("""DO $$ BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                    REVOKE ALL ON TABLE corpus_candidates, corpus_targets FROM anon;
                END IF;
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                    REVOKE ALL ON TABLE corpus_candidates, corpus_targets FROM authenticated;
                END IF;
            END $$"""))
        columns = {c["name"] for c in inspect(conn).get_columns("publication_approvals")}
        if "content_hash" not in columns:
            conn.execute(text("ALTER TABLE publication_approvals ADD COLUMN content_hash VARCHAR(64) NOT NULL DEFAULT ''"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_materials_catalog ON materials (status, created_at, id)"))
    return True


if __name__ == "__main__":
    upgrade()
    print("Migrasi aditif selesai; persetujuan lama memerlukan persetujuan ulang sebelum publikasi berikutnya.")
