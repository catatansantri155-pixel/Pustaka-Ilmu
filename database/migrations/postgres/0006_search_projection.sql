CREATE TABLE IF NOT EXISTS material_search (
    material_id VARCHAR PRIMARY KEY REFERENCES materials(id),
    normalized_text TEXT NOT NULL DEFAULT ''
);
-- Optional acceleration: requires permission to install pg_trgm.
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS ix_material_search_trgm ON material_search USING gin (normalized_text gin_trgm_ops);
-- Always run scripts/reindex.py after deploying this migration.
