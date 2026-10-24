# Hasil verifikasi pengembangan tahap 1–4

Tanggal: 24 Oktober 2026. Semua pemeriksaan di bawah dilakukan di lingkungan pengembangan/staging terpisah.

| Pemeriksaan | Hasil |
|---|---|
| Baseline sebelum perubahan | 36 tes lulus |
| Regresi API dan integrasi sesudah perubahan | 54 tes lulus, termasuk 18 tes tambahan |
| TypeScript | `npm run typecheck` lulus |
| Build produksi Next.js 15.5.28 | Lulus |
| Build Cloudflare Pages | `npx @cloudflare/next-on-pages@1` lulus; empat fungsi edge dan aset statis dihasilkan |
| Audit dependensi produksi frontend | 0 temuan pada `npm audit --omit=dev` |
| Audit termasuk dependensi pengembangan | 3 entri moderate terkait rantai parser selector Tailwind; 0 high/critical |
| Validasi snapshot pilot | 30 nomor fatwa unik, 60 pasangan segmen, checksum cocok, 10 topik |
| Buka ulang sumber pilot | Seluruh 30 halaman dicocokkan lagi dengan teks snapshot dan bukti atribusi sumber sebelum impor staging |
| Impor pilot staging | 30 draf diimpor; pengulangan impor dilewati, bukan diduplikasi |
| Pemisahan publik/admin | Staging memiliki 30 draf + 1 demo, katalog publik 0; detail draf publik 404 |
| Uji katalog 1.000 materi sintetis | 24 item pada halaman pertama, 16 pada halaman terakhir, total benar, maksimal 5 SELECT untuk satu halaman |
| Migrasi existing | Aditif, dapat diulang, baris persetujuan lama dipertahankan dengan hash kosong sehingga perlu persetujuan ulang |
| Backup dan restore SQLite | Integrity check OK; jumlah materi hasil pemulihan sesuai database asal |
| Antrean | Dedup, klaim kondisional, retry terbatas, BLOCKED tanpa API key diuji |
| Pemeriksaan antarmuka browser | Belum selesai: Chromium tidak tersedia dan unduhan browser gagal; tidak mengklaim QA visual/klik lulus |
| Docker/PostgreSQL/Redis runtime | Belum dieksekusi karena Docker tidak tersedia; workflow CI build ditambahkan |
| Situs/database produksi | Tidak diubah dan belum diverifikasi ulang |
| Push GitHub | Uji push ditolak: `could not read Username for https://github.com`; koneksi akun belum menyediakan kredensial Git ke sesi terminal dan tool repositori belum terekspos |
| Merge dan CI GitHub remote | Belum dilakukan; tidak diklaim berhasil |

Pemeriksaan angka/negasi bersifat heuristik dan tidak membuktikan ketepatan fikih maupun kesahihan hadis. Tiga draf tetap menyimpan temuan yang memerlukan telaah admin. Tidak ada nomor hadis, cetakan kitab, atau persetujuan manusia yang dibuat-buat untuk melengkapi kolom.

## Tindakan saat akses deployment tersedia

1. Kirim branch ke GitHub dan buat pull request; jalankan CI, termasuk container.
2. Backup database produksi dan lakukan migrasi aditif; backfill proyeksi pencarian.
3. Muat pilot sebagai draf dan telaah tiga temuan; konfirmasi bukti izin per sumber.
4. Uji tampilan serta alur klik pada mobile/desktop, lalu publikasikan materi yang disetujui.
5. Jalankan stack backend di host yang selalu aktif; aktifkan key AI dan backup off-site bila tersedia.
