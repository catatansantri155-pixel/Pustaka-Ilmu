# Arsitektur Pustaka Ilmu (MVP)

## Komponen
- `apps/web` — Satu aplikasi Next.js (TypeScript + Tailwind) yang memuat:
  - Reader mobile-first (route publik): Beranda, Cari, Pustaka per ulama, Detail Materi, Audio, Tersimpan.
  - Admin dashboard (route `/admin`): login, dashboard, sources, materials + bilingual editor, dan halaman status jujur untuk modul yang belum dibangun.
  Adaptasi dari master prompt (yang membayangkan dua app terpisah): reader + admin digabung dalam satu app Next.js demi kesederhanaan MVP; pemisahan tetap bersih per route group.
- `services/api` — FastAPI (Python). Seluruh logika: auth JWT + RBAC, source registry, importer, AI processing, quality audit, publication gate, search, referensi, bookmark.
- `services/workers` — Celery (Redis). Dev memakai eager mode (`CELERY_TASK_ALWAYS_EAGER=true`) sehingga tanpa Redis pun tugas berjalan sinkron.
- `packages/shared-types` — Tipe TypeScript bersama yang mencerminkan kontrak API.
- `database/migrations` — Alembic dengan model SQLAlchemy yang sama; target produksi PostgreSQL.
- `infrastructure/docker-compose.yml` — PostgreSQL 16 + Redis 7 + API + worker + web untuk produksi/staging.

## Adaptasi lingkungan dev (WAJIB dicatat)
VM pengembangan tidak memiliki PostgreSQL/Redis/Docker, sehingga dev lokal memakai **SQLite via SQLAlchemy** (model yang sama persis; UUID disimpan sebagai string sehingga portabel). Migrasi Alembic + docker-compose disediakan sebagai target produksi PostgreSQL. Tidak ada perilaku aplikasi yang bergantung pada fitur khusus SQLite selain penyimpanan.

## Alur konten & publication gate
DISCOVERED → IMPORTED → EXTRACTED → TRANSLATED → AI_CHECKED → ADMIN_REVIEW → PUBLISHED_AI.
Publikasi hanya lolos bila service gate menyatakan tidak ada blocker: sumber asli ada, hak penggunaan CLEARED, teks Arab lengkap, terjemahan lengkap tanpa segmen hilang, tidak ada temuan CRITICAL, referensi faktual memiliki bukti, dan ada approval admin. Status kualitas ilmiah (AI-only vs human-reviewed) disimpan terpisah dari status pipeline; approval admin TIDAK mengubah status AI-only menjadi human-reviewed.

## Keamanan
JWT Bearer, hash kata sandi bcrypt, RBAC (super_admin, admin, editor, viewer) ditegakkan di endpoint admin, SSRF guard pada importer (menolak IP privat/loopback/link-local), API key AI hanya dibaca backend dari env dan tidak pernah dikirim ke frontend, audit log untuk aksi admin penting. MFA TOTP: kolom `mfa_secret` disiapkan; penegakan penuh belum ada di MVP (lihat README bagian keterbatasan).

## Pencarian
Normalisasi Arab–Indonesia: penghapusan harakat untuk indeks, penyamaan varian huruf Arab, dan peta sinonim/transliterasi (wudu = wudhu = الوضوء, shalat = salat = الصلاة, tayamum = tayammum = التيمم). Implementasi dev memakai query SQL portabel; di produksi dapat diganti PostgreSQL FTS tanpa mengubah kontrak API.
