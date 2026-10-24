# MASTER PROMPT V2.0
## AUDIT, REFACTORING, PENYEMPURNAAN UI/UX, PENGAYAAN DATA & PENGEMBANGAN SISTEM PUSTAKA ILMU

**Nama Aplikasi:** PUSTAKA ILMU
**Website:** https://pustaka-ilmu.pages.dev/
**Jenis:** Perpustakaan Digital Fatwa dan Khazanah Keilmuan Islam
**Pendekatan:** Mobile-First, iOS-Inspired, AI-Powered Knowledge Library
**Bahasa Utama:** Indonesia
**Bahasa Sumber:** Arab
**Fokus Awal:** Thaharah
**Versi Pengembangan:** 2.0
**Strategi:** Improve Existing Application — Do Not Rebuild Unnecessarily

---

# BAGIAN 1 — INSTRUKSI PALING PENTING

Anda adalah tim pengembangan senior yang terdiri atas:

- Senior Full-Stack Engineer
- Software Architect
- Senior UI/UX Designer
- iOS Interface Designer
- Database Architect
- AI Engineer
- Arabic NLP Engineer
- Search System Engineer
- Data Acquisition Engineer
- Islamic Scholarly Data Architect
- Quality Assurance Engineer
- Cybersecurity Engineer
- DevOps Engineer

Tugas Anda adalah melakukan AUDIT MENYELURUH, MEMPERBAIKI, MERAPIKAN, MENYEMPURNAAN, dan MENGEMBANGKAN aplikasi PUSTAKA ILMU yang sudah tersedia.

**INI BUKAN PERMINTAAN UNTUK MEMBUAT APLIKASI BARU DARI NOL.**

Aplikasi sudah mempunyai website dan kemungkinan struktur frontend, backend, serta database yang telah dibangun.

Pertama-tama, pahami seluruh proyek yang ada.

JANGAN:

- Menghapus fitur yang sudah berfungsi.
- Mengganti teknologi tanpa kebutuhan teknis yang jelas.
- Merombak database secara destruktif.
- Menghapus data atau riwayat yang telah tersimpan.
- Mengganti nama aplikasi.
- Mengubah keputusan konsep ilmiah yang sudah ditetapkan.
- Membuat konten fatwa fiktif.
- Menampilkan tombol yang tidak berfungsi.
- Mengisi statistik menggunakan angka palsu.
- Mengklaim suatu integrasi telah berhasil jika belum diuji.

Pertahankan kode yang baik dan refactor hanya bagian yang memang memerlukan peningkatan.

Tujuannya menghasilkan aplikasi yang lebih lengkap, rapi, stabil, cepat, akurat, dan nyaman digunakan.

# BAGIAN 2 — AUDIT APLIKASI YANG SUDAH ADA

Sebelum menulis kode baru, lakukan pemeriksaan:

1. Struktur repository.
2. Framework frontend.
3. Framework backend jika tersedia.
4. Database dan ORM.
5. Koneksi API.
6. Environment variables.
7. Authentication.
8. Sistem routing.
9. Seluruh halaman publik.
10. Panel admin.
11. Sistem pencarian.
12. Sistem koleksi ulama.
13. Sistem kategori persoalan.
14. Sistem penerjemahan AI.
15. Sistem referensi.
16. Penyimpanan konten.
17. Status publikasi.
18. Deployment Cloudflare Pages.
19. Mobile responsiveness.
20. Error logging.

Periksa website publik:

https://pustaka-ilmu.pages.dev/

Perhatikan kemungkinan masalah yang perlu diverifikasi, termasuk halaman yang berhenti pada kondisi "Memuat data…".

Cari akar masalah sebenarnya menggunakan inspeksi source code, browser runtime, network request, API response, database query, dan deployment logs yang tersedia.

Jangan menganggap masalah pasti berasal dari backend atau database tanpa bukti.

Jika ditemukan error, perbaiki penyebabnya dan tambahkan error handling.

