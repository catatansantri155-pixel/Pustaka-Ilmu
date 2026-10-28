# Maktabah Al-'Ilmiyyah — Pustaka Ilmu

Aplikasi perpustakaan fatwa dan khazanah Islam berbahasa Indonesia: pembaca web mobile-first (PWA) + dasbor admin, berisi materi Arab dan terjemahan Indonesia dengan gerbang publikasi yang dikendalikan admin.

**Demo live:** https://pustaka-ilmu.pages.dev

Aplikasi ini adalah perpustakaan dan mesin penelusuran ilmu. Ia **bukan** sistem yang mengeluarkan fatwa baru: seluruh materi berasal dari sumber ulama yang jelas dan melewati peninjauan sebelum terbit.

## Status koleksi

- **2.867 materi terbit** dari Syaikh Bin Baz: Thaharah (1.001), Shalat (1.000), Jenazah (866)
- Al-Qur'an lengkap: 6.236 ayat Arab + 6.236 terjemahan Kemenag, tervalidasi
- Jilid berikutnya (Zakat, Puasa, dan seterusnya) sedang disiapkan

## Fitur

- Pembaca PWA mobile-first: beranda per bab, pencarian teks penuh, halaman materi dwibahasa
- Daftar Persoalan: ratusan pertanyaan fikih yang tertaut ke fatwa yang membahasnya
- Penanda lokal (tersimpan di perangkat, tanpa wajib login)
- Dasbor admin: antrean impor & peninjauan, gerbang publikasi, audit trail, RBAC

## Teknologi

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS (Cloudflare Pages)
- **Backend:** FastAPI (Python), Celery
- **Database:** PostgreSQL (Supabase) + Alembic
- **Paket bersama:** TypeScript shared types sebagai kontrak API

## Struktur repo

```
apps/web/               # Aplikasi Next.js (pembaca publik + admin)
services/api/           # FastAPI: auth, RBAC, importer, pencarian, gerbang publikasi
services/workers/       # Celery (mode eager untuk dev; Redis untuk produksi)
packages/shared-types/  # Tipe TypeScript kontrak API
database/               # Migrasi Alembic + skema PostgreSQL
infrastructure/         # Konfigurasi deploy
docs/                   # Arsitektur dan panduan deploy
tests/                  # Pengujian
```

## Menjalankan secara lokal

1. Salin `.env.example` menjadi `.env` dan isi nilainya. **Wajib** mengganti `ADMIN_PASSWORD` dan `JWT_SECRET` dengan nilai kuat milik Anda sendiri sebelum menjalankan apa pun di luar mesin lokal.
2. Jalankan API (FastAPI) — secara bawaan di `http://localhost:8000`, cek `GET /health`.
3. Jalankan web (Next.js) dengan `NEXT_PUBLIC_API_BASE` mengarah ke API — secara bawaan di `http://localhost:3000`.
4. Akun admin awal dibuat oleh proses seed dari nilai `ADMIN_PASSWORD` di `.env` Anda.

Panduan arsitektur: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Panduan deploy: [docs/DEPLOY-CLOUDFLARE.md](docs/DEPLOY-CLOUDFLARE.md)

## Konten & hak

- Materi Syaikh Bin Baz digunakan **dengan atribusi** sesuai izin yang diperoleh.
- Materi ulama lain **tidak** dimasukkan sebelum izin tertulis dari pemegang haknya terverifikasi.
- Lisensi kode (lihat berkas `LICENSE`) tidak mencakup isi fatwa dan terjemahan di basis data; hak atas konten tetap pada sumber dan pemegang haknya masing-masing.

## Berkontribusi

Kontribusi terbuka — silakan baca [CONTRIBUTING.md](CONTRIBUTING.md) terlebih dahulu. Perubahan konten mengikuti gerbang hak di atas; tidak ada materi ulama baru tanpa izin tertulis yang terverifikasi.
