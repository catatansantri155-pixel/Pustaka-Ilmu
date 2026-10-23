# Tahapan Pembangunan Pustaka Ilmu

Peta seluruh tahapan dari master prompt, dengan status **jujur per 23 Oktober 2026**
setelah pekerjaan penyelesaian. Status: ✅ Selesai & terverifikasi · 🟡 Selesai sebagian / kode siap, eksekusi menunggu lingkungan · ⏳ Berikutnya.

## Fase 1 — Foundation ✅
Monorepo (`apps/`, `services/`, `packages/`, `database/`, `infrastructure/`), 34 tabel
sesuai master prompt, UUID PK, migrasi Alembic + DDL PostgreSQL terbangkit, autentikasi
JWT, RBAC 4 peran (super_admin/admin/editor/viewer), source registry, dashboard dasar.
Dev berjalan di SQLite dengan model yang sama; PostgreSQL adalah target produksi.
**Terbaru:** model bertambah `glossary_terms` serta kolom `ai_runs.tokens_input/tokens_output`,
`users.mfa_enabled`, `translation_segments.version` (migrasi `0002_features`).

## Fase 2 — Content Acquisition ✅ (dengan catatan lingkungan)
Importer HTML nyata (ekstraksi, checksum SHA-256, duplicate detector, SSRF guard
berlapis berbasis allowlist domain registry + fetch via proxy egress), scheduler/job
tercatat di `acquisition_jobs`/`processing_jobs`, retry tercatat sebagai job gagal yang jujur.
**Terbaru:** impor **PDF digital** via pypdf; PDF tanpa lapisan teks → status `NEEDS_OCR`
(adapter OCR tersedia sebagai interface, belum dikonfigurasi — tidak ada OCR palsu).
Kandidat audio terdaftar sebagai job transkripsi `BLOCKED` (lihat Fase 3).

## Fase 3 — AI Processing ✅ (jalur eksternal menunggu API key)
Adapter AI provider-independent (kompatibel OpenAI, via env), segmentasi Arab,
penyelarasan segmen, glosarium istilah (**terbaru:** CRUD glosarium di AI Settings),
audit kualitas lokal (segmen hilang, angka, negasi, karakter rusak, urutan),
versioning terjemahan (**terbaru:** editor segmen menaikkan versi per segmen +
`material_versions`), pencatatan `ai_runs` termasuk token & estimasi biaya.
Tanpa API key, run tercatat `FAILED` secara jujur. Satu terjemahan nyata sudah dibuat
sebagai run berbantuan agen Muse dan tercatat apa adanya di `ai_runs`.
**Audio:** interface adapter transkripsi + implementasi opsional faster-whisper
yang di-gate env (`TRANSCRIPTION_ENABLED`); saat tidak aktif, job berstatus
`BLOCKED` dengan alasan tertulis — 2 kandidat audio (Ibnu Utsaimin, Al-Albani)
sudah terdaftar dalam status ini.

## Fase 4 — References ✅
Tabel ayat/hadis/kitab + endpoint CRUD, pencocokan referensi otomatis (pola QS/HR)
menghasilkan kandidat, bukan klaim terverifikasi.
**Terbaru:** dataset Qur'an **terimpor dan tervalidasi** dari fawazahmed0/quran-api
(CDN jsDelivr): edisi Arab `ara-quranuthmanihaf` + terjemahan Indonesia Kemenag
(`ind-indonesianislam`); validasi struktur sebelum tulis — **6.236 ayat + 6.236
terjemahan**, 114 bab, jumlah per bab cocok dengan metadata dataset
(`scripts/import_quran.py`, idempoten). Dataset hadis masih kosong (belum ada
sumber tervalidasi yang diimpor — tidak dikarang).

## Fase 5 — Admin Editorial ✅
Bilingual editor (Arab kanan RTL, Indonesia kiri), **terbaru:** segmen Indonesia
bisa diedit & disimpan per segmen (endpoint PATCH, versi naik, audit log
`EDIT_SEGMENT`), antrean telaah, approve/reject/publish/unpublish, publication
gate teruji (menolak materi tanpa sumber/hak/kelengkapan/approval dan yang
memiliki temuan CRITICAL), audit log aksi admin.
**Keamanan terbaru:** MFA TOTP sungguhan (pyotp — enroll/activate/disable/verify,
login menegakkan bila aktif) dan rate limiting per-IP (login lebih ketat dari
API umum), keduanya teruji.

