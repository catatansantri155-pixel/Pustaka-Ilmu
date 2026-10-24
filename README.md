# Pustaka Ilmu — Perpustakaan Fatwa & Khazanah Islam

> **Pertumbuhan per syaikh:** [inventaris 3.000 sumber dan target 100–1.000](docs/PERTUMBUHAN-KOLEKSI.md). Tersedia 100 sumber terverifikasi per syaikh, panel admin, serta alur batch; jumlah kandidat bukan jumlah materi terbit.

> **Pengembangan 24 Oktober 2026:** lihat [Tahap 1–4](docs/PENGEMBANGAN-TAHAP-1-4.md) dan [hasil verifikasi](docs/HASIL-VERIFIKASI-TAHAP-1-4.md). Kode mencakup stabilisasi, pengelolaan konten, pilot 30 draf, dan pagination/antrean. Catatan V1/V2 di bawah bersifat historis; jumlah koleksi produksi belum diverifikasi ulang.

Aplikasi perpustakaan digital ilmu Islam: mobile-first PWA reader + web admin dashboard, Bahasa Indonesia, konten Arab + terjemahan Indonesia, strategi AI-first dengan publikasi terkendali admin. Fokus awal: **Thaharah**, dengan 3 ulama (Bin Baz, Ibnu Utsaimin, Al-Albani). Aplikasi ini adalah perpustakaan dan mesin penelusuran ilmu — bukan sistem yang mengeluarkan fatwa baru.

> Status: **MVP end-to-end yang dapat dijalankan dan dilengkapi** (Fase 1–7 selesai versi dev; peta status per fase di [docs/TAHAPAN.md](docs/TAHAPAN.md), panduan deploy di [docs/DEPLOY-CLOUDFLARE.md](docs/DEPLOY-CLOUDFLARE.md)). Bukan mockup: frontend, backend, database, importer, audit, dan publication gate saling terhubung dan terverifikasi (lihat "Hasil Verifikasi"). Satu materi asli sudah terbit (`PUBLISHED_AI`) dan dataset Qur'an tervalidasi (6.236 ayat + terjemahan) sudah terimpor.

## Struktur Repo

```
pustaka-ilmu/
├── apps/web/               # SATU app Next.js 14 + TypeScript + Tailwind
│                           #   reader publik: /, /cari, /pustaka, /materi/[id], /audio, /tersimpan
│                           #   admin: /admin (sidebar 15 menu), /admin/login, /admin/materials,
│                           #          /admin/sources, /admin/editor/[id] (bilingual), dst.
├── services/api/           # FastAPI (auth, RBAC, registry, importer, AI, audit, gate, search)
├── services/workers/       # Celery (eager mode untuk dev; Redis untuk produksi)
├── packages/shared-types/  # Tipe TypeScript kontrak API
├── database/migrations/    # Alembic (target PostgreSQL) + postgres/0001_initial.sql (DDL terbangkit)
├── database/seeds/         # Penunjuk ke perintah seed (python -m app.seed)
├── infrastructure/         # docker-compose.yml (PostgreSQL 16 + Redis 7 + api + worker + web)
├── tests/                  # pytest (33 pengujian)
├── docs/ARCHITECTURE.md    # Arsitektur + daftar adaptasi dari master prompt
├── docs/TAHAPAN.md         # Peta Fase 1–9 master prompt + status jujur per fase
├── docs/DEPLOY-CLOUDFLARE.md # Panduan deploy: Pages (frontend) + Tunnel/VPS (backend)
├── .env.example
└── README.md
```

### Adaptasi yang disengaja (detail di docs/ARCHITECTURE.md)
1. **Reader + admin dalam satu app Next.js** (admin di route `/admin`), bukan dua app terpisah.
2. **Dev lokal memakai SQLite** via SQLAlchemy karena VM pengembangan tidak memiliki PostgreSQL/Redis/Docker; modelnya sama persis (UUID sebagai string, portabel), dan migrasi PostgreSQL (Alembic + DDL `.sql` terbangkit dari model yang sama) disediakan sebagai target produksi.

## Cara Menjalankan (dev lokal)

Prasyarat: Node 20+, Python 3.12.

```bash
cd pustaka-ilmu
python3 -m venv .venv && .venv/bin/pip install -r services/api/requirements.txt
cp .env.example .env   # sesuaikan JWT_SECRET & ADMIN_PASSWORD
```

