-- Additive tables; app.migrate also creates these for both PostgreSQL and SQLite.

CREATE TABLE IF NOT EXISTS content_tasks (
	id VARCHAR NOT NULL, 
	dedup_key VARCHAR(64) NOT NULL, 
	kind VARCHAR NOT NULL, 
	url VARCHAR NOT NULL, 
	material_id VARCHAR, 
	registry_id VARCHAR, 
	scholar_id VARCHAR, 
	status VARCHAR NOT NULL, 
	attempts INTEGER NOT NULL, 
	max_attempts INTEGER NOT NULL, 
	available_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	error TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (dedup_key), 
	FOREIGN KEY(material_id) REFERENCES materials (id), 
	FOREIGN KEY(registry_id) REFERENCES source_registry (id), 
	FOREIGN KEY(scholar_id) REFERENCES scholars (id)
)

;
CREATE INDEX IF NOT EXISTS ix_content_tasks_available_at ON content_tasks (available_at);
CREATE INDEX IF NOT EXISTS ix_content_tasks_status ON content_tasks (status);

CREATE TABLE IF NOT EXISTS quality_reviews (
	id VARCHAR NOT NULL, 
	material_id VARCHAR NOT NULL, 
	content_hash VARCHAR(64) NOT NULL, 
	rule VARCHAR NOT NULL, 
	segment_ref VARCHAR NOT NULL, 
	reviewer_id VARCHAR NOT NULL, 
	notes TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id), 
	FOREIGN KEY(reviewer_id) REFERENCES users (id)
)

;
CREATE INDEX IF NOT EXISTS ix_quality_reviews_material_id ON quality_reviews (material_id);