## Fase 6 — Mobile-First Reader ✅
Beranda, pencarian dwibahasa dengan normalisasi Arab–Indonesia (wudu = wudhu =
الوضوء, shalat = salat, tayamum = tayammum), pustaka per ulama, halaman baca
(Arab RTL font Amiri, toggle teks Arab, mode Pemula/Mendalam, ukuran font,
bookmark, riwayat baca), label AI wajib pada materi AI. Gaya mengikuti prototipe
v2 anti-slop yang disetujui user. **Terbaru:** 6 menu admin yang dulu halaman
status kini modul berfungsi dengan data asli — Processing Queue, AI Translation,
Publication, Reports (agregat per status/ulama/topik/severity + biaya AI),
AI Settings (+ glosarium), System Settings (kesehatan DB/worker, backup —
tombol membuat backup nyata via `scripts/backup.sh`/endpoint, daftar backup).
**FTS PostgreSQL:** kode jalur FTS (`search_vector` + GIN, migrasi `0003_fts.sql`)
sudah ditulis dan dipakai otomatis bila dialect PostgreSQL; di SQLite tetap
fallback normalisasi + LIKE. 🟡 *Belum dieksekusi* — VM dev tidak memiliki PostgreSQL.

## Fase 7 — Testing ✅
pytest **33 passed, 0 failed** (24 awal + 9 baru: MFA penuh, rate limit login,
PATCH segmen + RBAC, modul admin, glossary CRUD, PDF teks & NEEDS_OCR, transkripsi
BLOCKED, backup). `next build` hijau (24 route). Verifikasi live setelah restart
service: `/health`, materi `PUBLISHED_AI` tetap tampil di API publik & web (200),
semua endpoint admin baru membalas data nyata, endpoint referensi Qur'an
mengembalikan 6.236 ayat, backup via API menghasilkan berkas nyata.

## Fase 8 — GitHub 🟡 Siap push, tertahan pembuatan repo oleh batas integrasi
Repo lokal sudah `git init` (branch `main`), `.gitignore` menutup `.env`, `*.db`,
`node_modules`, `.next`, `logs/`, `backups/` — manifest snapshot terverifikasi:
96 file, ±0,46 MiB, semua UTF-8, tanpa rahasia/database. Pembuatan repository
lewat konektor GitHub resmi **ditolak GitHub**: `403 Resource not accessible by
integration` (aplikasi GitHub Muse tidak diberi akses membuat repo baru), dan
repo terkonfirmasi belum ada (404). Langkah penyelesaian: user membuat repo
kosong privat bernama `pustaka-ilmu` secara manual di github.com, memastikan
repo itu termasuk dalam pilihan repositori aplikasi Muse (tautan instalasi),
lalu snapshot di-push dengan `github push-files` ke branch `main` dan berkas
sinkron `~/workspace/pustaka-ilmu.muse-github-snapshot-sync.json` ditulis.

## Fase 9 — Deploy Cloudflare ⏳ Berikutnya (panduan siap)
Panduan lengkap di [DEPLOY-CLOUDFLARE.md](DEPLOY-CLOUDFLARE.md): frontend Next.js
→ Cloudflare Pages; backend FastAPI/PostgreSQL/Celery **tidak** berjalan di
Pages/Workers — jalur pilot via Cloudflare Tunnel, jalur produksi via VPS atau
Cloudflare Containers + PostgreSQL terkelola (Neon/Supabase) + Redis Upstash +
R2. Deploy-nya sendiri belum dilakukan, menunggu keputusan & domain user.

## Sisa keterbatasan yang masih jujur
- Terjemahan AI eksternal belum diuji ke penyedia sungguhan (belum ada API key).
- Transkripsi audio & OCR belum aktif (adapter tersedia, job berstatus jujur).
- FTS PostgreSQL & docker-compose belum dieksekusi (tidak ada Postgres/Docker di VM dev).
- Materi terbit masih 1; pilot 30 materi Thaharah menunggu daftar URL kandidat
  yang benar (URL kandidat awal master prompt ternyata berisi fatwa lain).
- `next@14.2.17` ditandai deprecated oleh npm — naikkan patch pada pemeliharaan berikutnya.
