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
  ZAK: { name_id: "Zakat", name_ar: "الزكاة" },
  SWM: { name_id: "Puasa", name_ar: "الصوم" },
  HAJ: { name_id: "Haji & Umrah", name_ar: "الحج والعمرة" },
};

/** Urutan tampil bab yang dikenal; awalan lain menyusul alfabetis. */
const BAB_ORDER = ["THA", "SHL", "JNZ", "ZAK", "SWM", "HAJ"];

export function babPrefixOf(code?: string | null): string {
  const m = /^([A-Za-z]+)/.exec(code || "");
  return m ? m[1].toUpperCase() : "LAIN";
}

/** Nama bab dari awalannya saja — dipakai chip meta halaman materi
    (PR arah desain tahap 1) tanpa harus mengelompokkan ulang topik. */
export function babNameOfPrefix(prefix: string): string {
  const info = BAB_INFO[prefix];
  return info?.name_id || (prefix === "LAIN" ? "Bab lainnya" : prefix);
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
