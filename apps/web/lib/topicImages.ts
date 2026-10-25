import type { MaterialSummary, Topic } from "@pustaka/shared-types";
import poolData from "../public/images/topics/pool/pool.json";

/**
 * Peta topik → foto sampul (PR #3).
 *
 * ATURAN USER (25 Okt 2026): foto TIDAK BOLEH memuat makhluk bernyawa
 * (manusia — termasuk tangan/anggota tubuh — maupun hewan) dan TIDAK BOLEH
 * ada foto duplikat antar-topik. Semua foto di bawah adalah benda, air,
 * arsitektur, atau lanskap; diverifikasi visual satu per satu oleh asisten
 * sebelum tayang (berkas lokal di public/images/topics/, bukan hotlink).
 * - rehal.webp (hero), tayamum.webp, mandi.jpg dipertahankan dari set awal
 *   karena lolos aturan (mushaf di rehal; bukit pasir; kepala pancuran).
 * - 8 foto lain diganti total pada 25 Okt 2026 dari Pexels (lihat kredit).
 * Atribusi lengkap dirender di footer aplikasi (ReaderShell).
 *
 * PR #5: tiap topik kini punya POOL 8 foto — indeks 0 = sampul di atas,
 * indeks 1..7 = foto tambahan dari public/images/topics/pool/pool.json
 * (berkas <slug>-2.jpg s.d. <slug>-8.jpg, semua Pexels, teraudit dengan
 * aturan yang sama: tanpa makhluk bernyawa, tanpa duplikat). Permukaan
 * per-materi memilih foto dari pool secara deterministik (hash id materi),
 * permukaan per-topik tetap memakai sampul indeks 0.
 */
export interface TopicImage {
  src: string;
  alt: string;
  /** Kata Arab untuk sampul cadangan (fallback) dan kartu topik. */
  ar: string;
  creditName: string;
  creditUrl: string;
  creditSource: "Pexels" | "Unsplash";
  /** object-position CSS agar potongan foto tetap bagus di bingkai lanskap. */
  position?: string;
}

const P = "https://www.pexels.com/photo/";
const U = "https://unsplash.com";

export const TOPIC_IMAGES: Record<string, TopicImage> = {
  "THA-01": {
    src: "/images/topics/air.webp",
    alt: "Foto permukaan air jernih di atas kerikil",
    ar: "الماء",
    creditName: "Doğan Alpaslan Demir",
    creditUrl: `${P}close-up-of-a-clear-water-surface-with-pebbles-at-the-bottom-25288197/`,
    creditSource: "Pexels",
    position: "50% 50%",
  },
  "THA-02": {
    src: "/images/topics/bejana.webp",
    alt: "Foto bejana tanah liat antik di atas meja",
    ar: "الآنية",
    creditName: "caffeine",
    creditUrl: `${P}a-group-of-three-clay-pots-sitting-on-a-table-28379912/`,
    creditSource: "Pexels",
    position: "50% 40%",
  },
  "THA-03": {
    src: "/images/topics/istinja.webp",
    alt: "Foto wastafel keramik putih dengan keran logam",
    ar: "الاستنجاء",
    creditName: "Curtis Adams",
    creditUrl: `${P}stainless-steel-faucet-on-white-ceramic-sink-10486250/`,
    creditSource: "Pexels",
    position: "50% 50%",
  },
  "THA-04": {
    src: "/images/topics/wudu.webp",
    alt: "Foto air mengalir dari keran ke bak cuci",
    ar: "الوضوء",
    creditName: "Karolina Grabowska",
    creditUrl: `${P}water-flows-from-the-tap-to-sink-6256/`,
    creditSource: "Pexels",
    position: "50% 45%",
  },
  "THA-05": {
    src: "/images/topics/pembatal.webp",
    alt: "Foto makro keran krom dengan tetesan air",
    ar: "نواقض الوضوء",
    creditName: "Zulfugar Karimov",
    creditUrl: `${P}close-up-of-water-faucet-dripping-in-bathroom-34295406/`,
    creditSource: "Pexels",
    position: "50% 50%",
  },
  "THA-06": {
    src: "/images/topics/khuf.webp",
    alt: "Foto sepasang sepatu bot kulit cokelat dan ikat pinggang kulit",
    ar: "المسح على الخفين",
    creditName: "José Martin Segura Benites",
    creditUrl: `${P}brown-leather-boots-and-a-belt-lying-on-a-white-surface-26851198/`,
    creditSource: "Pexels",
    position: "50% 40%",
  },
  "THA-07": {
    src: "/images/topics/mandi.jpg",
    alt: "Foto pancuran air stainless di kamar mandi",
    ar: "الغسل",
    creditName: "Christa Grover",
    creditUrl: `${P}stainless-steel-shower-head-inside-bathroom-1909656/`,
    creditSource: "Pexels",
    position: "50% 40%",
  },
  "THA-08": {
    src: "/images/topics/tayamum.webp",
    alt: "Foto bukit pasir keemasan",
    ar: "التيمم",
    creditName: "Junhan Foong",
    creditUrl: U,
    creditSource: "Unsplash",
    position: "50% 50%",
  },
  "THA-09": {
    src: "/images/topics/najis.jpg",
    alt: "Foto makro tetesan air memercik di permukaan air biru",
    ar: "النجاسة وإزالتها",
    creditName: "Jason Walters",
    creditUrl: `${P}close-up-of-a-drop-of-water-splashing-5039451/`,
    creditSource: "Pexels",
    position: "50% 50%",
  },
  "THA-10": {
    src: "/images/topics/masjid-agung.webp",
    alt: "Foto menara dan kubah Masjid Süleymaniye saat senja",
    ar: "الحيض والنفاس",
    creditName: "Sümeyye Başbil",
    creditUrl: `${P}suleymaniye-mosque-minaret-at-sunset-32525281/`,
    creditSource: "Pexels",
    position: "50% 35%",
  },
};

