# Pengembangan Pustaka Ilmu — Tahap 1–4

Tanggal pengerjaan: 24 Oktober 2026. Branch: `feat/stabilization-content-scale`.

## Hasil dan batas pekerjaan

Kode untuk empat tahap sudah tersedia dalam branch ini. Pengujian dilakukan di lingkungan terpisah; database dan situs produksi belum dimutasi. Tidak ada klaim bahwa 30 materi telah terbit di situs live. Push/merge memerlukan akses tulis GitHub yang benar-benar tersedia di sesi kerja.

### 1. Stabilisasi

- Token tantangan MFA ditolak sebagai sesi akses; akun nonaktif ditolak saat login; pendaftaran ulang MFA aktif harus melalui penonaktifan dengan kode valid.
- Persetujuan publikasi menyimpan SHA-256 snapshot isi, sumber, atribusi, referensi, dan klasifikasi. Keputusan terbaru berlaku; perubahan snapshot memerlukan persetujuan ulang. Persetujuan lama tidak otomatis dipercaya.
- Edit segmen atau metadata mengembalikan materi ke `ADMIN_REVIEW`, sehingga versi yang berubah tidak langsung tampil publik.
- Gate menolak demo, terjemahan kosong/duplikat/tidak selaras, teks Arab tanpa segmen lengkap, temuan kritis, dan referensi faktual tanpa bukti. Audit dasar dijalankan atas teks terkini.
- Temuan heuristik nonkritis dapat ditelaah admin dengan alasan, terikat hash isi; bukan tombol untuk mengabaikan temuan CRITICAL. Label belum ditelaah manusia pada terjemahan tetap berlaku.
- CORS dibatasi ke origin konfigurasi, secret produksi divalidasi, endpoint `/ready` mengecek database, dan verifikasi MFA ikut rate limit login.
- Compose mengganti web placeholder dengan build nyata; API dan worker memakai image berisi kedua paket; Redis/PostgreSQL punya healthcheck, volume persisten, scheduler, dan urutan migrasi sebelum startup. PostgreSQL/Redis tidak diekspos ke internet.
- Backup harian terjadwal melalui Celery beat; volume backup dibagi API/worker. Backup PostgreSQL memakai URI tanpa driver SQLAlchemy, file sementara, dan timeout. Backup SQLite diuji integritas serta isi hasil pemulihannya.
- Frontend diperbarui ke Next.js 15.5.28 dan PostCSS yang telah diperbaiki. Dynamic route mengikuti cara akses parameter yang sesuai. Build Next dan adapter Cloudflare Pages berhasil di lingkungan pengembangan. Adapter `next-on-pages` sendiri deprecated; migrasi OpenNext perlu pekerjaan deployment terpisah.

### 2. Pengelolaan konten

Admin dapat menambah/mengubah ulama, topik, dan persoalan; mengaitkan judul/ulama/topik/persoalan pada editor; memverifikasi kelengkapan sumber serta bukti izin; dan menangani koreksi pembaca. Pembatasan peran, validasi relasi, penolakan hierarki topik siklik, serta pencatatan aktivitas ada di backend. Penghapusan permanen massal tidak ditambahkan.

Laporan publik hanya diterima untuk materi terbit dan segmen yang benar-benar miliknya. Status penanganan: PENDING → IN_REVIEW → RESOLVED/DISMISSED, dengan catatan keputusan di audit log; laporan tertutup harus dibuka kembali sebelum mengganti keputusan akhirnya.

### 3. Pilot 30 materi

`database/seeds/pilot/thaharah_30.json` berisi 30 fatwa bernomor unik dari halaman resmi Bin Baz yang berhasil diambil pada tanggal pengerjaan. Mencakup sepuluh topik THA-01 sampai THA-10, dengan teks pertanyaan dan articleBody utuh, catatan sumber yang tercantum, URL, checksum, serta pasangan terjemahan Indonesia berbantuan AI. Ini snapshot artikel teks resmi, bukan klaim transkripsi seluruh rekaman audionya.

- 30 materi / 60 pasangan segmen; tidak ada status telaah manusia yang dikarang.
- Tiga materi ditandai heuristik negasi: fatwa 1551, 1538, dan 1179. Kata `ما` pada konteks pertanyaan/relatif dapat memicu false positive; pemeriksaannya diserahkan kepada admin, bukan dihapus agar laporan terlihat bersih.
- Bukti penyalinan bersyarat atribusi dari footer sumber disimpan bersama snapshot. Importer tetap memberi `rights_status=UNKNOWN` sampai admin mengonfirmasi bukti izin.
- Rincian hadis yang tidak tercantum tidak ditambahkan. Catatan kitab dipertahankan sebagaimana sumber, tanpa mengklaim telah memverifikasi cetakan atau nomor hadis secara mandiri.
- `scripts/import_pilot.py` mengimpor draf secara idempoten menurut nomor fatwa; tidak menimpa materi lama dan tidak menerbitkan otomatis. Opsi `--verify-online` mencocokkan teks dan bukti izin terhadap halaman yang dibuka ulang sebelum menulis batch.