Terminal 1 — backend + seed:
```bash
cd services/api
DATABASE_URL="sqlite:///./pustaka.db" JWT_SECRET="ganti-ini" ADMIN_PASSWORD="admin12345" \
  ../../.venv/bin/python -m app.seed
DATABASE_URL="sqlite:///./pustaka.db" JWT_SECRET="ganti-ini" \
  ../../.venv/bin/uvicorn app.main:app --port 8000
# API di http://localhost:8000 — cek: curl http://localhost:8000/health
```

Terminal 2 — frontend:
```bash
cd apps/web
npm install
NEXT_PUBLIC_API_BASE="http://localhost:8000" npm run dev
# Web di http://localhost:3000 (produksi: npm run build && npm start)
```

Worker (opsional di dev; default eager sehingga tidak wajib):
```bash
cd services
DATABASE_URL="sqlite:///../api/pustaka.db" ../.venv/bin/python -m celery -A workers.celery_app worker -l info
```

Produksi/staging: `docker compose -f infrastructure/docker-compose.yml up` (PostgreSQL + Redis + API + worker + web), lalu terapkan `database/migrations/postgres/0001_initial.sql` atau Alembic pada database kosong.

### Akun admin dev (WAJIB diganti di luar dev)
- Email: `admin@pustaka.local`
- Kata sandi: nilai `ADMIN_PASSWORD` saat seed (default contoh `admin12345`), peran `super_admin`.

## Cara Kerja Konten (ringkas)
- **Source Registry**: 3 sumber resmi terdaftar dengan `permission_status=UNVERIFIED`, `redistribution=UNKNOWN` — aplikasi TIDAK mengklaim izin apa pun. Kandidat pilot terdaftar: binbaz.org.sa/fatwas/3785 (teks HTML) serta alathar.net & al-albany.com (AUDIO — bertanda "memerlukan transkripsi"; transkripsi belum diimplementasikan).
- **Importer HTML**: mengambil halaman, mengekstrak teks Arab, sha256 + deteksi duplikat, SSRF guard menolak IP privat/loopback/link-local/reserved. Semua upaya tercatat sebagai job (termasuk yang gagal).
- **AI Translation**: adapter provider-independent (kompatibel OpenAI) via env `AI_API_BASE`/`AI_API_KEY`/`AI_MODEL`. **Tanpa API key, run tercatat FAILED dengan alasan jelas dan TIDAK ada terjemahan yang dibuat.** Label wajib pada setiap materi AI: *"Diterjemahkan oleh AI dan belum ditelaah manusia. Periksa teks Arab dan sumber asli untuk memastikan makna."*
- **Quality Audit lokal**: kelengkapan segmen, angka hilang/berubah, perubahan negasi (heuristik Arab↔Indonesia), karakter Arab rusak, urutan paragraf → `quality_findings` (LOW/MEDIUM/HIGH/CRITICAL).
- **Publication Gate**: publikasi ditolak bila tanpa sumber asli, hak belum CLEARED, teks Arab/terjemahan tidak lengkap, segmen hilang, ada temuan CRITICAL, referensi faktual tanpa bukti, atau belum ada approval admin. Publik hanya melihat status `PUBLISHED_AI`.
- **Referensi**: tabel ayat/hadis/kitab tersedia + pencocokan pola sederhana menghasilkan kandidat. **Dataset Qur'an sudah terimpor & tervalidasi strukturnya** (6.236 ayat + terjemahan Kemenag, dari fawazahmed0/quran-api via `scripts/import_quran.py`); dataset hadis masih kosong (belum ada sumber tervalidasi — tidak dikarang).

