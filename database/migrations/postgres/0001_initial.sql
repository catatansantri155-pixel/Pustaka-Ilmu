-- Pustaka Ilmu — skema awal PostgreSQL (dibangkitkan dari model SQLAlchemy yang sama dengan dev SQLite)
-- 
-- Jalankan pada database kosong sebelum Alembic mengambil alih versi berikutnya.

CREATE TABLE hadith_records (
	id VARCHAR NOT NULL, 
	matan_ar TEXT NOT NULL, 
	translation_id_text TEXT NOT NULL, 
	narrator VARCHAR NOT NULL, 
	collection VARCHAR NOT NULL, 
	book VARCHAR NOT NULL, 
	chapter VARCHAR NOT NULL, 
	hadith_number VARCHAR NOT NULL, 
	numbering_scheme VARCHAR NOT NULL, 
	reference_url VARCHAR NOT NULL, 
	match_status VARCHAR NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
)

;

CREATE TABLE quran_verses (
	id VARCHAR NOT NULL, 
	surah_id INTEGER NOT NULL, 
	surah_name_ar VARCHAR NOT NULL, 
	surah_name_id VARCHAR NOT NULL, 
	ayah_number INTEGER NOT NULL, 
	text_ar TEXT NOT NULL, 
	source VARCHAR NOT NULL, 
	edition VARCHAR NOT NULL, 
	validation_status VARCHAR NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
)

;
CREATE INDEX ix_quran_verses_surah_id ON quran_verses (surah_id);

CREATE TABLE roles (
	id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
)

;
CREATE UNIQUE INDEX ix_roles_name ON roles (name);

CREATE TABLE scholars (
	id VARCHAR NOT NULL, 
	name_id VARCHAR NOT NULL, 
	name_ar VARCHAR NOT NULL, 
	birth_year_h VARCHAR, 
	death_year_h VARCHAR, 
	death_year_m VARCHAR, 
	bio_id TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
)

;
CREATE INDEX ix_scholars_name_id ON scholars (name_id);

CREATE TABLE topics (
	id VARCHAR NOT NULL, 
	code VARCHAR NOT NULL, 
	name_id VARCHAR NOT NULL, 
	name_ar VARCHAR NOT NULL, 
	parent_id VARCHAR, 
	description_id TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(parent_id) REFERENCES topics (id)
)

;
CREATE UNIQUE INDEX ix_topics_code ON topics (code);

CREATE TABLE hadith_gradings (
	id VARCHAR NOT NULL, 
	hadith_id VARCHAR NOT NULL, 
	grader VARCHAR NOT NULL, 
	grade VARCHAR NOT NULL, 
	notes TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(hadith_id) REFERENCES hadith_records (id)
)

;
CREATE INDEX ix_hadith_gradings_hadith_id ON hadith_gradings (hadith_id);

CREATE TABLE hadith_narrations (
	id VARCHAR NOT NULL, 
	hadith_id VARCHAR NOT NULL, 
	narrator VARCHAR NOT NULL, 
	chain_text TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(hadith_id) REFERENCES hadith_records (id)
)

;
CREATE INDEX ix_hadith_narrations_hadith_id ON hadith_narrations (hadith_id);

CREATE TABLE issues (
	id VARCHAR NOT NULL, 
	code VARCHAR NOT NULL, 
	title_id VARCHAR NOT NULL, 
	description_id TEXT NOT NULL, 
	topic_id VARCHAR, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(topic_id) REFERENCES topics (id)
)

;
CREATE INDEX ix_issues_topic_id ON issues (topic_id);
CREATE UNIQUE INDEX ix_issues_code ON issues (code);

CREATE TABLE materials (
	id VARCHAR NOT NULL, 
	scholar_id VARCHAR, 
	title_id VARCHAR NOT NULL, 
	title_ar VARCHAR NOT NULL, 
	content_type VARCHAR NOT NULL, 
	status VARCHAR NOT NULL, 
	is_demo BOOLEAN NOT NULL, 
	rights_status VARCHAR NOT NULL, 
	source_url VARCHAR, 
	ai_label TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(scholar_id) REFERENCES scholars (id)
)

;
CREATE INDEX ix_materials_status ON materials (status);
CREATE INDEX ix_materials_scholar_id ON materials (scholar_id);

CREATE TABLE quran_translations (
	id VARCHAR NOT NULL, 
	verse_id VARCHAR NOT NULL, 
	text_id TEXT NOT NULL, 
	translator VARCHAR NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(verse_id) REFERENCES quran_verses (id)
)

;
CREATE INDEX ix_quran_translations_verse_id ON quran_translations (verse_id);

