# Verifikasi penerapan prinsip Anti Slop

Tanggal: 24 Oktober 2026. Referensi dipatok pada [v3.2.22](https://github.com/miqdadbadjuber/anti-slop/tree/v3.2.22), bukan branch upstream yang dapat berubah. README menjelaskan bahwa Anti Slop adalah filter, bukan tema. Rilis ini sendiri berfokus pada deteksi instalasi plugin; prinsip UI dibaca dari core dan panduan UI, human, layoutmobile, serta copywriting pada tag tersebut.

Implementasi ini mengadaptasi prinsip pada source aplikasi; tidak memasang skill global, mengubah instruksi agent, menyalin installer, atau menambahkan library ke bundle aplikasi. Arah produk berasal dari master prompt yang sudah ada dan dicatat di `DESIGN.md`.

## 1. Hard Gate: belum lulus seluruhnya

PASS pemeriksaan yang dijalankan:

- `npm --prefix apps/web run typecheck`.
- `npm --prefix apps/web run build`, Next.js 15.5.28. Peringatan edge runtime yang membatasi static generation tetap muncul.
- `git diff --check`.
- Server produksi lokal dijalankan. GET `/`, `/cari`, `/pustaka`, `/audio`, `/tersimpan`, `/materi/test`, `/admin/login` semuanya HTTP 200. Rute publik menyertakan target skip link. Ini memeriksa respons HTML, bukan keberhasilan API atau interaksi klien.
- Rasio warna dihitung menggunakan relative luminance WCAG: muted/gading 6.12:1; muted/surface 5.87:1; muted/putih 6.45:1; putih/emerald 6.43:1; hijau tua/emas 6.38:1; emerald/gading 6.11:1. Ini menguji pasangan token yang diubah, bukan audit kontras setiap elemen aplikasi.

BELUM TERVERIFIKASI (R-03, R-32, R-35): pengukuran overflow pada breakpoint, zoom, fokus browser, console JavaScript, dan klik seluruh kontrol. Runtime Playwright tersedia, executable browser tidak ada; percobaan pengunduhan Chromium gagal karena berkas unduhan bukan ZIP yang valid. Tidak ada screenshot atau hasil click-through yang diklaim. Karena itu draft PR belum memenuhi seluruh Delivery Gate upstream.

## 2. Purpose-Gate: alasan keputusan dicatat

Pengurangan kartu, bayangan, pola, dan glyph dekoratif mengikuti kebutuhan membaca. Pencarian menempati urutan pertama, satu blok Thaharah memberi fokus, katalog mengutamakan judul dan sumber. Badge Demo dan metadata AI tetap dipertahankan jika dikirim API. Tidak ada angka koleksi atau testimoni yang dibuat. Alasan warna, tipografi, radius, dan komposisi ada di `DESIGN.md`.

## 3. Quality dan liveliness: pemeriksaan source selesai

ENERGY 2 / RHYTHM 3 / MOTION 1. Warna identitas dan tipografi bilingual dipertahankan. Komposisi beranda berubah antara pencarian, koleksi fokus, katalog, dan direktori. Komponen kosong tidak memakai sparkle; loading menyebut data yang dimuat; error memiliki retry dan role alert. Navigasi memiliki aria-current. Kontrol bahasa/mode membaca menyatakan aria-pressed; laporan koreksi menyatakan aria-expanded dan hasilnya role status. Animasi pulse dihapus dan reduced-motion dihormati.

## 4. Bukti interaksi dan pemeriksaan berikutnya

Tabel berikut merupakan pemeriksaan alur source dan daftar uji browser yang masih harus dijalankan. Semua status browser masih BELUM DIUJI.

| Kontrol | Perilaku yang dihubungkan di source | Status browser |
| --- | --- | --- |
| Pencarian beranda | Submit ke `/cari?q=...`, kueri di-encode | Belum diuji |
| Koleksi Thaharah | ID topik API atau fallback kata kunci | Belum diuji |
| Materi, topik, ulama | Rute detail atau filter sesuai ID API | Belum diuji |
| Navigasi desktop/ponsel | Lima rute yang tersedia; tanda halaman aktif | Belum diuji |
| Skip link | Target `#konten-utama`, fokus outline | Belum diuji |
| Filter katalog | Perubahan ulama/topik mereset offset, memuat API | Belum diuji |
| Pagination | Offset berubah; batas menonaktifkan tombol | Belum diuji |
| Retry | Memanggil pemuatan ulang setelah error | Belum diuji |
| Bahasa dan mode membaca | State dan preferensi tersimpan lokal | Belum diuji |
| Ukuran huruf | Mengubah skala Arab/Indonesia | Belum diuji |
| Simpan dan bagikan | API bookmark atau pesan login; Web Share/clipboard | Belum diuji |
| Laporan koreksi | Buka/tutup, validasi minimal lima karakter, kirim API | Belum diuji |

Sebelum penggabungan: periksa beranda, pencarian, pustaka, pembaca, tersimpan, audio, dan admin pada 320/375/768/1024/1440 px; zoom 200%; keyboard; isi Arab panjang; data kosong; loading; API gagal dan pulih. Pastikan safe area navigasi ponsel tidak menutup kontrol terakhir. Uji clipboard/Web Share pada HTTPS dan perangkat nyata untuk keyboard ponsel.

Tidak ada perubahan basis data, migrasi, isi fatwa, terjemahan, atau aturan publikasi pada PR ini. Perubahan komponen CSS bersama juga memengaruhi tampilan admin, sehingga admin tetap termasuk pemeriksaan visual sebelum penggabungan. Backend produksi dan layanan eksternal belum diuji di putaran UI ini.