Hasil audit harus membedakan:

- Sudah berjalan dengan baik.
- Berjalan tetapi perlu diperbaiki.
- Belum diimplementasikan.
- Menggunakan placeholder.
- Mengalami error.
- Membutuhkan konfigurasi eksternal.

Setelah audit selesai, lanjutkan implementasi perbaikan berdasarkan prioritas. Jangan berhenti hanya pada laporan.

# BAGIAN 3 — VISI PRODUK FINAL

PUSTAKA ILMU merupakan perpustakaan digital untuk mempelajari fatwa, kitab, tulisan, dan rekaman ilmiah para ulama.

Tahap pertama berfokus pada tiga ulama:

1. Syaikh Abdul Aziz bin Baz.
2. Syaikh Muhammad bin Shalih al-Utsaimin.
3. Syaikh Muhammad Nashiruddin al-Albani.

Tujuannya memudahkan masyarakat Indonesia memahami materi berbahasa Arab melalui terjemahan Indonesia lengkap, tanpa kehilangan sumber asli dan identitas ilmiahnya.

Aplikasi harus menjawab kebutuhan berikut:

"Di mana saya bisa membaca pembahasan asli seorang ulama beserta terjemahan Indonesianya?"

"Apa saja fatwa tiga ulama mengenai satu persoalan?"

"Dalil apa yang digunakan?"

"Di kitab mana pembahasan ini terdapat?"

"Bagaimana cara menemukan hadis dan penilaiannya?"

"Bagaimana cara mempelajari seluruh pembahasan satu topik secara berurutan?"

Aplikasi bukan sistem pembuat fatwa baru.

AI hanya boleh melakukan pencarian, ekstraksi, transkripsi, penerjemahan, klasifikasi, pencocokan referensi, dan ringkasan editorial yang diberi label.

# BAGIAN 4 — REDESIGN UI/UX SECARA MENYELURUH

## 4.1 Arah desain

Terapkan desain iOS-inspired premium yang clean, elegan, ringan, modern, dan profesional.

Gunakan pendekatan seperti aplikasi iOS modern dengan:

- Rounded cards.
- Floating navigation.
- Soft shadows.
- Subtle borders.
- Spacious layout.
- Micro-interactions.
- Smooth transitions.
- Skeleton loading.
- Elegant typography.
- Clear content hierarchy.
- Consistent spacing.
- Premium iconography.

Jangan meniru seluruh tampilan Apple secara literal. Bangun identitas visual Pustaka Ilmu sendiri dengan kualitas antarmuka setara aplikasi iOS premium.

## 4.2 Color system

Gunakan:

Primary Dark Green: #103D32

Primary Emerald: #176B53

Background Ivory: #FAF9F6

White: #FFFFFF

Soft Gold: #D6B979

Text Primary: #17201D

Text Secondary: #697570

Border: #E8EAE6

Surface Light: #F2F5F1

Gunakan warna secara konsisten melalui design tokens.

Warna utama hijau tidak boleh mendominasi seluruh layar secara berlebihan.

Gunakan mayoritas background putih dan ivory.

Gunakan emas sebagai aksen kecil, bukan warna utama untuk semua komponen.

## 4.3 Tipografi

Gunakan font Latin modern dengan keterbacaan tinggi.

Untuk teks Arab, gunakan font Unicode yang memiliki dukungan harakat dan tata letak RTL yang baik, misalnya Noto Naskh Arabic atau alternatif yang telah diuji.

Ukuran dan line-height teks Arab harus lebih lapang daripada teks Latin agar mudah dibaca.

Pastikan:

- Tidak ada teks terpotong.
- Tidak ada heading terlalu kecil.
- Tidak ada card dengan isi bertumpuk.
- Tidak ada overflow horizontal.
- Semua teks responsif.
- Tombol mudah disentuh dengan jari.
- Kontras memenuhi standar aksesibilitas.

## 4.4 Larangan visual

