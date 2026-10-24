# LAPORAN PENGEMBANGAN PUSTAKA ILMU V2.0 — FASE 1

Tanggal: 24 Oktober 2026. Ruang lingkup ronde ini: Fase A (Audit), B (P0 Stabilisasi), C (P1 UI/UX), D (Pembaca), E (DB & Backend), F (Konten — usaha terbaik), G (Uji + Push). Master prompt: `docs/MASTER-PROMPT-V2.md`. Audit: `docs/AUDIT-V2.md`.

## 1. Masalah yang ditemukan

1. Halaman berhenti di "Memuat data…" tanpa batas bila API/tunnel lambat — `apiFetch` tanpa timeout; LoadingState teks polos; ErrorState tanpa tombol coba lagi.
2. Palet warna & font Arab menyimpang dari design token V2 (BAGIAN 4.2–4.3): emerald lama #065F46, gold #C9A227, font Amiri.
3. Beranda belum mengikuti struktur BAGIAN 5 (subtitle, placeholder search, Featured Collection, kategori "Segera hadir", Lanjutkan membaca).
4. Pembaca: tampilan bahasa hanya toggle on/off, preferensi tidak persisten, tidak ada daftar isi, glosarium tidak dari endpoint, tidak ada jalur laporan koreksi pembaca.
5. Backend: belum ada endpoint publik detail persoalan, glosarium publik, dan laporan koreksi; tabel V2 (user_notes, correction_reports, scholar_aliases) belum ada; glosarium kosong; persoalan THA-05-001 tanpa deskripsi ruang lingkup.
6. **Bug pencarian nyata:** jalur FTS PostgreSQL mengembalikan `[]` dan menghentikan pencarian — fallback sinonim/normalisasi tidak pernah berjalan, sehingga "wudhu" menghasilkan 0 padahal ada materi wudu.
7. Sinonim belum mencakup khuf & istinja; normalisasi belum membuang tatweel.
8. Koleksi: hanya 1 materi terbit; 3 fatwa Thaharah hasil impor tertahan di status EXTRACTED (judul mentah, rights UNKNOWN, is_complete kosong, tanpa topik, tanpa terjemahan).

## 2. Penyebab masalah

1–2: implementasi V1 dibuat sebelum token & standar state V2 ditetapkan. 6: urutan logika di `routers/public.py search()` — hasil FTS kosong diperlakukan sebagai hasil akhir. 8: importer V1 tidak memetakan izin registry ke rights_status, tidak menandai kelengkapan teks, dan menaruh teks mentah sebagai judul; impor dijalankan tanpa registry_id.

## 3. File/modul yang diperbaiki

- `apps/web/lib/api.ts` — timeout keras AbortController 12 detik dengan pesan timeout yang jelas; helper `api.issue`, `api.glossaryPublic`, `api.reportCorrection`; riwayat bacaan localStorage (`recordLocalReading`/`getLocalReading`).
- `apps/web/components/ui.tsx` — LoadingState menjadi skeleton terbatas waktu (selalu berakhir di data/empty/error), ErrorState dengan tombol **Coba lagi** (retry memanggil ulang fetch) di semua halaman pembaca.
- `apps/web/app/page.tsx` — restruktur beranda BAGIAN 5 (lihat fitur).
- `apps/web/app/cari|pustaka|pustaka/[scholarId]|audio|tersimpan/page.tsx` — retry terpasang; kartu persoalan kini membuka halaman persoalan.
- `apps/web/app/materi/[id]/page.tsx` — ditulis ulang (lihat Fase D).
- `apps/web/app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`, `components/ReaderShell.tsx` — token V2 + font + label tab "Simpan" + safe-area.
- `services/api/app/routers/public.py` — endpoint baru + perbaikan fallback pencarian (FTS kosong → sinonim; haystack kini termasuk teks terjemahan).
- `services/api/app/services/search.py` — sinonim berbasis grup dua arah + tatweel dibuang saat normalisasi.
- `services/api/app/models.py` — model ScholarAlias, UserNote, CorrectionReport.

## 4. Fitur yang ditambahkan

- **Fase C:** design token persis BAGIAN 4.2 sebagai CSS variables + Tailwind; font Arab **Noto Naskh Arabic** (line-height 2.1); beranda: header logo+salam+subtitle "Temukan ilmu dari sumbernya.", search placeholder persis prompt, dua card Jelajahi Ulama/Persoalan, Featured Collection "Thaharah — Panduan Memahami Hukum Bersuci" (motif geometris — tidak ada aset foto berlisensi di repo, tanpa gambar AI/wajah), kategori Thaharah dari API + Shalat/Puasa/Zakat/Akidah/Muamalah berstatus "Segera hadir", Materi Terbaru dari API, "Lanjutkan membaca" dari localStorage.
- **Fase D (pembaca):** tampilan Gabung/Arab saja/Indonesia saja persisten; Mode Pemula/Mendalam persisten; ukuran font Arab & Latin terpisah dan persisten; daftar isi per segmen; glosarium dari endpoint publik (ketuk istilah → definisi); bookmark & share (Web Share API + fallback salin tautan); formulir **Laporkan Kesalahan Terjemahan** → POST /api/correction-reports; riwayat bacaan lokal tercatat otomatis.
- **Halaman persoalan baru** `/persoalan/[id]` (BAGIAN 7): judul, kategori, ruang lingkup, daftar materi tertaut terbit, atau status jujur "menunggu materi sumber".
- **Fase E endpoint:** `GET /api/issues/{id}`, `GET /api/glossary`, `GET /api/glossary/{term}`, `POST /api/correction-reports` (publik, validasi 5–2000 karakter, material harus ada, rate-limit global /api yang sudah ada). Reading progress memakai endpoint `/api/reading-history` yang sudah ada + localStorage.
- **Fase F konten:** 3 fatwa Thaharah Bin Baz diterbitkan (lihat §5–6).

