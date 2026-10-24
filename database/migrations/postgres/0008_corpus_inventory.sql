-- Additive corpus inventory and per-scholar milestones. Existing materials are not changed.

CREATE TABLE IF NOT EXISTS corpus_candidates (
	id VARCHAR NOT NULL,
	source_key VARCHAR(180) NOT NULL,
	scholar_key VARCHAR(30) NOT NULL,
	canonical_url TEXT NOT NULL,
	title_ar TEXT NOT NULL,
	title_origin VARCHAR NOT NULL,
	discovery_url TEXT NOT NULL,
	discovery_method VARCHAR NOT NULL,
	topic_hint VARCHAR NOT NULL,
	topic_basis VARCHAR NOT NULL,
	scope VARCHAR NOT NULL,
	page_status VARCHAR NOT NULL,
	body_status VARCHAR NOT NULL,
	ingestion_status VARCHAR NOT NULL,
	checked_at TIMESTAMP WITH TIME ZONE,
	content_checksum VARCHAR(64) NOT NULL,
	source_reference TEXT NOT NULL,
	text_ar TEXT NOT NULL,
	rights_evidence TEXT NOT NULL,
	error TEXT NOT NULL,
	material_id VARCHAR,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL,
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(material_id) REFERENCES materials (id)
)

;
CREATE INDEX IF NOT EXISTS ix_corpus_candidates_ingestion_status ON corpus_candidates (ingestion_status);
CREATE INDEX IF NOT EXISTS ix_corpus_candidates_scholar_key ON corpus_candidates (scholar_key);
CREATE INDEX IF NOT EXISTS ix_corpus_candidates_scope ON corpus_candidates (scope);
CREATE INDEX IF NOT EXISTS ix_corpus_candidates_material_id ON corpus_candidates (material_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_corpus_candidates_source_key ON corpus_candidates (source_key);
CREATE INDEX IF NOT EXISTS ix_corpus_candidates_page_status ON corpus_candidates (page_status);

CREATE TABLE IF NOT EXISTS corpus_targets (
	scholar_key VARCHAR(30) NOT NULL,
	target INTEGER NOT NULL,
	paused BOOLEAN NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL,
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
	PRIMARY KEY (scholar_key)
)

;

-- Admin inventory is served through FastAPI RBAC, not the browser Data API.
ALTER TABLE corpus_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE corpus_targets ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE corpus_candidates, corpus_targets FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE corpus_candidates, corpus_targets FROM authenticated;
    END IF;
END
$$;
