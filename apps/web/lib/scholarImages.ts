import type { Scholar } from "@pustaka/shared-types";
import { scholarName } from "./api";

/**
 * Peta ulama → foto lambang profil (PR #6).
 *
 * Keputusan user (25 Okt 2026): monogram hijau dua huruf Arab dinilai
 * terlalu generik. Untuk Bin Baz dipakai foto kain syimagh merah-putih —
 * ciri khas beliau — dari berkas yang dipilih & dikirim user sendiri
 * (dipotong persegi dari area motif bersih, tanpa teks merek).
 * Ulama yang belum punya foto tetap memakai monogram sebagai cadangan.
 *
 * PR #9 (permintaan user 27 Okt 2026): Ibnu Utsaimin memakai foto tumpukan
 * kitab Arab klasik di rak, Al-Albani memakai foto meja belajar (kitab
 * berjajar, buku terbuka, jam, kopi) — keduanya kiriman user, tanpa makhluk
 * bernyawa, dipotong persegi. Kunci peta adalah slug dari name_id API:
 * "Ibnu Utsaimin" → "ibnu-utsaimin", "Al-Albani" → "al-albani".
 */
const SCHOLAR_IMAGES: Record<string, string> = {
  "bin-baz": "/images/scholars/binbaz-shemagh.jpg",
  "ibnu-utsaimin": "/images/scholars/utsaimin-books.jpg",
  "al-albani": "/images/scholars/albani-desk.jpg",
};

export function scholarSlug(s?: Scholar | null): string {
  if (!s) return "";
  return scholarName(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function scholarImage(s?: Scholar | null): string | undefined {
  return SCHOLAR_IMAGES[scholarSlug(s)];
}