Jangan menggunakan foto wajah syaikh pada desain aplikasi.

Sebagai pengganti, gunakan:

- Ikon kitab.
- Kaligrafi sederhana.
- Ilustrasi manuskrip.
- Foto rak kitab.
- Detail arsitektur Islam.
- Motif geometris yang minimal.
- Ilustrasi pembelajaran.
- Ornamen kecil yang tidak mengganggu teks.

Hindari desain terlalu ramai dan foto dekoratif yang tidak berkaitan dengan konten.

# BAGIAN 5 — REDESIGN BERANDA

Bangun beranda mobile dengan struktur:

### Header

- Logo Pustaka Ilmu.
- Salam singkat.
- Subtitle: "Temukan ilmu dari sumbernya."
- Tombol notifikasi jika sistem notifikasi tersedia.
- Akses ke pengaturan.

### Search utama

Search bar besar dengan placeholder:

"Cari hukum, fatwa, ulama, atau persoalan..."

Tambahkan tombol filter.

Search harus benar-benar terhubung ke database.

### Dua jalur utama

Buat dua card dengan prioritas visual seimbang:

**Jelajahi Ulama**

Pengguna menemukan seluruh materi berdasarkan ulama tertentu.

**Jelajahi Persoalan**

Pengguna menemukan pembahasan berdasarkan tema atau pertanyaan.

### Featured Collection

Tampilkan koleksi unggulan:

"Thaharah — Panduan Memahami Hukum Bersuci"

Gunakan gambar atau ilustrasi yang relevan dan berkualitas.

### Kategori

Tampilkan kategori Thaharah, Shalat, Puasa, Zakat, Akidah, dan Muamalah sesuai kesiapan koleksi.

Jika suatu kategori belum memiliki materi terbit, tampilkan status "Segera hadir" atau sembunyikan sesuai kebijakan produk.

Jangan membuat jumlah koleksi palsu.

### Konten pilihan

Materi terbaru, materi terkait, dan pilihan editorial.

### Lanjutkan membaca

Muncul jika pengguna mempunyai riwayat bacaan.

### Bottom Navigation

Gunakan lima menu:

Beranda — Cari — Pustaka — Audio — Simpan.

Desain floating tab bar dengan safe-area support untuk iPhone.

Tab aktif menggunakan pill hijau atau highlight yang bersih.

# BAGIAN 6 — PERPUSTAKAAN BERDASARKAN ULAMA

Bangun halaman pustaka ulama yang lebih kaya.

Setiap ulama mempunyai halaman:

- Nama lengkap Indonesia.
- Nama Arab.
- Biografi ringkas.
- Biografi lengkap.
- Daftar kitab.
- Fatwa tertulis.
- Rekaman audio.
- Transkrip.
- Penjelasan hadis.
- Kategori pembahasan.
- Pencarian dalam koleksi.
- Daftar sumber primer.

Jangan gunakan foto ulama.

Gunakan monogram Arab, ikon kitab, atau desain identitas yang konsisten.

Tampilkan jumlah materi hanya dari data database yang sebenarnya.

Sediakan filter:

- Semua.
- Fatwa.
- Kitab.
- Audio.
- Artikel.
- Penjelasan hadis.

Untuk kitab, tampilkan struktur:

Kitab → Jilid → Bab → Subbab → Pembahasan.

Pengguna harus dapat membaca kitab secara berurutan.

# BAGIAN 7 — PERPUSTAKAAN BERDASARKAN PERSOALAN

Bangun kategori dan hierarki ilmu.

Tema Thaharah:

1. Air.
2. Bejana.
3. Istinja.
4. Wudu.
5. Pembatal wudu.
6. Mengusap khuf.
7. Mandi wajib.
8. Tayamum.
9. Najis.
10. Haid, nifas, dan istihadhah.

Setiap persoalan mempunyai halaman khusus.

Contoh:

"Apakah makan daging unta membatalkan wudu?"

Halaman menampilkan:

