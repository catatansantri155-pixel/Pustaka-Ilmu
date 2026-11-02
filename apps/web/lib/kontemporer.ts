import type { Topic } from "@pustaka/shared-types";

/**
 * Bagian "Fikih Kontemporer" di Beranda (permintaan user 29 Okt 2026;
 * dibangun 2 Nov 2026 setelah prasyaratnya terpenuhi: jilid Muamalah &
 * Jual Beli tuntas terbit 1.000/1.000).
 *
 * Isi bagian ini BUKAN bab baru dan BUKAN materi baru: ia mengelompokkan
 * materi Syaikh Bin Baz yang SUDAH terbit (gerbang hak: hanya Bin Baz,
 * PERMITTED_WITH_ATTRIBUTION) menurut tema transaksi masa kini, mengikuti
 * peta resmi di docs/Peta-Fikih-Kontemporer-BinBaz.md. Tiap kelompok
 * menaut ke tujuan yang sudah ada di aplikasi: halaman topik
 * (/cari?topic_id=…, dirujuk lewat KODE topik lalu diselesaikan ke id dari
 * data API) atau pencarian katalog (/cari?q=…) dengan kata kunci yang
 * terverifikasi presisinya terhadap data live.
 *
 * ATURAN LABEL (keputusan user 29 Okt 2026, keras): Syaikh Bin Baz wafat
 * pada 1999 — beliau TIDAK membahas kripto, dompet digital/paylater
 * spesifik, kartu kredit, atau sukuk. Kelompok yang menjembatani produk
 * modern dibingkai sebagai KAIDAH UMUM beliau dan wajib berlabel jelas
 * "kaidah umum, bukan fatwa produk spesifik". Dilarang memberi judul
 * seolah beliau berfatwa tentang produk tertentu.
 */
export interface KontemporerLink {
  /** Teks tombol/tautan pada kartu. */
  label: string;
  kind: "topic" | "search";
  /** Untuk kind "topic": kode topik API (mis. "MUA-01"). */
  topicCode?: string;
  /** Untuk kind "search": kata kunci katalog. */
  query?: string;
}

export interface KontemporerGroup {
  id: string;
  title: string;
  /** Istilah Arab khas tema, tampil sebagai overlay di gambar kartu. */
  name_ar: string;
  description: string;
  /**
   * Gambar tema kartu di public/images/kontemporer/<slug>.jpg — satu
   * gambar khas per kelompok, dibuat lewat Gemini Pro user (permintaan
   * user 2 Nov 2026) dengan aturan gambar aplikasi: TANPA makhluk
   * bernyawa dan TANPA duplikat antar-kelompok.
   */
  image: string;
  links: KontemporerLink[];
}

