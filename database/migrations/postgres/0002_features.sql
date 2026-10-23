-- Pustaka Ilmu — 0002 features (setara Alembic 0002)
-- Berlaku untuk PostgreSQL maupun SQLite (sintaks standar).

ALTER TABLE ai_runs ADD COLUMN tokens_input INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ai_runs ADD COLUMN tokens_output INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE translation_segments ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE glossary_terms (
    id VARCHAR NOT NULL,
    term_ar VARCHAR NOT NULL DEFAULT '',
    term_id VARCHAR NOT NULL DEFAULT '',
    context TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id)
);