CREATE TABLE source_registry (
	id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	domain VARCHAR NOT NULL, 
	scholar_id VARCHAR, 
	content_type VARCHAR NOT NULL, 
	access_method VARCHAR NOT NULL, 
	permission_status VARCHAR NOT NULL, 
	redistribution_policy VARCHAR NOT NULL, 
	crawl_limits VARCHAR, 
	last_checked TIMESTAMP WITH TIME ZONE, 
	connector_status VARCHAR NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(scholar_id) REFERENCES scholars (id)
)

;
CREATE INDEX ix_source_registry_scholar_id ON source_registry (scholar_id);
CREATE INDEX ix_source_registry_name ON source_registry (name);

CREATE TABLE users (
	id VARCHAR NOT NULL, 
	email VARCHAR NOT NULL, 
	password_hash VARCHAR NOT NULL, 
	full_name VARCHAR NOT NULL, 
	role_id VARCHAR, 
	is_active BOOLEAN NOT NULL, 
	mfa_secret VARCHAR, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(role_id) REFERENCES roles (id)
)

;
CREATE UNIQUE INDEX ix_users_email ON users (email);

CREATE TABLE works (
	id VARCHAR NOT NULL, 
	scholar_id VARCHAR, 
	title_id VARCHAR NOT NULL, 
	title_ar VARCHAR NOT NULL, 
	description TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(scholar_id) REFERENCES scholars (id)
)

;
CREATE INDEX ix_works_scholar_id ON works (scholar_id);

CREATE TABLE acquisition_jobs (
	id VARCHAR NOT NULL, 
	url VARCHAR NOT NULL, 
	status VARCHAR NOT NULL, 
	error TEXT, 
	material_id VARCHAR, 
	registry_id VARCHAR, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id)
)

;

CREATE TABLE ai_runs (
	id VARCHAR NOT NULL, 
	material_id VARCHAR, 
	model VARCHAR NOT NULL, 
	prompt_version VARCHAR NOT NULL, 
	status VARCHAR NOT NULL, 
	error TEXT, 
	cost_estimate FLOAT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id)
)

;
CREATE INDEX ix_ai_runs_material_id ON ai_runs (material_id);

CREATE TABLE arabic_texts (
	id VARCHAR NOT NULL, 
	material_id VARCHAR NOT NULL, 
	full_text TEXT NOT NULL, 
	is_complete BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id)
)

;
CREATE INDEX ix_arabic_texts_material_id ON arabic_texts (material_id);

CREATE TABLE audit_logs (
	id VARCHAR NOT NULL, 
	user_id VARCHAR, 
	action VARCHAR NOT NULL, 
	entity VARCHAR NOT NULL, 
	entity_id VARCHAR, 
	detail TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;

CREATE TABLE bookmarks (
	id VARCHAR NOT NULL, 
	user_id VARCHAR NOT NULL, 
	material_id VARCHAR NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id)
)

;
CREATE INDEX ix_bookmarks_user_id ON bookmarks (user_id);
CREATE INDEX ix_bookmarks_material_id ON bookmarks (material_id);

CREATE TABLE citations (
	id VARCHAR NOT NULL, 
	material_id VARCHAR NOT NULL, 
	text TEXT NOT NULL, 
	evidence TEXT, 
	is_displayed_as_fact BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id)
)

;
CREATE INDEX ix_citations_material_id ON citations (material_id);

CREATE TABLE evidence_mentions (
	id VARCHAR NOT NULL, 
	material_id VARCHAR NOT NULL, 
	mention_text TEXT NOT NULL, 
	evidence_type VARCHAR NOT NULL, 
	is_displayed_as_fact BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id)
)

;
CREATE INDEX ix_evidence_mentions_material_id ON evidence_mentions (material_id);

CREATE TABLE issue_materials (
	id VARCHAR NOT NULL, 
	issue_id VARCHAR NOT NULL, 
	material_id VARCHAR NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id)
)

;
CREATE INDEX ix_issue_materials_issue_id ON issue_materials (issue_id);
CREATE INDEX ix_issue_materials_material_id ON issue_materials (material_id);

CREATE TABLE material_topics (
	id VARCHAR NOT NULL, 
	material_id VARCHAR NOT NULL, 
	topic_id VARCHAR NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id), 
	FOREIGN KEY(topic_id) REFERENCES topics (id)
)

;
CREATE INDEX ix_material_topics_material_id ON material_topics (material_id);
CREATE INDEX ix_material_topics_topic_id ON material_topics (topic_id);

CREATE TABLE material_versions (
	id VARCHAR NOT NULL, 
	material_id VARCHAR NOT NULL, 
	version INTEGER NOT NULL, 
	notes TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id)
)

;
CREATE INDEX ix_material_versions_material_id ON material_versions (material_id);

