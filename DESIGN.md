# Arah desain Pustaka Ilmu

> **Pembaruan PR #3 (umpan balik pengguna atas UI live pasca-PR #2):** arah minimalis PR #2 dinilai pengguna menghilangkan ikon profesional, kesan aplikasi mobile, dan foto per pembahasan. PR #3 memulihkan arah visual yang pernah disetujui pengguna (22 Okt 2026 — prototipe v2: terang, hangat, fotografis; kartu radius besar, bayangan lembut, kolom pencarian membulat/pill, kartu gambar besar, navigasi bawah pill melayang) dan mempertahankannya tetap rapi, bukan dekorasi acak. Yang berlaku sekarang:
> - Set ikon SVG internal konsisten (`components/icons.tsx`, gaya goresan) di navigasi, tombol, kartu, dan status kosong/error. Tanpa dependensi baru.
> - Shell mobile-native: navigasi bawah pill melayang (Beranda, Cari, Topik, Ulama, Tersimpan) + top bar desktop berikon; kartu `rounded-3xl` berbayangan lembut; tombol & pencarian pill.
> - Foto sampul per topik (`lib/topicImages.ts`, berkas lokal terverifikasi di `public/images/topics/`, atribusi di footer): kartu katalog, hero halaman materi, kartu topik. Cadangan bergaya (gradasi + ikon + kata Arab) hanya bila foto gagal dimuat.
> - Tipografi diperkecil di semua halaman publik (judul turun ±satu tingkat; isi pembaca ±15,2px bawaan, line-height 1,8, paragraf dirender dengan jarak nyata) dan jarak antarbagian dilonggarkan; kontrol A+/A− pembaca tetap bekerja dari basis baru.
> - Kemenangan aksesibilitas PR #2 dipertahankan: skip link, outline fokus, `aria-current`, kontras ≥4,5:1, reduced-motion.
> Dokumen di bawah ini adalah catatan arah PR #2 dan tetap berlaku untuk identitas warna, font, dan batas integritas konten.

Acuan produk: `docs/MASTER-PROMPT-V2.md`, bagian 4. Referensi peninjauan: [Anti Slop v3.2.22](https://github.com/miqdadbadjuber/anti-slop/tree/v3.2.22), khususnya core, UI, human, layoutmobile, dan copywriting. Anti Slop adalah filter kualitas, bukan tema atau paket komponen aplikasi. Tidak ada dependensi runtime baru atau installer global yang dijalankan.

## Identitas dan kebutuhan pembaca

Perpustakaan fikih untuk pembaca Indonesia yang perlu menemukan persoalan, membaca teks Arab beserta terjemahan, dan menelusuri sumber. Suasana tenang, jelas, dan dekat dengan kegiatan membaca. Pertahankan hijau tua, emerald, gading, dan emas dari identitas yang sudah ada. Jangan memakai foto wajah ulama atau membuat klaim jumlah koleksi dari jumlah kandidat impor.

Plus Jakarta Sans dipertahankan untuk kesinambungan antarmuka Latin. Noto Naskh Arabic dengan jarak baris 2.1 untuk harakat dan teks Arab. Judul Arab menggunakan `lang="ar"` dan `dir="rtl"`; isi Indonesia tetap LTR. Warna teks sekunder diperkuat menjadi #52625B agar terbaca di atas putih, gading, dan surface. Emas hanya sebagai aksen di atas hijau tua atau latar tombol dengan teks hijau tua.

## Hierarki dan alasan visual

- Pencarian adalah tindakan utama beranda. Form berlabel, bukan dua kartu promosi yang mengulang tujuan navigasi.
- Thaharah menjadi satu blok berwarna karena merupakan fokus koleksi awal. Tautannya memakai ID topik dari API; pencarian kata kunci menjadi fallback.
- Materi disajikan sebagai entri katalog dengan judul, Arab, ringkasan, dan ulama. Dua kolom pada desktop menjaga panjang baris; satu kolom di ponsel. Tidak perlu kotak dan bayangan pada setiap entri.
- Topik menjadi daftar singkat dan ulama menjadi daftar nama bilingual. Komposisi berbeda mengikuti isi, bukan variasi dekoratif.
- Nama produk berbentuk teks; tidak membuat logo baru. Navigasi memakai kata yang menyatakan tujuan, tanda aktif, dan `aria-current`.
- Sudut 6–8 px mengelompokkan panel/form. Bayangan, blur, dan pola geometris tidak menjadi lapisan default. Badge tetap dipakai untuk status nyata seperti Demo.
- ENERGY 2: kontras judul dan satu blok koleksi. RHYTHM 3: pencarian, katalog, kemudian direktori topik/ulama. MOTION 1: umpan balik hover/fokus tanpa animasi berulang. Preferensi reduced-motion dihormati.

## Batas penerapan

Putaran ini mencakup beranda, shell pembaca, komponen bersama, katalog pencarian, dan kontrol pembaca. Admin mewarisi perbaikan komponen dasar; alur editorial dan struktur dashboard tidak didesain ulang. Sumber, proses publikasi, dan isi ilmiah tidak berubah. Konten API kosong atau gagal harus ditampilkan sebagai keadaan tersebut, bukan diganti materi rekaan.

## Pemeriksaan sebelum penggabungan

Build dan typecheck; cek breakpoint 320, 375, 768, 1024, 1440; reflow pada ukuran teks 200%; pencarian dan filter; navigasi aktif; fokus keyboard dan skip link; loading, kosong, error, coba lagi; pilihan bahasa dan laporan koreksi. Dokumentasikan yang benar-benar diuji beserta keterbatasannya di `docs/VERIFIKASI-UI-ANTISLOP.md`.
