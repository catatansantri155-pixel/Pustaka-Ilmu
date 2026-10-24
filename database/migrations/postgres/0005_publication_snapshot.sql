-- Additive. Never bless legacy approvals automatically.
ALTER TABLE publication_approvals ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64) NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS ix_materials_catalog ON materials (status, created_at, id);
