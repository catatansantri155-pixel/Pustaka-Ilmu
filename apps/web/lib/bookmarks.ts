import { useEffect, useState } from "react";
import type { MaterialSummary, Topic } from "@pustaka/shared-types";

/**
 * Bookmark lokal perangkat (localStorage) — TANPA akun, TANPA login, TANPA API.
 * Tersimpan hanya di browser perangkat ini. Daftar dibaca ulang pada setiap
 * perubahan (event khusus di tab yang sama + event "storage" antar-tab),
 * sehingga penanda pada kartu/detail selalu konsisten setelah reload.
 */
export interface LocalBookmark {
  id: string;
  title_id?: string | null;
  title_ar?: string | null;
  scholar_name?: string | null;
  content_type?: string | null;
  topics?: Array<Pick<Topic, "id" | "code" | "name_id" | "name_ar">> | null;
  at: number;
}

const BOOKMARKS_KEY = "pustaka:bookmarks";
const BOOKMARKS_EVENT = "pustaka:bookmarks-changed";

function read(): LocalBookmark[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(list)) return [];
    return list.filter(
      (x): x is LocalBookmark =>
        !!x && typeof x === "object" && typeof (x as LocalBookmark).id === "string",
    );
  } catch {
    return [];
  }
}

function write(list: LocalBookmark[]): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  } catch {
    /* localStorage tidak tersedia (mode privat dsb.) — abaikan */
  }
  try {
    window.dispatchEvent(new Event(BOOKMARKS_EVENT));
  } catch {
    /* di luar browser */
  }
}

export function getLocalBookmarks(): LocalBookmark[] {
  return read();
}

export function isLocalBookmarked(id: string): boolean {
  return read().some((b) => b.id === id);
}

/** Cuplikan ringkas materi agar daftar Tersimpan bisa dirender tanpa API. */
export function bookmarkSnapshot(m: MaterialSummary): Omit<LocalBookmark, "at"> {
  return {
    id: m.id,
    title_id: m.title_id ?? m.title ?? null,
    title_ar: m.title_ar ?? null,
    scholar_name:
      m.scholar_name ??
      (m.scholar ? m.scholar.name_id || m.scholar.name || null : null),
    content_type: m.content_type ?? m.type ?? null,
    topics: (m.topics || []).map((t) => ({
      id: t.id,
      code: t.code,
      name_id: t.name_id,
      name_ar: t.name_ar,
    })),
  };
}

export function addLocalBookmark(m: MaterialSummary): void {
  const snap = bookmarkSnapshot(m);
  write([{ ...snap, at: Date.now() }, ...read().filter((b) => b.id !== snap.id)]);
}

export function removeLocalBookmark(id: string): void {
  write(read().filter((b) => b.id !== id));
}

/** Balik status bookmark; mengembalikan status BARU (true = kini tersimpan). */
export function toggleLocalBookmark(m: MaterialSummary): boolean {
  if (isLocalBookmarked(m.id)) {
    removeLocalBookmark(m.id);
    return false;
  }
  addLocalBookmark(m);
  return true;
}

/** Bentuk ulang entri lokal menjadi MaterialSummary untuk perender bersama. */
export function bookmarkAsSummary(b: LocalBookmark): MaterialSummary {
  return {
    id: b.id,
    title_id: b.title_id,
    title_ar: b.title_ar,
    scholar_name: b.scholar_name,
    content_type: b.content_type,
    topics: (b.topics || []) as Topic[],
  };
}

/** Hook reaktif: daftar bookmark lokal, tersinkron antar komponen & tab. */
export function useLocalBookmarks(): LocalBookmark[] {
  const [items, setItems] = useState<LocalBookmark[]>([]);
  useEffect(() => {
    const update = () => setItems(read());
    update();
    window.addEventListener(BOOKMARKS_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(BOOKMARKS_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return items;
}

export function useIsBookmarked(id: string): boolean {
  const items = useLocalBookmarks();
  return items.some((b) => b.id === id);
}