/** Sampul umum: Al-Qur'an di atas rehal (juga hero Beranda). */
export const DEFAULT_IMAGE: TopicImage = {
  src: "/images/topics/rehal.webp",
  alt: "Foto Al-Qur'an di atas rehal di interior masjid",
  ar: "الطهارة",
  creditName: "Defrino Maasy",
  creditUrl: `${P}qur-an-on-wooden-stand-in-a-mosque-interior-28823663/`,
  creditSource: "Pexels",
  position: "50% 45%",
};

export const HOME_HERO = DEFAULT_IMAGE;

/* ------------------------------------------------------------------ */
/* Pool foto per topik (PR #5)                                          */
/* ------------------------------------------------------------------ */

interface PoolEntry {
  file: string;
  topic: string;
  subject: string;
  source: string;
  photographer: string;
  photoUrl: string;
}

const POOL_ENTRIES = poolData as PoolEntry[];

/** Nomor urut dari nama berkas pool, mis. "air-7.jpg" → 7. */
function poolIndexOf(file: string): number {
  const m = /-(\d+)\.[a-z]+$/i.exec(file);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Pool foto per topik: indeks 0 = sampul lama (TOPIC_IMAGES), indeks 1..7 =
 * foto pool n=2..8 dari pool.json (urut nomor berkas menaik).
 */
export const TOPIC_POOLS: Record<string, TopicImage[]> = (() => {
  const pools: Record<string, TopicImage[]> = {};
  for (const [code, cover] of Object.entries(TOPIC_IMAGES)) {
    const extras = POOL_ENTRIES.filter((e) => e.topic === code)
      .sort((a, b) => poolIndexOf(a.file) - poolIndexOf(b.file))
      .map<TopicImage>((e) => ({
        src: `/images/topics/pool/${e.file}`,
        alt: `Foto ${e.subject.charAt(0).toLowerCase()}${e.subject.slice(1)}`,
        ar: cover.ar,
        creditName: e.photographer,
        creditUrl: e.photoUrl,
        creditSource: e.source === "Unsplash" ? "Unsplash" : "Pexels",
      }));
    pools[code] = [cover, ...extras];
  }
  return pools;
})();

/** Hash FNV-1a 32-bit atas string — deterministik lintas kunjungan & platform. */
export function hashMaterialId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Foto pool untuk satu materi: indeks = hash(id materi) mod jumlah foto pool.
 * Tanpa id → sampul indeks 0. Materi yang sama selalu mendapat foto yang sama.
 */
export function poolImageForMaterial(code: string, materialId?: string | null): TopicImage {
  const pool = TOPIC_POOLS[code];
  if (!pool || pool.length === 0) return imageForTopicCode(code);
  if (!materialId) return pool[0];
  return pool[hashMaterialId(materialId) % pool.length];
}

/** Kredit unik untuk footer (satu entri per berkas foto, termasuk seluruh pool). */
export const PHOTO_CREDITS: TopicImage[] = Array.from(
  new Map(
    Object.values(TOPIC_POOLS)
      .flat()
      .concat(DEFAULT_IMAGE)
      .map((i) => [i.src, i]),
  ).values(),
);

/** Pencocokan cadangan berdasarkan kata kunci nama topik (bila kode tak dikenal). */
const KEYWORD_RULES: Array<[RegExp, string]> = [
  [/tayamum|tayammum/i, "THA-08"],
  [/pembatal|nawaqidh|nawaqid/i, "THA-05"],
  [/wudu|wudhu|ablution/i, "THA-04"],
  [/mandi|ghusl|junub|janabah/i, "THA-07"],
  [/najis|najasa/i, "THA-09"],
  [/haid|nifas|istihadhah|istihadah/i, "THA-10"],
  [/khuf|mengusap|kaus kaki|perban/i, "THA-06"],
  [/istinja|buang hajat/i, "THA-03"],
  [/bejana|peralatan|aniyah/i, "THA-02"],
  [/air|siwak|bersuci|thaharah|taharah/i, "THA-01"],
];

export function imageForTopicCode(code?: string | null): TopicImage {
  if (code && TOPIC_IMAGES[code]) return TOPIC_IMAGES[code];
  return DEFAULT_IMAGE;
}

export function imageForTopic(t?: Topic | null): TopicImage {
  if (!t) return DEFAULT_IMAGE;
  if (t.code && TOPIC_IMAGES[t.code]) return TOPIC_IMAGES[t.code];
  const name = `${t.name_id || ""} ${t.name || ""} ${t.title || ""}`;
  for (const [re, code] of KEYWORD_RULES) if (re.test(name)) return TOPIC_IMAGES[code];
  return DEFAULT_IMAGE;
}

/** Kode topik dari objek topik: kode persis dulu, lalu kata kunci nama. */
function codeForTopic(t?: Topic | null): string | null {
  if (!t) return null;
  if (t.code && TOPIC_IMAGES[t.code]) return t.code;
  const name = `${t.name_id || ""} ${t.name || ""} ${t.title || ""}`;
  for (const [re, code] of KEYWORD_RULES) if (re.test(name)) return code;
  return null;
}

/** Kode topik materi: dari topik pertamanya; tanpa topik → kata kunci judul. */
function codeForMaterial(m: MaterialSummary): string | null {
  const t = (m.topics && m.topics[0]) || m.topic || null;
  const fromTopic = codeForTopic(t);
  if (fromTopic) return fromTopic;
  const title = `${m.title_id || ""} ${m.title || ""}`;
  for (const [re, code] of KEYWORD_RULES) if (re.test(title)) return code;
  return null;
}

/**
 * Foto materi: dipilih deterministik dari pool topiknya berdasarkan hash
 * id materi (materi sama → foto sama di semua permukaan). Topik tak dikenal
 * → sampul umum.
 */
export function imageForMaterial(m?: MaterialSummary | null): TopicImage {
  if (!m) return DEFAULT_IMAGE;
  const code = codeForMaterial(m);
  if (!code) return DEFAULT_IMAGE;
  return poolImageForMaterial(code, m.id);
}

/** Kata Arab sampul untuk topik (API sering mengembalikan name_ar kosong). */
export function topicArabic(t?: Topic | null): string {
  if (t?.name_ar) return t.name_ar;
  if (t?.code && TOPIC_IMAGES[t.code]) return TOPIC_IMAGES[t.code].ar;
  return imageForTopic(t).ar;
}
