# AUDIT PUSTAKA ILMU V2.0 — Fase A

Tanggal audit: 24 Oktober 2026. Metode: inspeksi source code repo `~/workspace/pustaka-ilmu`, query langsung database produksi (Supabase via relay lokal), pemanggilan endpoint API lokal (http://localhost:8000), dan pemeriksaan berkas build situs live https://pustaka-ilmu.pages.dev.

Kategori: **BAIK** (berjalan) · **PERBAIKI** (berjalan, perlu ditingkatkan) · **BELUM** (belum diimplementasikan) · **PLACEHOLDER** · **ERROR** · **KONFIG-EKSTERNAL** (butuh konfigurasi/pihak luar).

## 1. Ringkasan arsitektur (BAIK)

- Frontend: Next.js 14.2.17 (App Router) + React 18 + Tailwind 3.4 di `apps/web`; tipe bersama di `packages/shared-types`.
- Backend: FastAPI + SQLAlchemy 2 di `services/api`; router: auth, public, admin, references, bookmarks. Middleware rate-limit in-memory (sliding window 60 dtk/IP) sudah aktif untuk `/api/*` dan login.
- Database produksi: PostgreSQL (Supabase, ref xarpznztbnndxbdnbiqw) — 35 tabel skema publik. Akses dari VM dev melalui relay lokal `scripts/pg_tunnel.py` (127.0.0.1:15432) karena egress VM wajib proxy.
- Deployment: frontend Cloudflare Pages (build `npx @cloudflare/next-on-pages@1`, output `.vercel/output/static`, env `NEXT_PUBLIC_API_BASE=https://api.companyprofile.web.id` terverifikasi tertanam di bundle live); backend di VM dev + Cloudflare Named Tunnel `pustaka-api` → `api.companyprofile.web.id`. **Catatan keandalan (PERBAIKI, struktural):** VM dev berkali-kali diganti sistem (unit systemd hilang) dan koneksi tunnel sesekali putus ±1 menit lalu pulih sendiri — produksi nyata memerlukan host selalu-nyala (VPS), lihat docs/DEPLOY-CLOUDFLARE.md Jalur B.
- Publication gate (`services/api/app/services/gate.py`) aktif dan jujur: memblokir tanpa sumber, hak belum CLEARED, Arab tidak lengkap, terjemahan tidak lengkap/segmen hilang, temuan CRITICAL, atau tanpa PublicationApproval APPROVED.

## 2. Data produksi nyata (hasil query 24 Okt 2026)

| Entitas | Jumlah | Catatan |
|---|---|---|
| scholars | 3 | Bin Baz, Ibnu Utsaimin, Al-Albani |
| topics | 10 | THA-01 s.d. THA-10 lengkap sesuai master prompt |
| materials | 2 | 1 PUBLISHED_AI (hadis shabwah, hak CLEARED) + 1 demo ADMIN_REVIEW (is_demo) |
| text_segments / translations | 8 / 2 | pasangan segmen materi terbit + demo |
| issues | 1 | THA-05-001 "Hukum wudu setelah memakan daging unta", deskripsi kosong, 0 materi tertaut |
| issue_materials | 0 | belum ada relasi |
| glossary_terms | 0 | tabel ada, data kosong |
| quran_verses | 6.236 | + 6.236 terjemahan Kemenag (tervalidasi per surah) |
| hadith_records | 0 | belum ada sumber hadis tervalidasi |
| users | 1 | admin dev |
| source_registry | 3 | Bin Baz PERMITTED_WITH_ATTRIBUTION (bukti footer resmi tercatat); Utsaimin & Al-Albani UNVERIFIED |

## 3. Temuan per area

### Sudah berjalan dengan baik (BAIK)
- Auth JWT + RBAC (super_admin/admin/editor/viewer), MFA TOTP admin, rate limiting.
- Importer HTML dengan SSRF guard berbasis allowlist domain registry + checksum dedup; PDF import jujur NEEDS_OCR untuk PDF tanpa teks.
- AI adapter provider-independent: tanpa API key, run tercatat FAILED secara jujur (tidak ada terjemahan palsu). Label AI: "Diterjemahkan oleh AI dan belum ditelaah manusia…" tampil di UI.
- Pencarian: FTS PostgreSQL (`search_vector`, migrasi 0003) + fallback normalisasi teks; `services/search.py` sudah mempunyai normalisasi Arab (hapus harakat, إ/أ/آ→ا, ة→ه, ى→ي) dan peta sinonim dasar (wudu, shalat, tayamum, najis, haid, ghusl).
- Referensi Qur'an: 6.236 ayat + terjemahan Kemenag dapat diakses via endpoint references.
- Halaman publik: `/`, `/cari` (hasil + filter ulama + daftar persoalan), `/pustaka`, `/pustaka/[scholarId]` (profil + filter lokal), `/materi/[id]` (pasangan segmen, mode Pemula/Mendalam dasar, bookmark, share), `/audio` (filter content_type AUDIO), `/tersimpan` (bookmark, butuh login). Semua punya Loading/Error/Empty state dasar.
- Panel admin: 16 halaman (dashboard, sources, acquisition, materials, editor dwibahasa, ai-translation, processing, quality, publication, references, reports, scholars, ai-settings, settings, login) — modul nyata, bukan stub.
- Bottom navigation mobile floating 5 tab sudah ada di `ReaderShell` (Beranda, Cari, Pustaka, Audio, Tersimpan); Admin hanya di header desktop.
- Backup terverifikasi (scripts/backup.sh) dan pytest baseline 33 lulus.

### Berjalan tetapi perlu diperbaiki (PERBAIKI)
1. **Loading tanpa batas (akar keluhan "Memuat data…"):** `apiFetch` di `apps/web/lib/api.ts` tidak mempunyai timeout — bila tunnel/API lambat, halaman berhenti di LoadingState selamanya. LoadingState juga teks polos tanpa skeleton. → Fase B.
2. **ErrorState tanpa tombol coba lagi** di semua halaman pembaca. → Fase B.
3. **Palet warna menyimpang dari token V2** (ivory #FAF7F0, emerald #065F46/#064E3B, gold #C9A227 vs token resmi #FAF9F6/#176B53/#103D32/#D6B979) dan font Arab masih Amiri, bukan Noto Naskh Arabic. → Fase C.
4. **Beranda belum sesuai struktur BAGIAN 5:** subtitle belum "Temukan ilmu dari sumbernya.", placeholder search belum persis, Featured Collection belum berjudul "Thaharah — Panduan Memahami Hukum Bersuci", kategori non-Thaharah (Shalat/Puasa/Zakat/Akidah/Muamalah) belum tampil dengan status "Segera hadir", belum ada "Lanjutkan membaca". → Fase C.
5. **Pembaca `/materi/[id]`:** pilihan tampilan masih toggle Arab on/off (belum mode gabung/Arab saja/Indonesia saja yang persisten), ukuran font belum persisten, belum ada daftar isi segmen, glosarium hanya tampil di mode Mendalam dari field materi (bukan endpoint), belum ada tombol lapor koreksi. → Fase D.
6. **Bio Ibnu Utsaimin kosong** di database (bio_id null) — biografi tidak boleh dikarang; perlu sumber resmi.
7. **Endpoint publik belum ada:** GET /api/issues/{id} (detail + materi tertaut), GET /api/glossary publik, POST koreksi terjemahan dari pembaca. Frontend `api.issues()` sudah memanggil list, tetapi detail persoalan belum tersedia. → Fase E.
8. **Sinonim pencarian belum lengkap:** belum ada khuf/خف, istinja/استنجاء, kunci "mandi wajib", dan normalisasi belum menghapus tatweel (ـ). → Fase E.
9. **Tabel V2 belum ada:** user_notes, correction_reports, scholar_aliases (disebut BAGIAN 19). → Fase E (migrasi aditif 0004).
10. Pencarian belum mencari di nama ulama/judul secara terstruktur (masih judul+teks materi) — diterima untuk tahap 1 master prompt (FTS + normalisasi + sinonim).

### Belum diimplementasikan (BELUM)
- Dataset hadis (0 rekaman) — belum ada sumber tervalidasi; endpoint & skema sudah siap.
- Transkripsi audio nyata & OCR PDF scan — adapter ada, belum ada penyedia aktif; 2 kandidat audio tercatat BLOCKED dengan alasan tertulis.
- Perbandingan fatwa berdampingan, pembaca kitab berurutan (works/editions ada di skema, belum ada data kitab), catatan pribadi pengguna (tabel ditambahkan Fase E; UI menyusul), folder koleksi bookmark.
- Semantic/vector search (tahap lanjutan BAGIAN 14).
- Notifikasi & halaman pengaturan pengguna publik (header beranda tanpa tombol notifikasi — disengaja: jangan tampilkan tombol yang tidak berfungsi).

### Placeholder (PLACEHOLDER)
- 1 materi demo ADMIN_REVIEW ("Contoh Tampilan: Materi Uji Editor (Bukan Fatwa)", is_demo=true) — ditandai jelas sebagai demo, tidak tampil publik. Dipertahankan untuk pengujian editor.
- Halaman `/audio`: empty state jujur (belum ada audio terbit) — bukan placeholder palsu.

### Error (ERROR)
- Tidak ditemukan error fungsional pada API lokal saat audit (health, scholars, topics, issues, materials, search merespons benar). Error historis yang sudah diperbaiki: build Pages gagal (konflik peer-dependency next-on-pages/wrangler → `.npmrc` legacy-peer-deps; rute dinamis tanpa edge runtime → layout.tsx `runtime='edge'`; commit 5a68690b).
- Risiko ERROR berulang: keandalan VM dev + tunnel (lihat 1) — di luar kode aplikasi; mitigasi pemulihan satu perintah `scripts/start-all.sh`.

### Membutuhkan konfigurasi eksternal (KONFIG-EKSTERNAL)
- API key penyedia AI untuk penerjemahan eksternal otomatis (saat ini agent-assisted tercatat di ai_runs).
- Izin/hak sumber Utsaimin (binothaimeen.net) & Al-Albani (al-albany.com): UNVERIFIED → hanya metadata + tautan yang boleh disimpan.
- Host produksi selalu-nyala untuk backend (VPS/Containers) + ganti kata sandi admin dev default.
- Daftar URL fatwa Thaharah Bin Baz yang benar untuk pilot 30 materi (URL contoh lama terbukti redirect ke fatwa lain — discovery harus memverifikasi isi).