CREATE TABLE processing_jobs (
	id VARCHAR NOT NULL, 
	material_id VARCHAR, 
	job_type VARCHAR NOT NULL, 
	status VARCHAR NOT NULL, 
	error TEXT, 
	detail TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id)
)

;
CREATE INDEX ix_processing_jobs_material_id ON processing_jobs (material_id);

CREATE TABLE publication_approvals (
	id VARCHAR NOT NULL, 
	material_id VARCHAR NOT NULL, 
	admin_id VARCHAR, 
	decision VARCHAR NOT NULL, 
	notes TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id), 
	FOREIGN KEY(admin_id) REFERENCES users (id)
)

;
CREATE INDEX ix_publication_approvals_material_id ON publication_approvals (material_id);

CREATE TABLE reading_history (
	id VARCHAR NOT NULL, 
	user_id VARCHAR NOT NULL, 
	material_id VARCHAR NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id)
)

;
CREATE INDEX ix_reading_history_user_id ON reading_history (user_id);
CREATE INDEX ix_reading_history_material_id ON reading_history (material_id);

CREATE TABLE reference_matches (
	id VARCHAR NOT NULL, 
	material_id VARCHAR NOT NULL, 
	matched_text TEXT NOT NULL, 
	reference_type VARCHAR NOT NULL, 
	status VARCHAR NOT NULL, 
	evidence TEXT, 
	is_displayed_as_fact BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id)
)

;
CREATE INDEX ix_reference_matches_material_id ON reference_matches (material_id);

CREATE TABLE sources (
	id VARCHAR NOT NULL, 
	material_id VARCHAR, 
	registry_id VARCHAR, 
	url VARCHAR NOT NULL, 
	title VARCHAR NOT NULL, 
	content_format VARCHAR NOT NULL, 
	status VARCHAR NOT NULL, 
	notes TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id), 
	FOREIGN KEY(registry_id) REFERENCES source_registry (id)
)

;
CREATE INDEX ix_sources_material_id ON sources (material_id);

CREATE TABLE quality_findings (
	id VARCHAR NOT NULL, 
	material_id VARCHAR NOT NULL, 
	ai_run_id VARCHAR, 
	rule VARCHAR NOT NULL, 
	severity VARCHAR NOT NULL, 
	message TEXT NOT NULL, 
	segment_ref VARCHAR, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id), 
	FOREIGN KEY(ai_run_id) REFERENCES ai_runs (id)
)

;
CREATE INDEX ix_quality_findings_material_id ON quality_findings (material_id);

CREATE TABLE source_assets (
	id VARCHAR NOT NULL, 
	source_id VARCHAR, 
	material_id VARCHAR, 
	url VARCHAR NOT NULL, 
	checksum VARCHAR NOT NULL, 
	mime_type VARCHAR NOT NULL, 
	raw_text TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(source_id) REFERENCES sources (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id)
)

;
CREATE INDEX ix_source_assets_source_id ON source_assets (source_id);
CREATE INDEX ix_source_assets_checksum ON source_assets (checksum);
CREATE INDEX ix_source_assets_material_id ON source_assets (material_id);

CREATE TABLE source_editions (
	id VARCHAR NOT NULL, 
	source_id VARCHAR, 
	edition VARCHAR NOT NULL, 
	publisher VARCHAR NOT NULL, 
	year VARCHAR, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(source_id) REFERENCES sources (id)
)

;
CREATE INDEX ix_source_editions_source_id ON source_editions (source_id);

CREATE TABLE text_segments (
	id VARCHAR NOT NULL, 
	arabic_text_id VARCHAR NOT NULL, 
	order_index INTEGER NOT NULL, 
	text_ar TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(arabic_text_id) REFERENCES arabic_texts (id)
)

;
CREATE INDEX ix_text_segments_arabic_text_id ON text_segments (arabic_text_id);

CREATE TABLE translations (
	id VARCHAR NOT NULL, 
	material_id VARCHAR NOT NULL, 
	model VARCHAR NOT NULL, 
	prompt_version VARCHAR NOT NULL, 
	status VARCHAR NOT NULL, 
	ai_run_id VARCHAR, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(material_id) REFERENCES materials (id), 
	FOREIGN KEY(ai_run_id) REFERENCES ai_runs (id)
)

;
CREATE INDEX ix_translations_material_id ON translations (material_id);

CREATE TABLE translation_segments (
	id VARCHAR NOT NULL, 
	translation_id VARCHAR NOT NULL, 
	text_segment_id VARCHAR NOT NULL, 
	text_id TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(translation_id) REFERENCES translations (id), 
	FOREIGN KEY(text_segment_id) REFERENCES text_segments (id)
)

;
CREATE INDEX ix_translation_segments_text_segment_id ON translation_segments (text_segment_id);
CREATE INDEX ix_translation_segments_translation_id ON translation_segments (translation_id);
