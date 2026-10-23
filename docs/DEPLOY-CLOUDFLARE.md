# Panduan Deploy Cloudflare — Pustaka Ilmu

Dokumen ini adalah **panduan** (deploy belum dilakukan). Arsitektur Pustaka Ilmu:

- **Frontend**: Next.js 14 (`apps/web`) — statis/SSR ringan, cocok untuk Cloudflare Pages.
- **Backend**: FastAPI + SQLAlchemy (`services/api`), Celery worker (`services/workers`), PostgreSQL, Redis.

> ⚠️ **Fakta penting:** FastAPI (Python), PostgreSQL, dan Celery **tidak bisa berjalan** di
> Cloudflare Pages maupun Workers (Workers adalah runtime V8/JavaScript tanpa proses
> Python persisten, tanpa PostgreSQL lokal, dan tanpa broker Celery). Jadi Cloudflare
> dipakai untuk **frontend + edge + tunnel**, sedangkan backend tetap butuh host proses
> (VPS/server) atau layanan terkelola. Dua jalur realistis diuraikan di bawah.

---

## Jalur A — Pilot publik cepat: Pages + Cloudflare Tunnel

Cocok untuk menunjukkan aplikasi ke penguji terbatas tanpa membeli VPS baru:
backend tetap berjalan di mesin yang sudah ada (mis. VM pengembangan atau PC/server
di rumah/kantor), lalu diekspos aman lewat Tunnel. **Keterbatasan:** mesin asal harus
menyala; performa dan ketersediaan mengikuti mesin itu. Bukan untuk produksi jangka panjang.

### A1. Frontend ke Cloudflare Pages

1. Hubungkan repo GitHub `pustaka-ilmu` ke Cloudflare Pages (Dashboard → Workers & Pages → Create → Pages → Connect to Git).
2. Pengaturan build:
   - **Root directory**: `apps/web`
   - **Framework preset**: Next.js
   - **Build command**: `npx @cloudflare/next-on-pages@1` (adapter resmi untuk Next.js di Pages; alternatif yang kini direkomendasikan Cloudflare: OpenNext — `npx opennextjs-cloudflare build`)
   - **Build output directory**: `.vercel/output/static` (untuk next-on-pages) — ikuti output adapter yang dipakai.
   - **Node version**: 20+ (atur env `NODE_VERSION=20`).
3. Environment variable Pages (Settings → Environment variables → Production):
   - `NEXT_PUBLIC_API_BASE=https://api.<domain-kamu>` (alamat backend dari Tunnel, langkah A2).
   - Jangan pernah menaruh `AI_API_KEY`, `JWT_SECRET`, atau kredensial apa pun sebagai `NEXT_PUBLIC_*` — variabel itu terbaca publik di browser.
4. Deploy; uji halaman publik (`/`, `/cari`, `/pustaka`, `/materi/...`) memuat data dari API.

Catatan adapter: sebagian fitur Next.js (route dinamis SSR penuh, middleware berat)
mungkin perlu penyesuaian di Pages; aplikasi ini sebagian besar berupa pengambilan
data sisi klien ke API, sehingga risiko inkompatibilitasnya rendah. Uji `next build`
lokal tetap menjadi gerbang sebelum deploy.

### A2. Backend diekspos dengan Cloudflare Tunnel

Di mesin yang menjalankan backend (API sudah berjalan di port 8000 dan web lokal tidak perlu diekspos):

```bash
# 1. Pasang cloudflared (Debian/Ubuntu)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# 2. Login & buat tunnel
cloudflared tunnel login
cloudflared tunnel create pustaka-api

# 3. Arahkan DNS subdomain ke tunnel (DNS harus dikelola Cloudflare)
cloudflared tunnel route dns pustaka-api api.<domain-kamu>

# 4. Jalankan (ingress: api.<domain-kamu> -> localhost:8000)
cloudflared tunnel run pustaka-api
```

Konfigurasi `~/.cloudflared/config.yml`:

```yaml
tunnel: pustaka-api
credentials-file: /root/.cloudflared/<UUID>.json
ingress:
  - hostname: api.<domain-kamu>
    service: http://localhost:8000
  - service: http_status:404
```

Lalu jalankan sebagai service: `sudo cloudflared service install`.

Yang wajib disesuaikan di backend saat memakai Tunnel:
- `DATABASE_URL`, `JWT_SECRET` (yang kuat, bukan default dev), `ADMIN_PASSWORD` kuat — di `services/api/.env`, tidak masuk repo.
- CORS: batasi `allow_origins` ke domain frontend Pages (mis. `https://pustaka.<domain-kamu>`), jangan `*` di publik.
- `AI_API_KEY` diisi di sisi server bila terjemahan AI eksternal akan diaktifkan; tidak pernah di frontend.
- Tambahkan Cloudflare Access (Zero Trust) di depan `/admin` bila admin hanya untuk tim kecil — lapisan login tambahan sebelum halaman admin.

### A3. Subdomain yang disarankan

Bila domain (mis. `catatansantri.com`) DNS-nya dipindah/dikelola Cloudflare:

| Subdomain | Tujuan |
|---|---|
| `pustaka.<domain>` | Frontend (Cloudflare Pages, custom domain) |
| `api.pustaka.<domain>` atau `api.<domain>` | Backend via Tunnel (Jalur A) atau VPS (Jalur B) |

Atur custom domain Pages di Dashboard Pages → Custom domains; sertifikat TLS diterbitkan otomatis oleh Cloudflare.

---