- Judul persoalan.
- Kategori.
- Penjelasan ruang lingkup masalah.
- Daftar fatwa relevan.
- Nama ulama.
- Jenis sumber.
- Status terjemahan.
- Referensi.
- Persoalan terkait.

Jangan menggabungkan pendapat berbeda menjadi satu pendapat kolektif.

Buat relasi issue-to-material sehingga satu persoalan bisa memiliki banyak fatwa.

# BAGIAN 8 — HALAMAN PEMBACA PREMIUM

Bangun ulang halaman pembaca sebagai bagian paling penting dalam aplikasi.

Desain harus nyaman untuk membaca teks panjang.

Gunakan:

- Header minimal.
- Judul jelas.
- Nama ulama.
- Kategori.
- Status terjemahan.
- Bookmark.
- Share.
- Table of contents.
- Pengaturan font.
- Mode membaca.

## Mode Pemula

Menampilkan:

- Terjemahan Indonesia lengkap.
- Ringkasan editorial singkat.
- Penjelasan istilah sulit.
- Referensi yang bisa dibuka.

## Mode Mendalam

Menampilkan:

- Teks Arab asli lengkap.
- Terjemahan Indonesia lengkap.
- Pasangan paragraf Arab–Indonesia.
- Dalil Al-Qur'an.
- Hadis.
- Nukilan kitab.
- Catatan sumber.
- Hubungan dengan materi lain.

Sediakan pilihan tampilan:

1. Arab dan Indonesia berdampingan pada desktop.
2. Arab dan Indonesia berurutan pada mobile.
3. Arab saja.
4. Indonesia saja.

Kedua bahasa wajib tetap tersedia di database.

Untuk audio, sinkronkan transkrip dengan timestamp jika datanya tersedia.

# BAGIAN 9 — SISTEM KONTEN ILMIAH

Setiap materi wajib mempunyai:

- ID permanen.
- Judul Arab.
- Judul Indonesia.
- Identitas ulama.
- Jenis konten.
- Kategori.
- Teks Arab lengkap.
- Terjemahan Indonesia lengkap.
- Identitas sumber.
- URL asli.
- Informasi kitab jika tersedia.
- Referensi ayat.
- Referensi hadis.
- Status kualitas.
- Status publikasi.
- Riwayat revisi.

Pisahkan teks Arab asli, hasil ekstraksi, dan terjemahan.

Jangan mengganti naskah sumber secara diam-diam.

Untuk fatwa, pertanyaan dan jawaban harus dipertahankan lengkap.

Untuk kitab, gunakan unit bab atau subbab yang jelas.

Untuk audio, simpan transkrip Arab dan terjemahan lengkap dari unit rekaman yang diterbitkan.

# BAGIAN 10 — PENGAYAAN DATA DAN KOLEKSI

Jangan hanya memperbaiki tampilan sementara database tetap kosong.

Audit koleksi yang sudah ada.

Identifikasi:

- Jumlah materi sebenarnya.
- Materi yang belum lengkap.
- Sumber tidak valid.
- Terjemahan belum tersedia.
- Materi duplikat.
- Materi tanpa kategori.
- Materi dengan referensi ambigu.
- Materi yang belum boleh dipublikasikan.

Setelah itu buat strategi pengayaan konten.

## Prioritas pertama

Thaharah dari tiga ulama.

Target pilot: 30 materi yang sumbernya dapat ditelusuri.

Mulai dari 5–10 materi untuk pengujian pipeline.

Jangan menambah data fiktif hanya untuk membuat aplikasi terlihat penuh.

## Referensi sumber awal

Bin Baz:
https://binbaz.org.sa/

Ibnu Utsaimin:
https://binothaimeen.net/

Al-Albani:
https://www.al-albany.com/

Semua sumber harus diperiksa kebijakan akses, izin penggunaan, dan hak distribusinya.

Jika belum ada izin untuk menyimpan atau mendistribusikan teks tertentu, simpan metadata dan tautan yang diizinkan.

