# Laporan Pagi — Pustaka Ilmu
**Jumat, 23 Oktober 2026 (disiapkan semalaman 22–23 Okt)** — Status: **aplikasi JALAN dan sudah bisa dipakai, dengan 1 materi pilot asli TERBIT.**

> **Adendum 23 Okt ~10:50 WIB:** klaim §1 di bawah tentang "systemd service ... sudah dibuktikan hidup lagi" ternyata PREMATUR — unit systemd belum pernah terpasang, server jalan via nohup dan mati lagi sekitar 10:10 WIB 23 Okt. Sudah diperbaiki: unit systemd `pustaka-api` dan `pustaka-web` kini TERPASANG, TER-ENABLE, dan ketahanan restartnya TERBUKTI (proses utama API di-kill paksa, service kembali `active` dan `/health` OK dalam hitungan detik). Klaim persistensi di §1 kini benar.

---

## 1. Status server & cara akses

Kedua server berjalan sebagai **systemd service** di VM ini (`pustaka-api` dan `pustaka-web`, status `enabled` + `active`, `Restart=always` — sudah dibuktikan hidup lagi setelah `systemctl restart`):

- **Web (yang kamu pakai): http://localhost:3000**
- **API: http://localhost:8000** — cek kesehatan: http://localhost:8000/health → `{"status":"ok"}`
- Halaman materi pilot: http://localhost:3000/materi/71f414ca-18a3-4c19-b5e9-fd12618bac35
- Login admin: http://localhost:3000/admin/login

Di laptop kamu sendiri: ikuti README.md di repo ini (backend `uvicorn` port 8000, frontend `npm run dev` port 3000), atau jalankan `scripts/start-all.sh` yang melakukan hal yang sama (membuat `.env` + seed + build + start bila belum ada).

**Akun admin dev:** `admin@pustaka.local` / `admin12345`
⚠️ Ini kata sandi default dev yang terdokumentasi di README — **wajib diganti** sebelum aplikasi dipakai di luar lingkungan dev (atur `ADMIN_PASSWORD` di `services/api/.env` pada instalasi baru).

## 2. Materi pilot: TERBIT — tapi isinya BUKAN daging unta

Satu materi asli berhasil diproses end-to-end dan diterbitkan lewat publication gate:

- **Judul:** Penilaian Hadis: Sesungguhnya Allah Kagum kepada Pemuda yang Tidak Memiliki Shabwah
- **Ulama:** Bin Baz — **Status:** `PUBLISHED_AI`, tampil di daftar publik dan halaman detail (Arab 7 segmen + terjemahan Indonesia 7 segmen + label AI).

**Koreksi penting:** URL kandidat dari master prompt, `binbaz.org.sa/fatwas/3785`, ternyata **me-redirect (301)** ke fatwa lain: `binbaz.org.sa/fatwas/977/...` tentang penilaian hadis «إن الله يعجب لشاب ليس له صبوة» (hadis tentang pemuda yang tidak memiliki *shabwah* — kecenderungan menyimpang masa muda) dan batas usia masa muda. Isinya **bukan** tentang wudu/daging unta. Karena itu materi ini **sengaja tidak dikaitkan** ke persoalan THA-05-001 (memaksakan topik yang tidak sesuai isi adalah pelanggaran integritas sumber). Konsekuensi yang jujur: pencarian **"daging unta" menghasilkan 0** (memang tidak ada materi itu), sedangkan pencarian **"صبوة"** dan **"pemuda"** menemukan materi ini (masing-masing total 1, terverifikasi).

Prosesnya: impor lewat importer yang diperbaiki (job `COMPLETED`, checksum SHA-256 `28b7e8e65706…`, teks Arab asli lengkap 807 karakter, URL kanonis tersimpan) → segmentasi 7 segmen → diterjemahkan lengkap oleh agen Muse dan tercatat jujur di `ai_runs` sebagai model `claude-agent-assisted-claude-sonnet` (bukan mengaku API eksternal) → quality audit **0 temuan** → approval admin → terbit lewat gate. Hadis yang disebut di dalam fatwa dicatat sebagai `evidence_mentions` dari teks itu sendiri (tidak ditampilkan sebagai fakta terverifikasi); tidak ada dalil tambahan dari luar. Approval dilakukan oleh akun admin sistem saat penyiapan, atas delegasi penuh dari kamu sebagai pemilik.

