-- 0004_v2_additions.sql — Migrasi ADITIF V2.0 (Master Prompt BAGIAN 19).
-- Hanya CREATE TABLE/INDEX IF NOT EXISTS + UPDATE data seed yang aman.
-- Tidak ada DROP/ALTER destruktif. Aman dijalankan berulang.

CREATE TABLE IF NOT EXISTS scholar_aliases (
    id VARCHAR PRIMARY KEY,
    scholar_id VARCHAR NOT NULL REFERENCES scholars(id),
    alias VARCHAR NOT NULL,
    lang VARCHAR DEFAULT 'ar',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_scholar_aliases_scholar_id ON scholar_aliases (scholar_id);
CREATE INDEX IF NOT EXISTS ix_scholar_aliases_alias ON scholar_aliases (alias);

CREATE TABLE IF NOT EXISTS user_notes (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    material_id VARCHAR NOT NULL REFERENCES materials(id),
    text_segment_id VARCHAR,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_user_notes_user_id ON user_notes (user_id);
CREATE INDEX IF NOT EXISTS ix_user_notes_material_id ON user_notes (material_id);

CREATE TABLE IF NOT EXISTS correction_reports (
    id VARCHAR PRIMARY KEY,
    material_id VARCHAR NOT NULL REFERENCES materials(id),
    text_segment_id VARCHAR,
    reporter_name VARCHAR DEFAULT '',
    message TEXT NOT NULL,
    status VARCHAR DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_correction_reports_material_id ON correction_reports (material_id);
CREATE INDEX IF NOT EXISTS ix_correction_reports_status ON correction_reports (status);

-- Seed persoalan nyata (BAGIAN 7): persoalan ini sudah ada sejak V1 sebagai
-- THA-05-001 tanpa deskripsi. Lengkapi judul bentuk pertanyaan + ruang lingkup.
-- Materi TIDAK ditautkan: belum ada materi terbit yang membahasnya secara relevan.
INSERT INTO issues (id, code, title_id, description_id, topic_id, created_at, updated_at)
SELECT 'thaharah-issue-daging-unta', 'THA-05-001',
       'Apakah makan daging unta membatalkan wudu?',
       'Persoalan ini menanyakan status wudu seseorang setelah memakan daging unta: apakah wudunya batal sehingga wajib berwudu kembali sebelum shalat, ataukah tidak batal. Pembahasan bersandar pada hadis perintah berwudu setelah memakan daging unta dan perbedaan penilaian para ulama terhadapnya. Halaman ini hanya menautkan fatwa yang benar-benar membahas persoalan ini setelah materi sumbernya terbit melalui gerbang publikasi; selama belum ada, statusnya menunggu materi sumber.',
       (SELECT id FROM topics WHERE code = 'THA-05'), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM issues WHERE code = 'THA-05-001');

UPDATE issues
SET title_id = 'Apakah makan daging unta membatalkan wudu?',
    description_id = 'Persoalan ini menanyakan status wudu seseorang setelah memakan daging unta: apakah wudunya batal sehingga wajib berwudu kembali sebelum shalat, ataukah tidak batal. Pembahasan bersandar pada hadis perintah berwudu setelah memakan daging unta dan perbedaan penilaian para ulama terhadapnya. Halaman ini hanya menautkan fatwa yang benar-benar membahas persoalan ini setelah materi sumbernya terbit melalui gerbang publikasi; selama belum ada, statusnya menunggu materi sumber.',
    updated_at = now()
WHERE code = 'THA-05-001' AND (description_id IS NULL OR description_id = '');

-- Seed glosarium istilah dasar Thaharah (definisi leksikal editorial, bukan fatwa).
INSERT INTO glossary_terms (id, term_ar, term_id, context, created_at, updated_at)
SELECT v.id, v.term_ar, v.term_id, v.context, now(), now() FROM (VALUES
  ('gloss-thaharah', 'الطهارة', 'Thaharah', 'Bersuci: menghilangkan hadas dan najis sebagai syarat sah ibadah tertentu, misalnya shalat.'),
  ('gloss-wudu', 'الوضوء', 'Wudu', 'Membasuh dan mengusap anggota badan tertentu dengan air disertai niat untuk menghilangkan hadas kecil.'),
  ('gloss-hadas', 'الحدث', 'Hadas', 'Keadaan tidak suci secara hukum (kecil atau besar) yang menghalangi sahnya shalat dan ibadah tertentu sampai dihilangkan dengan wudu, mandi, atau tayamum.'),
  ('gloss-najis', 'النجاسة', 'Najis', 'Zat yang dianggap kotor menurut syariat, misalnya darah dan kotoran, yang wajib disucikan dari badan, pakaian, dan tempat shalat.'),
  ('gloss-istinja', 'الاستنجاء', 'Istinja', 'Membersihkan sisa buang air dari tempat keluarnya menggunakan air, atau batu/benda sejenis (istijmar).'),
  ('gloss-tayamum', 'التيمم', 'Tayamum', 'Pengganti wudu atau mandi wajib menggunakan tanah/debu yang suci ketika air tidak tersedia atau tidak dapat digunakan.'),
  ('gloss-khuf', 'الخف', 'Khuf', 'Penutup kaki dari kulit yang dipakai setelah berwudu; dalam kondisi tertentu permukaannya boleh diusap sebagai pengganti membasuh kaki saat wudu.'),
  ('gloss-ghusl', 'الغسل', 'Mandi wajib (ghusl)', 'Meratakan air ke seluruh badan disertai niat untuk menghilangkan hadas besar, misalnya karena junub atau setelah haid.'),
  ('gloss-istihadhah', 'الاستحاضة', 'Istihadhah', 'Darah yang keluar dari kemaluan perempuan di luar masa haid dan nifas, umumnya karena penyakit; hukum ibadahnya berbeda dari haid.'),
  ('gloss-rajih', 'الراجح', 'Rajih', 'Pendapat yang dinilai lebih kuat dalilnya oleh seorang ulama atau peneliti setelah membandingkan pendapat-pendapat yang ada.'),
  ('gloss-ijma', 'الإجماع', 'Ijma', 'Kesepakatan para ulama mujtahid dalam suatu persoalan hukum syariat pada suatu masa.')
) AS v(id, term_ar, term_id, context)
WHERE NOT EXISTS (SELECT 1 FROM glossary_terms g WHERE g.term_id = v.term_id);