Jangan melewati proteksi website.

# BAGIAN 11 — PENGUMPULAN KONTEN OTOMATIS

Periksa sistem akuisisi yang sudah ada.

Jika belum tersedia, bangun pipeline:

Source Registry → Discovery → Import → Extraction → Segmentation → Deduplication → AI Translation → Reference Matching → Quality Audit → Admin Approval.

Setiap sumber mempunyai status izin.

Sediakan scheduler dan antrean.

Admin dapat:

- Menambah sumber.
- Mengaktifkan sumber.
- Menonaktifkan sumber.
- Menentukan topik prioritas.
- Menentukan batch size.
- Menentukan jadwal.
- Menjalankan ulang pekerjaan.
- Melihat error.
- Membatalkan pekerjaan.

Gunakan retry terbatas dan idempotency agar tidak terjadi duplikasi.

Untuk PDF scan, gunakan OCR dengan pemeriksaan kualitas.

Untuk rekaman audio, gunakan transkripsi Arab dan timestamp.

Simpan sumber asli sesuai hak penggunaan.

# BAGIAN 12 — AI TRANSLATION V2

Tahap pertama seluruh penerjemahan dilakukan oleh AI.

Pemeriksaan manusia direncanakan untuk versi berikutnya.

Perbaiki sistem penerjemahan agar:

- Mendukung teks panjang.
- Mempertahankan konteks.
- Tidak menghilangkan bagian.
- Tidak mengubah negasi.
- Tidak mengubah istilah hukum.
- Tidak menambahkan dalil.
- Tidak meringkas.
- Tidak mengubah pendapat ulama.
- Mencatat kesalahan dan ketidakpastian.

Simpan pasangan segmen Arab–Indonesia.

Sediakan glossary istilah.

Audit otomatis harus memeriksa:

- Kelengkapan.
- Keselarasan.
- Istilah hukum.
- Angka dan rujukan.
- Negasi.
- Paragraf hilang.
- Kalimat tambahan.
- Kerusakan teks Arab.

Gunakan label:

"Terjemahan AI — Belum Ditelaah Manusia".

Jangan mengganti label tersebut menjadi "terverifikasi ilmiah" hanya karena lolos audit otomatis.

# BAGIAN 13 — REFERENCE ENGINE

Bangun atau sempurnakan pengelolaan referensi.

## Al-Qur'an

Simpan:

- Nama surah.
- Nomor surah.
- Nomor ayat.
- Teks Arab.
- Terjemahan.
- Identitas sumber.
- Edisi terjemahan.

## Hadis

Simpan:

- Matan Arab.
- Terjemahan.
- Sahabat perawi.
- Koleksi hadis.
- Nama kitab.
- Bab.
- Nomor hadis.
- Skema penomoran.
- Derajat.
- Ulama penilai.
- Sumber penilaian.
- Riwayat lain jika ada.

## Kitab

Simpan:

- Judul.
- Penulis.
- Muhaqqiq.
- Penerbit.
- Cetakan.
- Tahun.
- Jilid.
- Halaman.
- Bab.
- Lokasi kutipan.

Jangan membuat nomor atau rujukan berdasarkan tebakan AI.

Pisahkan referensi yang disebut langsung oleh ulama dari referensi tambahan editorial.

# BAGIAN 14 — SEARCH ENGINE V2

Pencarian harus menjadi salah satu keunggulan utama aplikasi.

Dukung:

- Bahasa Indonesia.
- Bahasa Arab.
- Variasi ejaan.
- Sinonim.
- Pencarian judul.
- Pencarian isi.
- Pencarian ulama.
- Pencarian kitab.
- Pencarian hadis.
- Pencarian berdasarkan kategori.

Contoh:

Wudu, wudhu, الوضوء.

Shalat, salat, الصلاة.

Tayamum, tayammum, التيمم.

Gunakan hybrid search secara bertahap.

Tahap pertama:

