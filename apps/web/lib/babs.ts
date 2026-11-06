import type { Topic } from "@pustaka/shared-types";

/**
 * Pengelompokan topik per BAB inti (PR #11, permintaan user 27 Okt 2026).
 * Bab diturunkan dari awalan kode topik API (THA-01 → bab THA, SHL-03 → SHL,
 * JNZ-* → Jenazah). Bab baru yang muncul dari API otomatis membentuk grupnya
 * sendiri — tanpa perlu mengubah kode — mengikuti urutan BAB_ORDER di bawah,
 * sisanya alfabetis di belakang.
 */
export interface BabGroup {
  prefix: string;
  name_id: string;
  name_ar: string;
  topics: Topic[];
}

const BAB_INFO: Record<string, { name_id: string; name_ar: string }> = {
  THA: { name_id: "Thaharah", name_ar: "الطهارة" },
  SHL: { name_id: "Shalat", name_ar: "الصلاة" },
  JNZ: { name_id: "Jenazah", name_ar: "الجنائز" },
  ZKT: { name_id: "Zakat", name_ar: "الزكاة" },
  PUA: { name_id: "Puasa", name_ar: "الصيام" },
  HAJ: { name_id: "Haji & Umrah", name_ar: "الحج والعمرة" },
  MUA: { name_id: "Muamalah & Jual Beli", name_ar: "المعاملات" },
  NIK: { name_id: "Nikah", name_ar: "النكاح" },
  TAL: { name_id: "Talak & Keluarga", name_ar: "الطلاق والأسرة" },
  MAK: { name_id: "Makanan & Sembelihan", name_ar: "الأطعمة والذبائح" },
  SUM: { name_id: "Sumpah & Nazar", name_ar: "الأيمان والنذور" },
  TIB: { name_id: "Pengobatan & Ruqyah", name_ar: "الطب والتداوي" },
  LIB: { name_id: "Pakaian & Perhiasan", name_ar: "اللباس والزينة" },
  SUR: { name_id: "Gambar & Fotografi", name_ar: "الصور والتصوير" },
};

/** Urutan tampil bab yang dikenal; awalan lain menyusul alfabetis. */
const BAB_ORDER = ["THA", "SHL", "JNZ", "ZKT", "PUA", "HAJ", "MUA", "NIK", "TAL", "MAK", "SUM", "TIB", "LIB", "SUR"];

/**
 * Identitas visual per bab dari prototipe Lovable (motif geometris + hue
 * oklch) — dipakai komponen BabArt. Empat belas bab = empat belas hue unik,
 * tanpa makhluk bernyawa. Awalan tak dikenal memakai motif buku teal.
 */
export type BabMotif = "star8" | "hex" | "arch" | "lattice" | "rosette" | "chevron" | "dome" | "lantern" | "book" | "wave";

const BAB_ART: Record<string, { motif: BabMotif; hue: number }> = {
  THA: { motif: "wave", hue: 200 },
  SHL: { motif: "arch", hue: 175 },
  JNZ: { motif: "lattice", hue: 230 },
  ZKT: { motif: "rosette", hue: 85 },
  PUA: { motif: "lantern", hue: 265 },
  HAJ: { motif: "dome", hue: 55 },
  MUA: { motif: "hex", hue: 145 },
  NIK: { motif: "star8", hue: 15 },
  TAL: { motif: "chevron", hue: 320 },
  MAK: { motif: "book", hue: 110 },
  SUM: { motif: "lantern", hue: 290 },
  TIB: { motif: "wave", hue: 165 },
  LIB: { motif: "hex", hue: 35 },
  SUR: { motif: "dome", hue: 215 },
};

export function artForBabPrefix(prefix: string): { motif: BabMotif; hue: number } {
  return BAB_ART[prefix] || { motif: "book", hue: 175 };
}

export function artForTopicCode(code?: string | null): { motif: BabMotif; hue: number } {
  return artForBabPrefix(babPrefixOf(code));
}

export function babPrefixOf(code?: string | null): string {
  const m = /^([A-Za-z]+)/.exec(code || "");
  return m ? m[1].toUpperCase() : "LAIN";
}

export function groupTopicsByBab(topics: Topic[]): BabGroup[] {
  const map = new Map<string, Topic[]>();
  for (const t of topics) {
    const p = babPrefixOf(t.code);
    const arr = map.get(p);
    if (arr) arr.push(t);
    else map.set(p, [t]);
  }
  const groups: BabGroup[] = [];
  for (const [prefix, ts] of map.entries()) {
    const info = BAB_INFO[prefix];
    groups.push({
      prefix,
      name_id: info?.name_id || (prefix === "LAIN" ? "Bab lainnya" : prefix),
      name_ar: info?.name_ar || "",
      topics: [...ts].sort((a, b) => (a.code || "").localeCompare(b.code || "")),
    });
  }
  groups.sort((a, b) => {
    const ia = BAB_ORDER.indexOf(a.prefix);
    const ib = BAB_ORDER.indexOf(b.prefix);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.prefix.localeCompare(b.prefix);
  });
  return groups;
}