## 5. Database migrations yang dibuat

- `database/migrations/postgres/0004_v2_additions.sql` (ADITIF, idempoten) — diterapkan ke Supabase dan terverifikasi: tabel `scholar_aliases`, `user_notes`, `correction_reports` (+indeks); seed 11 istilah glosarium Thaharah (definisi leksikal editorial); persoalan THA-05-001 dilengkapi menjadi "Apakah makan daging unta membatalkan wudu?" + penjelasan ruang lingkup. **Tidak ada materi ditautkan ke persoalan itu** — belum ada materi terbit yang membahasnya; statusnya menunggu materi sumber.
- Kurasi data impor (skrip tercatat `scripts/v2_curate_imports.py`): judul Arab/Indonesia 3 materi dirapikan, `is_complete=true` setelah verifikasi set segmen utuh, `rights_status='CLEARED'` berdasarkan bukti registry PERMITTED_WITH_ATTRIBUTION untuk binbaz.org.sa, tautan topik THA-01/THA-01/THA-03.

## 6. Pengujian yang dijalankan

- **pytest: 36 lulus, 0 gagal** (baseline 33 + 3 tes V2 baru: glosarium publik & detail persoalan, validasi laporan koreksi, sinonim/normalisasi V2 termasuk tatweel).
- **Build frontend:** `npx @cloudflare/next-on-pages@1` dengan `NEXT_PUBLIC_API_BASE=https://api.companyprofile.web.id` → **exit 0**; output memuat fungsi edge `persoalan/[id]` dan API base yang benar tertanam di bundle.
- **Verifikasi API langsung (setelah restart):** /health OK; /api/glossary (11 istilah) & /api/glossary/{term} OK; /api/issues/{id} OK dengan status menunggu materi; POST /api/correction-reports → 201 PENDING (satu laporan uji agen tercatat berlabel jelas sebagai uji verifikasi); pencarian live: wudhu→3, wudu→3, istinja→1, bensin→1, zamzam→1, khuf→0 (jujur: belum ada materi khuf).
- **Fase F end-to-end:** 3 materi melewati approve (endpoint admin, catatan persetujuan operasional) → publish → **gate lolos**; /api/materials publik kini 4 materi; audit kualitas (`services/audit.py`) atas 15 pasang segmen: **0 temuan**; 3 baris `ai_runs` tercatat model `claude-agent-assisted` status COMPLETED.

## 7. Pengujian yang gagal / catatan kegagalan

- Tidak ada kegagalan tes tersisa. Dua kegagalan proses yang sudah teratasi dan tercatat: (a) build next-on-pages pertama terputus karena VM diganti sistem di tengah jalan — diulang dan exit 0; (b) VM diganti lagi setelah Fase F sehingga seluruh layanan mati — dipulihkan satu perintah `scripts/start-all.sh`, data Supabase utuh.
- Satu laporan koreksi berlabel "Uji verifikasi endpoint V2 oleh agen" sengaja dibiarkan tercatat sebagai bukti uji (bukan laporan pengguna).

## 8. Fitur yang belum tersedia

- Dataset hadis masih 0 (belum ada sumber tervalidasi) — skema & endpoint siap.
- Bio Ibnu Utsaimin masih kosong di DB (tidak boleh dikarang; menunggu sumber resmi).
- Catatan pribadi pengguna: tabel `user_notes` siap, UI belum dibangun. Perbandingan fatwa, pembaca kitab berurutan, folder koleksi, audio player & transkripsi, vector search: belum (sesuai prioritas master prompt; audio/OCR adapter mencatat BLOCKED dengan alasan).
- Materi daging unta untuk persoalan THA-05-001 belum tertaut (belum ada sumber terbit yang relevan).

## 9. Integrasi yang memerlukan konfigurasi

- API key penyedia AI eksternal (penerjemahan saat ini agent-assisted, tercatat jujur).
- Izin sumber Utsaimin & Al-Albani masih UNVERIFIED → hanya metadata/tautan.
- Host backend selalu-nyala (VPS) untuk produksi; kata sandi admin dev default wajib diganti.
- Setelah push GitHub, Cloudflare Pages membangun ulang otomatis dari main; verifikasi tampilan live menyusul dari sisi pengguna.

## 10. Langkah berikutnya

1. Verifikasi situs live pasca-deploy Pages (data 4 materi tampil, halaman persoalan & glosarium berfungsi).
2. Lanjutkan pilot konten menuju 30 materi Thaharah (discovery terverifikasi per URL, pola Fase F).
3. UI catatan pribadi di atas `user_notes`; isi bio ulama dari sumber resmi; dataset hadis dari sumber tervalidasi.
4. Pindahkan backend ke host selalu-nyala sebelum pemakaian publik luas.
