-- Pustaka Ilmu — 0003 full-text search
-- HANYA UNTUK PostgreSQL. Jangan jalankan di SQLite (tipe tsvector & fungsi
-- to_tsvector tidak ada di SQLite).

ALTER TABLE materials ADD COLUMN search_vector tsvector;
ALTER TABLE arabic_texts ADD COLUMN search_vector tsvector;

CREATE INDEX ix_materials_search_vector ON materials USING GIN (search_vector);
CREATE INDEX ix_arabic_texts_search_vector ON arabic_texts USING GIN (search_vector);

UPDATE materials SET search_vector = to_tsvector('simple', coalesce(title_id, '') || ' ' || coalesce(title_ar, ''));
UPDATE arabic_texts SET search_vector = to_tsvector('simple', coalesce(full_text, ''));