export const KONTEMPORER_GROUPS: KontemporerGroup[] = [
  {
    id: "bank-riba-pinjaman",
    image: "/images/kontemporer/bank-riba.jpg",
    title: "Bank, Riba & Pinjaman",
    name_ar: "الربا والقروض",
    description:
      "Hukum bekerja dan menyimpan uang di bank, bunga bank, dan utang-piutang — klaster pembahasan transaksi beliau yang terbesar dan terkuat.",
    links: [
      { label: "Topik Riba & Penukaran Uang", kind: "topic", topicCode: "MUA-01" },
      { label: "Topik Utang & Pinjaman", kind: "topic", topicCode: "MUA-04" },
    ],
  },
  {
    id: "saham-bursa-investasi",
    image: "/images/kontemporer/saham.jpg",
    title: "Saham, Bursa & Investasi",
    name_ar: "الأسهم",
    description:
      "Kriteria saham yang boleh dan yang terlarang, hukum saham bank, ikut penawaran saham perusahaan terbuka, dana investasi bank, dan zakat saham.",
    links: [{ label: "Cari materi saham", kind: "search", query: "saham" }],
  },
  {
    id: "asuransi",
    image: "/images/kontemporer/asuransi.jpg",
    title: "Asuransi: Komersial & Takaful",
    name_ar: "التأمين",
    description:
      "Asuransi komersial dan asuransi kooperatif (takaful), dirinci per produk: jiwa, kendaraan, kesehatan, dan barang impor.",
    links: [{ label: "Cari materi asuransi", kind: "search", query: "asuransi" }],
  },
  {
    id: "uang-valuta-sharf",
    image: "/images/kontemporer/uang-valuta.jpg",
    title: "Uang Kertas, Valuta & Penukaran (Sharf)",
    name_ar: "الصرف",
    description:
      "Kedudukan uang kertas sebagai alat nilai, syarat penukaran antar mata uang agar tidak menjadi riba, dan hukum berdagang mata uang.",
    links: [{ label: "Cari materi mata uang", kind: "search", query: "mata uang" }],
  },
  {
    id: "cicilan-tawarruq",
    image: "/images/kontemporer/cicilan-tawarruq.jpg",
    title: "Cicilan, Kredit Barang & Tawarruq",
    name_ar: "التقسيط والتورق",
    description:
      "Jual beli cicilan dengan tambahan harga dan tawarruq — kaidah akad yang paling dekat dengan pola kredit barang masa kini.",
    links: [
      { label: "Cari materi cicilan", kind: "search", query: "cicilan" },
      { label: "Cari materi tawarruq", kind: "search", query: "tawarruq" },
    ],
  },
  {
    id: "gharar-judi-undian",
    image: "/images/kontemporer/gharar-judi.jpg",
    title: "Gharar, Judi, Lotre & Undian",
    name_ar: "الميسر والغرر",
    description:
      "Larangan gharar dalam jual beli, hukum judi dan lotre, termasuk undian berhadiah dengan kupon belanja yang marak hari ini.",
    links: [{ label: "Cari materi judi & undian", kind: "search", query: "judi" }],
  },
  {
    id: "penghasilan-pekerjaan",
    image: "/images/kontemporer/penghasilan.jpg",
    title: "Penghasilan & Pekerjaan",
    name_ar: "الكسب",
    description:
      "Pekerjaan dan penghasilan yang halal dan yang haram, termasuk bekerja di lembaga ribawi, suap, dan arisan antarpegawai.",
    links: [{ label: "Topik Penghasilan Haram", kind: "topic", topicCode: "MUA-24" }],
  },
  {
    id: "kaidah-produk-modern",
    image: "/images/kontemporer/kaidah-modern.jpg",
    title: "Kaidah Uang & Utang untuk Produk Modern",
    name_ar: "قواعد النقود والديون",
    description:
      "Syaikh Bin Baz (w. 1999) tidak berfatwa tentang kripto, dompet digital, atau paylater — produk itu muncul sesudah beliau wafat. Yang ditautkan di sini adalah kaidah umum beliau tentang kedudukan uang dan utang sebagai bahan memahami produk modern: kaidah umum, bukan fatwa produk spesifik.",
    links: [{ label: "Kaidah kedudukan uang kertas", kind: "search", query: "uang kertas" }],
  },
];

/** Selesaikan satu tautan kelompok menjadi href aplikasi. */
export function kontemporerHref(link: KontemporerLink, topics: Topic[]): string {
  if (link.kind === "topic" && link.topicCode) {
    const t = topics.find((x) => (x.code || "").toUpperCase() === link.topicCode);
    if (t) return `/cari?topic_id=${encodeURIComponent(t.id)}`;
    // Topik belum termuat dari API: jatuh ke grup bab Muamalah di /topik.
    return "/topik#MUA";
  }
  return `/cari?q=${encodeURIComponent(link.query || "")}`;
}

/** Parameter katalog (limit=1) untuk menghitung total materi satu tautan. */
export function kontemporerCountPath(link: KontemporerLink, topics: Topic[]): string | null {
  if (link.kind === "topic" && link.topicCode) {
    const t = topics.find((x) => (x.code || "").toUpperCase() === link.topicCode);
    if (!t) return null;
    return `/api/catalog/materials?limit=1&topic_id=${encodeURIComponent(t.id)}`;
  }
  if (link.kind === "search" && link.query) {
    return `/api/catalog/materials?limit=1&q=${encodeURIComponent(link.query)}`;
  }
  return null;
}
