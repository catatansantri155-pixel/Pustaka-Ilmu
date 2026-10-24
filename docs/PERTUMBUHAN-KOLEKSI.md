# Pertumbuhan koleksi per syaikh: 100 → 250 → 500 → 1.000

Tanggal: 24 Oktober 2026. Basis integrasi yang diperiksa: `20fbadb33a32d8b538c0214eeb0cadaa14e82a42`.

## Yang telah dikerjakan

1. Commit integrasi tahap 1–4 di `main` sudah dibaca. Akses tulis GitHub tersedia. GitHub Actions pada repositori tidak memiliki run pada saat pemeriksaan; tes lokal dijalankan, bukan mengklaim CI remote lulus.
2. Inventaris sumber nyata: **1.000 identitas unik untuk setiap syaikh** (3.000 total). **100 sumber per syaikh** diperiksa sampai teks Arab sumber dapat dibaca (300 total). Jumlah tersebut bukan jumlah terjemahan maupun publikasi.
3. **100 snapshot teks Arab Bin Baz** disertakan bersama bukti atribusi sumber. Ibnu Utsaimin dan Al-Albani tetap metadata/checksum karena status izin penyalinan lengkap belum terverifikasi di aplikasi. Pernyataan manfaat/akses situs tidak otomatis dijadikan izin redistribusi.
4. Staging terpisah berhasil memuat 3.000 kandidat dan mengimpor **100 draf Arab Bin Baz**; impor ulang tidak membuat duplikat. Tidak ada perubahan pada database produksi melalui sesi ini, tidak ada terjemahan baru, dan tidak ada publikasi otomatis.
5. Halaman admin baru `/admin/corpus`: target per syaikh, jeda/aktifkan, jumlah kandidat/halaman/snapshot/draf/terjemahan/terbit, serta batch 25 pemeriksaan/impor/terjemahan. Inventaris memiliki pagination dan tautan sumber/draf.
6. Antrean membedakan identitas sumber, mematuhi sisa target dan pekerjaan aktif, tidak menerjemahkan ulang materi terbit/editorial, dan menahan sumber tanpa izin serta penerjemahan tanpa API key. Target awal 100, dijeda sampai admin mengaktifkan. Batas target 1.000 per syaikh.

## Pemeriksaan

- Baseline integrasi: 54 tes lulus.
- Sesudah perubahan: **72 tes lulus**, termasuk deduplikasi UUID/slug, pemisahan metadata dari materi, batas sumber resmi/robots/redirect, parser tiga situs, izin sumber, impor idempoten, target/jeda/kuota, dan paket inventaris.
- `npm run typecheck`: lulus.
- `npm run build`: lulus; `/admin/corpus` dibangun.
- Staging: migrasi → seed dasar → muat 3.000 kandidat → impor 100 draf → impor ulang → endpoint admin dan katalog publik. Draf Arab 100; terjemahan/publikasi baru 0; katalog publik tetap 0 pada staging bersih.
- UI klik/visual, worker Redis/Celery nyata, serta database produksi belum diverifikasi melalui koneksi lingkungan ini. Jangan menyamakan pengujian SQLite lokal dengan bukti deployment PostgreSQL/worker produksi.

## Pemasangan pada server yang sudah menjalankan aplikasi

Jalankan dari root repositori dengan environment database tujuan yang benar. Jangan memakai database contoh sebagai database produksi.

```bash
# Backup database terlebih dahulu, lalu pasang kode pada host backend.
.venv/bin/python -m pip install -r services/api/requirements.txt
PYTHONPATH=services/api .venv/bin/python -m app.migrate
.venv/bin/python scripts/load_corpus.py

# Opsional: muat sampai 100 kandidat Bin Baz yang sudah memiliki snapshot Arab.
# Materi dengan identitas sumber yang sama dilewati; materi lama tidak ditimpa.
.venv/bin/python scripts/load_corpus.py --ingest-binbaz 100
```