## Hasil Verifikasi Lanjutan (23 Okt 2026)
- `pytest tests/ -q` → **33 passed, 0 failed** (termasuk MFA TOTP penuh, rate limit login, PATCH segmen + RBAC, modul admin baru, glossary CRUD, impor PDF teks & PDF kosong → `NEEDS_OCR`, transkripsi audio → job `BLOCKED`, endpoint backup).
- **Dataset Qur'an terimpor ke DB live** lewat `scripts/import_quran.py`: validasi struktur lolos sebelum tulis — **6.236 ayat Arab + 6.236 terjemahan Indonesia**, 114 bab; endpoint referensi Qur'an mengembalikan 6.236 baris.
- Server live setelah restart service: `/health` OK; materi `PUBLISHED_AI` tetap tampil di API publik dan halaman web (200); endpoint admin baru (Processing, AI Runs, Publication, Reports, AI Settings — hanya boolean konfigurasi, tanpa nilai kunci, System, Glossary) membalas data nyata; 2 job transkripsi audio tercatat `BLOCKED` dengan alasan jujur; backup via API menghasilkan berkas backup nyata.
- Enam menu admin yang semula halaman status kini modul berfungsi; editor segmen dapat menyimpan (versi naik + audit log); MFA TOTP ditegakkan saat login bila diaktifkan; rate limiting per-IP aktif (login lebih ketat).

## Hasil Verifikasi (dijalankan pada VM ini, 22 Okt 2026)
- `pytest tests/ -q` → **16 passed, 0 failed** (auth, RBAC, gate tolak+lolos, normalisasi pencarian termasuk query Arab, dedup checksum, audit negasi & angka, SSRF, translate-tanpa-key FAILED).
- Backend live (seed DB bersih → uvicorn): `/health` OK; login admin seed OK; `/api/scholars` 3 ulama dengan tahun wafat benar; `/api/topics` 10 kategori THA-01..THA-10; `/api/issues` berisi THA-05-001; dashboard angka nyata (1 materi demo ADMIN_REVIEW, 0 terbit); publish materi demo **ditolak 422** dengan blockers yang tepat (tanpa sumber, hak UNKNOWN, lalu setelah approve tetap ditolak karena sumber+hak); translate tanpa key → `ai_run.status="FAILED"`, error "AI_API_KEY belum dikonfigurasi"; daftar publik tetap kosong.
- Import nyata ke `https://binbaz.org.sa/fatwas/3785` dari VM ini **ditolak SSRF guard** karena DNS VM me-resolve domain ke 198.18.x (rentang reserved) — tercatat sebagai job FAILED yang jujur; logika impor+ekstraksi+dudup teruji via unit test dengan fetch ter-mock. Di jaringan dengan DNS publik normal, jalur ini tidak terhalang.
- Frontend: `npm install` sukses; `npx tsc --noEmit` bersih; **`npx next build` sukses** (24 route, termasuk `/materi/[id]`, `/admin/*`); `next start` melayani `/`, `/admin/login` (HTTP 200) dan `manifest.webmanifest`.
- Worker: terimpor sebagai paket `services.workers`, mode eager aktif, task `import_source` & `translate_material` terdaftar.
- Skema: 34 tabel model cocok persis dengan daftar master prompt (missing 0, extra 0); DDL PostgreSQL terbangkit di `database/migrations/postgres/0001_initial.sql`.

## Keterbatasan Jujur (belum selesai / belum terverifikasi)
- Terjemahan AI eksternal belum diuji ke penyedia sungguhan (tidak ada API key di VM); jalur sukses adapter API belum terbukti end-to-end (satu terjemahan nyata yang ada dibuat sebagai run berbantuan agen dan tercatat apa adanya).
- Transkripsi audio belum aktif: adapter + implementasi opsional faster-whisper tersedia dan di-gate env; 2 kandidat audio tercatat sebagai job `BLOCKED` dengan alasan tertulis. OCR PDF pindaian belum dikonfigurasi (adapter interface ada; PDF tanpa teks → `NEEDS_OCR`).
- Pencarian di SQLite memakai normalisasi + LIKE; jalur FTS PostgreSQL (migrasi `0003_fts.sql`) sudah ditulis tetapi belum dieksekusi — VM dev tidak memiliki PostgreSQL/Docker, jadi docker-compose & Alembic ke Postgres sungguhan juga belum terverifikasi.
- Backup tersedia on-demand (endpoint admin + `scripts/backup.sh`); penjadwalan backup otomatis dan object storage R2/S3 belum diatur (lihat panduan deploy).
- Materi terbit baru 1; pilot 30 materi Thaharah menunggu daftar URL kandidat yang benar (URL kandidat awal master prompt ternyata berisi fatwa lain — lihat LAPORAN-PAGI.md).
- Paket `next@14.2.17` ditandai deprecated oleh npm; disarankan menaikkan ke patch 14.2.x terbaru pada pemeliharaan berikutnya.