Full-text search + normalisasi Arab + synonyms.

Tahap lanjutan:

Semantic vector search dengan hasil yang selalu terkait dokumen asli.

Jangan menghasilkan jawaban AI tanpa sumber.

Tampilkan hasil sebagai kartu yang mempunyai:

- Judul.
- Nama ulama.
- Topik.
- Cuplikan relevan.
- Status pemeriksaan.
- Sumber.

Tambahkan autocomplete, histori pencarian lokal, dan filter yang responsif.

# BAGIAN 15 — ADMIN DASHBOARD V2

Panel admin harus menjadi pusat operasional.

Bangun dashboard desktop dengan sidebar:

1. Overview.
2. Source Registry.
3. Acquisition Jobs.
4. AI Processing.
5. Translation Queue.
6. Scholar Library.
7. Issue Library.
8. Materials.
9. Quran References.
10. Hadith References.
11. Book Editions.
12. Bilingual Editor.
13. Quality Audit.
14. Publication Manager.
15. Reports.
16. Settings.

Dashboard menampilkan statistik nyata.

Jika data kosong, tampilkan empty state.

Sediakan monitoring pekerjaan:

- Pending.
- Processing.
- Completed.
- Failed.
- Needs Attention.
- Awaiting Approval.
- Published.

## Editor Bilingual

Desain editor dua kolom.

Kiri: Indonesia.

Kanan: Arab.

Fitur:

- Sinkronisasi segmen.
- Editor teks.
- Compare revisions.
- Detail sumber.
- Daftar dalil.
- Penanda kesalahan.
- Catatan admin.
- Preview pembaca mobile.
- Persetujuan publikasi.

## Publication Gate

Sistem harus memblokir publikasi jika:

- Sumber tidak jelas.
- Hak penggunaan tidak tersedia.
- Teks Arab tidak lengkap.
- Terjemahan tidak lengkap.
- Ada temuan kritis.
- Tidak ada persetujuan admin.

Persetujuan admin V1/V2 adalah keputusan operasional, bukan verifikasi ilmiah manusia.

Sediakan unpublish dan version rollback.

# BAGIAN 16 — FITUR BARU YANG DIREKOMENDASIKAN

Tambahkan fitur yang benar-benar bermanfaat:

### A. Perpustakaan Pribadi

Pengguna bisa menyimpan fatwa, membuat folder koleksi, dan melanjutkan bacaan.

### B. Catatan Pribadi

Pengguna bisa menulis catatan pada materi atau segmen tertentu.

### C. Glosarium Istilah

Istilah Arab seperti najis, hadas, istihadhah, rajih, dan ijma dapat ditekan untuk melihat definisi.

### D. Perbandingan Fatwa

Tampilkan beberapa fatwa mengenai satu persoalan secara berdampingan, tanpa membuat kesimpulan yang tidak didukung sumber.

### E. Pembaca Kitab Berurutan

Pengguna dapat membuka kitab sesuai daftar isi, berpindah bab, dan menandai posisi terakhir.

### F. Audio Library

Player dengan kecepatan putar, background playback jika didukung, penanda waktu, dan transkrip.

### G. Riwayat Bacaan

Simpan posisi membaca dan materi terakhir.

### H. Koreksi Terjemahan

Pengguna dapat melaporkan kemungkinan kesalahan terjemahan.

Laporan masuk antrean admin, bukan langsung mengubah materi publik.

### I. Reading Preferences

Font size, mode Arab–Indonesia, dark mode, dan pengaturan jarak baris.

### J. Related Materials

Sistem menampilkan materi lain berdasarkan topik dan hubungan referensi yang tercatat.

Semua fitur harus menggunakan data nyata dan mekanisme penyimpanan yang benar.

Jangan menambahkan tombol atau menu kosong.

# BAGIAN 17 — OPTIMASI PERFORMA

Periksa dan tingkatkan:

- Loading time.
- Database queries.
- API response.
- Caching.
- Lazy loading.
- Image optimization.
- Bundle size.
- Search latency.
- Mobile rendering.
- Network error handling.

Gunakan skeleton loading dengan batas dan penanganan kesalahan.

Jangan membiarkan pengguna melihat "Memuat data…" tanpa batas waktu ketika API gagal.

Sediakan:

- Retry.
- Empty state.
- Error state.
- Offline state jika PWA mendukung.
- Network status feedback.

Optimalkan seluruh layout untuk iPhone kecil hingga layar desktop.

# BAGIAN 18 — KEAMANAN DAN KEANDALAN

Pertahankan atau implementasikan:

- Authentication.
- Role-based authorization.
- Admin MFA.
- Input validation.
- Rate limiting.
- SQL injection prevention.
- XSS prevention.
- CSRF protection sesuai arsitektur.
- SSRF protection untuk URL importer.
- Secure secrets.
- Audit logs.
- Database backup.
- Rollback.
- Job retry.
- Data validation.
- Cost limits untuk AI.

Jika aplikasi di-deploy pada Cloudflare Pages, evaluasi kebutuhan Cloudflare Functions, Workers, database, dan background jobs sesuai arsitektur sebenarnya.

Jangan mengasumsikan proses Python jangka panjang atau worker antrean dapat berjalan langsung di lingkungan Cloudflare Pages statis.

Jika diperlukan layanan backend terpisah, gunakan layanan yang sesuai dengan stack proyek, dan jelaskan alasan teknisnya.

# BAGIAN 19 — DATABASE REFACTORING

Audit skema database yang sudah ada terlebih dahulu.

Jangan langsung menggantinya.

Jika tabel belum lengkap, tambahkan secara bertahap:

- scholars
- scholar_aliases
- works
- book_editions
- source_registry
- source_assets
- materials
- material_versions
- source_spans
- arabic_segments
- translation_segments
- topics
- issues
- issue_materials
- evidence_mentions
- quran_references
- hadith_records
- hadith_gradings
- citations
- translation_runs
- quality_findings
- acquisition_jobs
- processing_jobs
- publication_approvals
- audit_logs
- bookmarks
- reading_progress
- user_notes
- correction_reports

Buat migrations yang aman.

Sediakan backup sebelum migrasi.

Gunakan UUID atau identitas internal stabil.

Buat foreign keys, constraints, dan indexes.

Jangan menghapus data produksi tanpa persetujuan eksplisit.

# BAGIAN 20 — PENGUJIAN FUNGSIONAL

Lakukan pengujian end-to-end pada alur berikut.

### Skenario 1 — Pengguna mencari masalah

Beranda → Cari → Ketik "wudu" → Hasil relevan → Buka fatwa → Lihat Arab dan Indonesia → Buka sumber.

### Skenario 2 — Pengguna menjelajahi ulama

Beranda → Pustaka → Pilih Bin Baz → Pilih Thaharah → Pilih fatwa → Baca lengkap.

### Skenario 3 — Admin mengimpor fatwa

Login → Source Registry → Import → Ekstraksi → Terjemahan AI → Audit → Menunggu Admin.

### Skenario 4 — Admin menerbitkan materi

Login → Review → Periksa kualitas → Persetujuan → Published AI → Materi tampil publik dengan label.

### Skenario 5 — Kesalahan referensi

AI menemukan rujukan ambigu → Temuan audit → Materi ditahan jika kritis → Admin dapat melihat bukti dan memperbaikinya.

### Skenario 6 — Koreksi publik

Pembaca → Laporkan Kesalahan → Laporan tersimpan → Admin menerima laporan → Revisi tercatat.

# BAGIAN 21 — PRIORITAS PENGERJAAN

Kerjakan dengan urutan berikut.

**PRIORITAS 0 — Audit dan stabilisasi**

Perbaiki error, koneksi data, routing, loading state, dan masalah produksi.

**PRIORITAS 1 — UI/UX**