`app.migrate` membuat dua tabel baru secara aditif dan mengaktifkan RLS pada PostgreSQL. Inventaris admin tidak diberi akses Data API untuk `anon`/`authenticated`; backend memakai peran database yang sesuai dan pemeriksaan RBAC FastAPI. Alternatif SQL PostgreSQL: `database/migrations/postgres/0008_corpus_inventory.sql`. Restart API dan worker setelah kode backend diperbarui. Deployment frontend saja tidak memasang endpoint atau tabel backend.

Aplikasi membaca `.env` relatif terhadap working directory; tetapkan `DATABASE_URL` dan environment lain secara eksplisit bila skrip dijalankan dari root sementara file environment server berada di direktori lain. Jangan mencetak atau mengirim kredensial ke log/commit.

## Pemrosesan berikutnya

1. Buka **Admin → Pertumbuhan Koleksi**. Pastikan nama ulama/registry cocok, jumlah inventaris 1.000 masing-masing, dan target awal 100.
2. Periksa izin registry Ibnu Utsaimin/Al-Albani beserta bukti sumber sebelum mengizinkan penyimpanan teks lengkap. Kandidat tetap terlihat sebagai metadata ketika izin belum jelas.
3. Aktifkan rencana syaikh. Jalankan batch pemeriksaan/impor dan pantau **Processing → Antrean Konten**. Tahap memakai kuota yang berbeda: halaman terverifikasi untuk pemeriksaan, jumlah materi untuk impor, dan pasangan terjemahan lengkap untuk penerjemahan.
4. Konfigurasikan penyedia AI pada backend. Tanpa key, tombol penerjemahan tidak membuat pekerjaan seolah-olah sudah berjalan. Judul dan segmen diterjemahkan sebagai draf, bukan jawaban fikih baru.
5. Selesaikan temuan, kelengkapan sumber, dan persetujuan operasional admin sesuai gate sebelum menerbitkan. Label belum ditelaah manusia tetap berlaku; keputusan ilmiah tidak dihasilkan dari sekadar kelulusan audit angka/negasi.
6. Setelah 100 materi benar-benar selesai, naikkan target 250, 500, lalu 1.000. Kandidat cadangan tidak otomatis menjadi koleksi publik.

CLI untuk menambah/memeriksa sumber dengan pembatasan satu permintaan/detik/host:

```bash
.venv/bin/python scripts/discover_corpus.py --limit 1000
.venv/bin/python scripts/verify_corpus.py --scholar binbaz --limit 100
.venv/bin/python scripts/verify_corpus.py --scholar uthaymeen --limit 100
.venv/bin/python scripts/verify_corpus.py --scholar albani --limit 100
.venv/bin/python scripts/load_corpus.py
```

Penemuan ulang dapat mengganti snapshot penemuan lokal; untuk mempertahankan hasil verifikasi lama, gunakan direktori keluaran baru lalu muat ulang ke database: loader tidak menurunkan status kandidat yang sudah terverifikasi menjadi sekadar ditemukan. Verifikasi yang berulang melewati 100 sumber yang sudah berhasil, sehingga target 100 yang sama tidak memboroskan permintaan. Snapshot ditulis secara atomik.

## Batas akses sesi

Endpoint backend yang tercantum pada skrip terbaru (`api.catatansantri.com`) merespons 503 pada pemeriksaan awal dari lingkungan ini; ini bukan bukti bahwa database atau seluruh situs hilang. Pemeriksaan katalog pada domain API lama ditolak oleh tinjauan persetujuan otomatis karena dinilai di luar cakupan dan tidak diulangi. Supabase telah dipasang pengguna saat pengerjaan, tetapi tool proyek/SQL belum muncul di runtime sesi ini. Tanpa akses database/host produksi dan key AI, pekerjaan produksi tidak diklaim sudah diterapkan.