## Jalur B — Target produksi: backend di VPS / Cloudflare Containers + data terkelola

Untuk pemakaian publik yang serius:

1. **Backend** di salah satu:
   - **VPS** (Hetzner/Contabo/DigitalOcean dsb.): jalankan `infrastructure/docker-compose.yml` (PostgreSQL 16 + Redis 7 + API + worker + web bila perlu) di balik Cloudflare DNS (mode proxied/oranye) — TLS dan proteksi dasar dari Cloudflare, origin tetap VPS.
   - **Cloudflare Containers**: menjalankan image Docker API/worker di platform Cloudflare; cocok bila ingin tetap di ekosistem Cloudflare, tetapi perhatikan ketersediaan/batas produk dan biaya saat keputusan diambil — verifikasi status produk saat itu juga.
2. **PostgreSQL terkelola**: Neon atau Supabase (tingkat gratis tersedia) — set `DATABASE_URL=postgresql+psycopg://...`, jalankan `database/migrations/postgres/*.sql` atau Alembic sebelum API pertama kali naik. Jalur FTS PostgreSQL (migrasi `0003_fts.sql`) aktif otomatis di dialect ini.
3. **Redis**: Upstash (tingkat gratis tersedia) — set `REDIS_URL` dan `CELERY_TASK_ALWAYS_EAGER=false` agar worker Celery sungguhan memproses antrean impor/terjemahan.
4. **Aset/object storage**: Cloudflare R2 (tingkat gratis 10 GB saat dokumen ini ditulis) untuk berkas sumber (PDF/audio) bila nanti fitur unggah aset dinyalakan; jangan simpan berkas besar di repo atau di disk container.
5. **Frontend**: tetap Cloudflare Pages seperti A1, dengan `NEXT_PUBLIC_API_BASE` menunjuk domain API produksi.

Pemetaan environment variable produksi:

| Variabel | Di mana | Catatan |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | Pages (Production) | URL publik API, aman tampil di browser |
| `DATABASE_URL` | Server backend / Containers secret | Jangan pernah di Pages |
| `JWT_SECRET` | Server backend | Acak ≥32 karakter, beda dari dev |
| `ADMIN_PASSWORD` | Hanya saat seed awal | Ganti kata sandi admin setelah login pertama |
| `AI_API_BASE`, `AI_API_KEY`, `AI_MODEL` | Server backend | Key hanya di server; kosongkan bila belum memakai AI eksternal |
| `REDIS_URL` | Server backend | Upstash untuk produksi |
| `CELERY_TASK_ALWAYS_EAGER` | Server backend | `false` di produksi |
| `SSL_CERT_FILE` | Hanya lingkungan khusus | Tidak perlu di VPS/Docker standar |

### Status database Supabase (per 23 Okt 2026 — SUDAH MIGRASI)

- Project Supabase **pustaka-ilmu** (ref `xarpznztbnndxbdnbiqw`, region ap-southeast-1 Singapura) sudah dibuat dan **Healthy**; skema 34 tabel + FTS (`0001`–`0003`) sudah diterapkan dan seluruh data dev (12.540 baris, termasuk 6.236 ayat Qur'an + 6.236 terjemahan dan 1 materi PUBLISHED_AI) sudah dipindahkan. Backend saat ini berjalan membaca Supabase.
- `DATABASE_URL` produksi memakai **session pooler**: `postgresql+psycopg://postgres.xarpznztbnndxbdnbiqw:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require`. Kata sandi hanya ada di `.env` server (tidak di repo).
- Khusus VM dev asisten: egress VM wajib lewat HTTP proxy sehingga koneksi TCP langsung ke pooler tidak bisa; di VM tersebut `DATABASE_URL` menunjuk relay lokal `127.0.0.1:15432` (`scripts/pg_tunnel.py`, unit systemd `pustaka-tunnel`). **Di VPS/infrastruktur nyata abaikan tunnel** — pakai host pooler langsung seperti di atas.
- Backend sudah memakai `pool_pre_ping` + `pool_recycle=180` (pooler menutup koneksi idle; wajib untuk backend berumur panjang).

### Biaya tingkat gratis (perkiraan saat dokumen ditulis — verifikasi ulang saat deploy)

- Cloudflare Pages: tingkat gratis untuk proyek personal (build & bandwidth terbatas wajar).
- Cloudflare Tunnel: gratis.
- R2: 10 GB penyimpanan gratis.
- Neon / Supabase Postgres: tingkat gratis dengan batas ukuran/komputasi kecil — cukup untuk pilot.
- Upstash Redis: tingkat gratis dengan batas perintah harian.
- Biaya pertama yang realistis muncul dari **VPS** (± €4–8/bulan kelas kecil) bila memilih Jalur B dengan VPS, dan dari pemakaian API AI per token bila terjemahan eksternal diaktifkan.

---

## Checklist sebelum go-live (kedua jalur)

- [ ] `pytest` hijau dan `next build` hijau dari commit yang sama yang di-push ke GitHub.
- [ ] `JWT_SECRET` & kata sandi admin produksi diganti; akun dev default tidak dipakai.
- [ ] CORS dibatasi ke domain frontend.
- [ ] Backup database terjadwal (lihat `scripts/backup.sh`) dan satu uji restore.
- [ ] Materi yang tampil publik hanya yang lolos publication gate (status `PUBLISHED_AI`) dengan hak sumber `CLEARED`.
- [ ] Halaman admin tidak diekspos tanpa HTTPS; pertimbangkan Cloudflare Access untuk `/admin`.
