# Inventaris awal menuju 100–1.000 materi per syaikh

Snapshot sumber dibuat 24 Oktober 2026. Berkas `.json.gz` adalah JSON UTF-8 terkompresi, bukan database produksi.

| Syaikh | Kandidat unik dari sumber | Halaman/teks diperiksa satu per satu | Snapshot Arab lengkap tersimpan | Terjemahan baru | Terbit baru |
|---|---:|---:|---:|---:|---:|
| Bin Baz | 1.000 | 100 | 100 | 0 | 0 |
| Ibnu Utsaimin | 1.000 | 100 | 0 | 0 | 0 |
| Al-Albani | 1.000 | 100 | 0 | 0 | 0 |

- Bin Baz: 82 halaman daftar kategori Thaharah yang benar-benar dibaca; seluruh 1.000 kandidat berasal dari kategori tersebut. Bukti izin penyalinan dengan atribusi dari footer disimpan; verifikasi operasional admin tetap diperlukan sebelum publikasi.
- Ibnu Utsaimin: sitemap resmi berisi banyak jalur kategori untuk materi yang sama. Deduplikasi UUID menghasilkan 16.783 identitas tersedia pada saat penemuan; 1.000 dipilih, mengutamakan 627 judul/jalur yang mengindikasikan Thaharah. Indikasi judul bukan penetapan topik ilmiah. Seratus detail diperiksa melalui endpoint publik yang digunakan aplikasi resmi; teks yang kosong atau tidak tersedia tidak dihitung sebagai berhasil.
- Al-Albani: 23 halaman pencarian/daftar seri resmi dibaca untuk mendapat 1.000 identitas. Seratus halaman transkrip diperiksa; pengambilan tidak bergantung pada transkripsi AI audio. Koleksi cadangan mencakup topik di luar Thaharah, tetap berlabel `UNCLASSIFIED` bila belum diklasifikasi.
- Ibnu Utsaimin/Al-Albani: snapshot menyimpan metadata, checksum, dan status ketersediaan teks; tidak menyimpan seluruh transkrip sebelum status izin penyalinan jelas di registry.
- Kandidat yang hanya ditemukan di sitemap/daftar tidak diberi status halaman terverifikasi. Nomor sumber/UUID, bukan banyaknya URL atau jalur kategori, menentukan jumlah kandidat.
- Tidak ada terjemahan Indonesia, persetujuan manusia, nomor hadis, atau status terbit yang dibuat untuk menggenapkan target.

`discover_corpus.py` menemukan inventaris, `verify_corpus.py` memeriksa halaman, `load_corpus.py` memuatnya ke tabel admin. Ketiganya tidak menerbitkan materi. Detail penerapan: `docs/PERTUMBUHAN-KOLEKSI.md`.