## 3. Bukti hak sumber (bukan asumsi)

Footer resmi binbaz.org.sa — tertera di semua halaman termasuk halaman fatwa ini — berbunyi:

> «جميع الحقوق محفوظة والنقل متاح لكل مسلم بشرط ذكر المصدر»
> "Seluruh hak cipta dilindungi, dan penyalinan diperbolehkan bagi setiap Muslim **dengan syarat menyebutkan sumber**."

Bukti: footer https://binbaz.org.sa/fatwas/3785, dicek **2026-10-22**. Berdasarkan izin tertulis ini, registry sumber Bin Baz diperbarui menjadi `PERMITTED_WITH_ATTRIBUTION` (dengan kutipan + URL bukti + tanggal cek tercatat), materi diberi `rights_status=CLEARED`, dan kewajiban atribusi diterapkan: URL sumber asli tersimpan dan tampil di detail publik. Dua sumber lain (Ibnu Utsaimin, Al-Albani) **tetap `UNVERIFIED`** — belum ada bukti izin tertulis yang dicek untuk keduanya.

## 4. Perbaikan importer (akar masalah kemarin)

Importer gagal impor langsung dari VM karena tiga sebab berlapis, semuanya sudah diperbaiki dan ditambah test regresi:

1. **DNS lokal memberi fake-IP 198.18.x** → SSRF guard ditulis ulang berlapis: skema wajib https, literal IP ditolak, host wajib cocok dengan domain/subdomain di `source_registry`, redirect diikuti manual dengan validasi ulang tiap hop; pemeriksaan resolved-IP hanya pada mode direct tanpa proxy. Fetch memakai `httpx` dengan `trust_env=True` (menghormati proxy).
2. **Entri IPv6 dalam kurung di `no_proxy` VM merusak parser proxy httpx** (`Invalid port: ':1]'`) → entri semacam itu disaring saat fetch.
3. **CA egress proxy tidak ada di bundle certifi** → verifikasi SSL memakai `SSL_CERT_FILE`/bundle CA sistem (verifikasi tetap aktif, tidak dimatikan).

Dua job impor awal yang gagal tercatat apa adanya di `acquisition_jobs` sebelum perbaikan berhasil.

## 5. Hasil pengujian terbaru

**pytest: 24 passed, 0 failed** (16 pengujian awal + 8 baru: allowlist domain registry, subdomain lolos via proxy, literal IP tertolak walau ada proxy, skema non-https tertolak, fetch proxy + redirect manual tervalidasi, redirect ke IP privat tertolak, filter `no_proxy`, konteks SSL sistem). Verifikasi publik setelah terbit: daftar materi publik = 1, detail memuat Arab + terjemahan + label AI persis, pencarian Arab/Indonesia menemukan materi, halaman web detail merespons 200, dashboard admin menunjukkan 1 `PUBLISHED_AI` dan 0 temuan CRITICAL.

## 6. Sisa keterbatasan (jujur)

- **Transkripsi audio belum ada** — 2 kandidat pilot (Ibnu Utsaimin via alathar.net, Al-Albani via al-albany.com) masih menunggu; hak keduanya juga belum terverifikasi.
- **6 menu admin** (Processing, AI Translation, Publication, Reports, AI Settings, System Settings) masih halaman status.
- **MFA TOTP** baru sebatas kolom `mfa_secret`, belum ditegakkan.
- Bilingual editor bersifat telaah (belum ada edit segmen); pencarian memakai normalisasi + pencocokan teks, belum FTS native PostgreSQL.
- docker-compose & Alembic **belum dieksekusi** ke PostgreSQL sungguhan (VM tidak punya Docker/Postgres); dev berjalan di SQLite dengan model yang sama.
- Materi terbit baru **1** dan bukan Thaharah (lihat koreksi di §2) — target pilot 30 materi Thaharah belum mulai karena URL kandidat pertamanya ternyata berisi fatwa lain; perlu daftar URL kandidat Thaharah yang benar dari binbaz.org.sa untuk pilot berikutnya.
