import type { MaterialSummary, Topic } from "@pustaka/shared-types";

/**
 * Peta topik → foto sampul (PR #3).
 *
 * Foto asli non-figuratif bernada hangat, diverifikasi satu per satu
 * (berkas lokal di public/images/topics/, bukan hotlink).
 * - 8 foto pertama kali dipakai pada prototipe v2 yang disetujui pengguna
 *   (22 Okt 2026): hero rehal & wudu & air dari Pexels; arsitektur/interior
 *   masjid & gurun dari Unsplash.
 * - mandi.jpg dan najis.jpg diunduh langsung dari CDN Pexels untuk PR #3
 *   dan diverifikasi sebagai berkas gambar valid.
 * Atribusi lengkap dirender di footer aplikasi (ReaderShell).
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
    alt: "Foto air dituang ke dalam gelas",
    ar: "الماء",
    creditName: "Ksenia Chernaya",
    creditUrl: `${P}a-person-pouring-water-in-the-glass-7299859/`,
    creditSource: "Pexels",
    position: "50% 35%",
  },
  "THA-02": {
    src: "/images/topics/bejana.webp",
    alt: "Foto pilar berlapis emas dan lengkung masjid",
    ar: "الآنية",
    creditName: "Ridzuan Naina",
    creditUrl: U,
    creditSource: "Unsplash",
    position: "20% 50%",
  },
  "THA-03": {
    src: "/images/topics/istinja.webp",
    alt: "Foto interior masjid berkubah kayu",
    ar: "الاستنجاء",
    creditName: "Rumman Amin",
    creditUrl: U,
    creditSource: "Unsplash",
    position: "50% 30%",
  },
  "THA-04": {
    src: "/images/topics/wudu.webp",
    alt: "Foto seseorang berwudu di tempat wudu masjid",
    ar: "الوضوء",
    creditName: "Yaşar Başkurt",
    creditUrl: `${P}man-performing-ablution-at-outdoor-water-taps-36492440/`,
    creditSource: "Pexels",
    position: "50% 30%",
  },
  "THA-05": {
    src: "/images/topics/wudu.webp",
    alt: "Foto tempat wudu masjid",
    ar: "نواقض الوضوء",
    creditName: "Yaşar Başkurt",
    creditUrl: `${P}man-performing-ablution-at-outdoor-water-taps-36492440/`,
    creditSource: "Pexels",
    position: "85% 50%",
  },
  "THA-06": {
    src: "/images/topics/khuf.webp",
    alt: "Foto ruang shalat masjid berkarpet merah",
    ar: "المسح على الخفين",
    creditName: "Ahmed Sherif",
    creditUrl: U,
    creditSource: "Unsplash",
    position: "50% 70%",
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
    alt: "Foto tangan dicuci di bawah keran emas",
    ar: "النجاسة وإزالتها",
    creditName: "Polina Zimmerman",
    creditUrl: `${P}person-washing-hands-4008500/`,
    creditSource: "Pexels",
    position: "50% 45%",
  },
  "THA-10": {
    src: "/images/topics/masjid-agung.webp",
    alt: "Foto interior masjid agung dengan mihrab dan lampu gantung",
    ar: "الحيض والنفاس",
    creditName: "Ridzuan Naina",
    creditUrl: U,
    creditSource: "Unsplash",
    position: "50% 40%",
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

/** Kredit unik untuk footer (tanpa duplikat foto wudu THA-04/THA-05). */
export const PHOTO_CREDITS: TopicImage[] = Array.from(
  new Map(Object.values(TOPIC_IMAGES).concat(DEFAULT_IMAGE).map((i) => [i.src, i])).values(),
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

/** Foto sampul materi: dari topik pertamanya; tanpa topik → kata kunci judul; terakhir → sampul umum. */
export function imageForMaterial(m?: MaterialSummary | null): TopicImage {
  if (!m) return DEFAULT_IMAGE;
  const t = (m.topics && m.topics[0]) || m.topic || null;
  if (t) {
    if (t.code && TOPIC_IMAGES[t.code]) return TOPIC_IMAGES[t.code];
    const byName = imageForTopic(t);
    if (byName !== DEFAULT_IMAGE) return byName;
  }
  const title = `${m.title_id || ""} ${m.title || ""}`;
  for (const [re, code] of KEYWORD_RULES) if (re.test(title)) return TOPIC_IMAGES[code];
  return DEFAULT_IMAGE;
}

/** Kata Arab sampul untuk topik (API sering mengembalikan name_ar kosong). */
export function topicArabic(t?: Topic | null): string {
  if (t?.name_ar) return t.name_ar;
  if (t?.code && TOPIC_IMAGES[t.code]) return TOPIC_IMAGES[t.code].ar;
  return imageForTopic(t).ar;
}