Rapikan seluruh layar dengan desain premium iOS-inspired yang konsisten.

**PRIORITAS 2 — Database dan konten ilmiah**

Perbaiki struktur materi, sumber, kategori, teks Arab, terjemahan, dan referensi.

**PRIORITAS 3 — Panel admin**

Bangun editor, monitoring AI, quality audit, dan publication manager.

**PRIORITAS 4 — Akuisisi dan penerjemahan**

Hubungkan sumber berizin ke pipeline otomatis.

**PRIORITAS 5 — Search dan pembaca**

Tingkatkan pencarian bilingual serta halaman pembaca lengkap.

**PRIORITAS 6 — Fitur personal**

Bookmark, catatan, riwayat, glosarium, dan pengaturan pembaca.

**PRIORITAS 7 — Testing dan deployment**

Uji semua fitur dan deploy secara aman sesuai konfigurasi proyek.

# BAGIAN 22 — KRITERIA HASIL AKHIR

Hasil yang diharapkan:

- Tampilan jauh lebih clean dan profesional.
- Seluruh halaman konsisten.
- Seluruh tombol yang tampil berfungsi.
- Tidak ada loading tanpa akhir.
- Data aplikasi berasal dari database nyata.
- Sistem pencarian bekerja.
- Navigasi berdasarkan ulama bekerja.
- Navigasi berdasarkan persoalan bekerja.
- Pembaca Arab–Indonesia bekerja.
- Referensi dapat ditelusuri.
- Admin bisa mengelola materi.
- Pipeline AI dapat diuji.
- Konten belum diverifikasi diberi label yang jujur.
- Tidak ada fatwa fiktif.
- Tidak ada statistik fiktif.
- Tidak ada API key terekspos.
- Tidak ada teks terpotong.
- Tidak ada layout bertumpuk.
- Aplikasi nyaman di iPhone dan Android.
- Aplikasi tetap berfungsi di desktop.
- Riwayat dan data lama tetap terjaga.

# BAGIAN 23 — FORMAT LAPORAN SETELAH PENGEMBANGAN

Setelah mengerjakan setiap fase, laporkan:

1. Masalah yang ditemukan.
2. Penyebab masalah.
3. File atau modul yang diperbaiki.
4. Fitur yang ditambahkan.
5. Database migrations yang dibuat.
6. Pengujian yang dijalankan.
7. Pengujian yang berhasil dan gagal.
8. Fitur yang belum tersedia.
9. Integrasi yang memerlukan konfigurasi.
10. Langkah berikutnya.

Jangan hanya mengatakan "sudah selesai".

Berikan bukti berupa kode, hasil pengujian, perubahan database, atau tampilan yang telah diperbarui.

# INSTRUKSI FINAL

MULAI DENGAN MEMERIKSA PROJECT PUSTAKA ILMU YANG SUDAH ADA.

Jangan membuat ulang aplikasi dari nol kecuali ditemukan alasan teknis yang benar-benar mengharuskannya.

Perbaiki semua error yang ditemukan.

Pertahankan struktur dan fungsi yang sudah baik.

Tingkatkan UI/UX agar sesuai standar aplikasi iOS premium yang clean, modern, responsif, dan elegan.

Perluas sistem konten agar mendukung koleksi ilmiah berbahasa Arab dan Indonesia dengan standar referensi yang kuat.

Sempurnakan mesin pengumpulan dan penerjemahan AI, panel admin, pencarian, serta sistem publikasi.

Jadikan aplikasi lebih kaya, mudah digunakan, dan siap berkembang secara bertahap.

**TARGET AKHIR: PUSTAKA ILMU MENJADI PERPUSTAKAAN FATWA DIGITAL BERBAHASA INDONESIA YANG PROFESIONAL, TERSTRUKTUR, TERPERCAYA DALAM PENYAJIAN SUMBER, DAN NYAMAN DIGUNAKAN.**

MULAI AUDIT DAN IMPLEMENTASI SEKARANG.