### 4. Kesiapan pertumbuhan koleksi

- Katalog berbasis query SQL dengan pagination 24 materi untuk pembaca, 25 untuk admin; batas maksimum endpoint 100. Filter ulama/topik/jenis konten berjalan di server. Beranda hanya mengambil enam materi terbaru.
- Proyeksi pencarian menyertakan judul Arab/Indonesia, nama ulama, teks Arab, terjemahan, serta nama/kode topik, dengan normalisasi dan sinonim. Proyeksi dibangun setelah impor, terjemahan, edit segmen, dan perubahan metadata; ada skrip backfill.
- Serialisasi kartu dibatasi beberapa query per halaman; uji 1.000 materi sintetis memastikan halaman 24 materi, total, akhir halaman, dan jumlah query tidak bertambah mengikuti jumlah koleksi. Ini uji query/kebenaran, bukan benchmark ribuan pengguna serentak.
- Antrean database menolak identitas pekerjaan duplikat, mengklaim pekerjaan secara kondisional, menyimpan percobaan, menerapkan retry dengan jeda meningkat dan batas tiga percobaan, serta menandai penerjemahan BLOCKED ketika key belum ada. Tidak ada publikasi otomatis.
- Celery beat memicu drain berkala. Task RUNNING yang terputus bersama worker perlu diperiksa operator sebelum dipulihkan; tidak otomatis dijalankan ulang tanpa kepastian karena dapat menduplikasi biaya eksternal.
- Pipeline penerjemahan menolak hasil kosong/jumlah segmen salah dan mempertahankan versi lama ketika provider gagal. Glosarium disertakan, dan usage token dicatat bila provider menyediakannya.

## Menjalankan pada database yang sudah ada

1. Buat backup serta uji pemulihannya pada database terpisah.
2. Jalankan `PYTHONPATH=services/api python -m app.migrate` menggunakan `DATABASE_URL` tujuan yang benar. Ini migrasi aditif, bukan reset atau seed ulang produksi. Jalur ini juga membuat tabel baru untuk database yang sejarahnya menggunakan SQL dump, tanpa bergantung pada revision Alembic lama yang tidak konsisten.
3. Jalankan `python scripts/reindex.py` untuk koleksi lama. Indeks trigram PostgreSQL opsional tersedia di komentar migrasi 0006 dan memerlukan izin extension `pg_trgm`.
4. Jalankan `python scripts/import_pilot.py --verify-online` jika ingin memuat pilot. Materi yang nomor fatwanya sudah ada dilewati. Tidak ada perubahan materi existing.
5. Pada editor admin, periksa Arab/terjemahan dan bukti izin, selesaikan temuan yang ditandai, kemudian approve dan publish melalui gate.
6. Uji API dan halaman live sebelum mengalihkan trafik.

## Deployment container

Isi environment privat yang diperlukan: POSTGRES_PASSWORD, JWT_SECRET minimal 32 karakter acak, ADMIN_PASSWORD kuat, NEXT_PUBLIC_API_BASE (URL HTTPS publik backend), CORS_ORIGINS, dan konfigurasi AI jika otomatisasi penerjemahan hendak diaktifkan. Jangan commit environment atau token.

```
docker compose --env-file .env -f infrastructure/docker-compose.yml up --build -d
```

Compose memiliki service migrasi satu kali. Pada instalasi baru, jalankan seed dasar secara eksplisit setelah database siap. Pada database existing, jangan seed ulang admin produksi. Port API/web dibind ke localhost; pasang reverse proxy HTTPS di host. Konfigurasi trusted proxy harus sesuai jaringan sendiri. Rate limiter saat ini masih in-memory per proses, sehingga deployment beberapa replica memerlukan limiter terpusat sebelum skala trafik besar.

Backup harian dalam volume lokal belum merupakan backup off-site. Penyalinan terenkripsi ke penyimpanan terpisah, pemantauan ruang, retensi, serta jadwal uji restore tetap perlu disiapkan operator. Docker tidak tersedia di lingkungan pengembangan ini; build dan startup container perlu dikonfirmasi di CI/host tujuan.

## Verifikasi

Lihat `docs/HASIL-VERIFIKASI-TAHAP-1-4.md` untuk hasil eksekusi terakhir. Workflow GitHub Actions telah ditambahkan untuk API, frontend, dan build container. Keberadaan workflow bukan bukti CI remote telah berjalan.
