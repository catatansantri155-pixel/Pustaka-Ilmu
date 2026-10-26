"use client";
import type { MaterialSummary } from "@pustaka/shared-types";
import { toggleLocalBookmark, useIsBookmarked } from "@/lib/bookmarks";
import { IconBookmark } from "@/components/icons";

/**
 * Tombol penanda lokal untuk kartu materi. SENGAJA dirender sebagai saudara
 * (bukan anak) dari <Link> kartu — elemen interaktif tidak boleh bersarang di
 * dalam tautan, supaya klik penanda tidak pernah menyatu dengan klik kartu.
 */
export default function BookmarkButton({ m }: { m: MaterialSummary }) {
  const saved = useIsBookmarked(m.id);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Hapus materi dari Tersimpan" : "Simpan materi ke Tersimpan"}
      title={saved ? "Tersimpan di perangkat ini — ketuk untuk menghapus" : "Simpan di perangkat ini"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleLocalBookmark(m);
      }}
      className={`pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full shadow-soft backdrop-blur transition ${
        saved
          ? "bg-emerald text-white"
          : "bg-white/90 text-emerald-deep hover:bg-white"
      }`}
    >
      <IconBookmark className="h-5 w-5" fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
