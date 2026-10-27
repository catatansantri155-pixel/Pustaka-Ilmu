"use client";
import Link from "next/link";
import { materialTitle } from "@/lib/api";
import {
  bookmarkAsSummary,
  removeLocalBookmark,
  useLocalBookmarks,
  type LocalBookmark,
} from "@/lib/bookmarks";
import { EmptyState } from "@/components/ui";
import TopicCover from "@/components/TopicCover";
import { imageForMaterial } from "@/lib/topicImages";
import { IconBookmark, IconX } from "@/components/icons";

/**
 * Daftar Tersimpan = bookmark LOKAL perangkat (localStorage).
 * Tanpa akun, tanpa login, tanpa API — daftar ini hanya ada di browser
 * perangkat ini dan hilang bila data browser dibersihkan.
 */
export default function TersimpanPage() {
  const items = useLocalBookmarks();

  function remove(b: LocalBookmark) {
    removeLocalBookmark(b.id);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-extrabold text-emerald-deep">
          <IconBookmark className="h-5 w-5 text-emerald" /> Tersimpan
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Materi yang kamu simpan tersimpan hanya di perangkat ini (penyimpanan
          lokal browser) — tanpa perlu masuk. Daftar akan kosong di perangkat
          atau browser lain, dan terhapus bila data browser dibersihkan.
        </p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title="Belum ada materi tersimpan"
          body="Ketuk ikon penanda pada kartu materi, atau tombol Simpan materi pada halaman materi, dan materi itu akan tampil di sini."
        />
      ) : (
        <div className="space-y-3">
          {items.map((b) => {
            const summary = bookmarkAsSummary(b);
            return (
              <div key={b.id} className="card flex items-center gap-3 p-3">
                <Link href={`/materi/${b.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <TopicCover image={imageForMaterial(summary)} className="h-12 w-12 shrink-0 rounded-2xl sm:h-14 sm:w-16" />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-emerald-deep">{materialTitle(summary)}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {b.scholar_name ? `${b.scholar_name} · ` : ""}
                      {new Date(b.at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  className="btn-outline btn-compact shrink-0"
                  aria-label={`Hapus ${materialTitle(summary)} dari Tersimpan`}
                  onClick={() => remove(b)}
                >
                  <IconX className="h-4 w-4" /> Hapus
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
