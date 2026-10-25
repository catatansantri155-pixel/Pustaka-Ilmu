"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Bookmark } from "@pustaka/shared-types";
import { api, materialTitle } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import TopicCover from "@/components/TopicCover";
import { imageForMaterial } from "@/lib/topicImages";
import { IconBookmark, IconX } from "@/components/icons";

export default function TersimpanPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [items, setItems] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try { setItems(await api.bookmarks()); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat bookmark."); }
    finally { setLoading(false); }
  }
  useEffect(() => { const li = !!getToken(); setLoggedIn(li); if (li) load(); else setLoading(false); }, []);
  async function remove(b: Bookmark) {
    // Backend menghapus bookmark berdasarkan material_id.
    const mid = b.material_id || b.material?.id || b.id;
    try { await api.removeBookmark(mid); setItems((prev) => prev.filter((x) => x.id !== b.id)); setNotice("Bookmark dihapus."); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Gagal menghapus bookmark."); }
  }
  if (loggedIn === false) {
    return (
      <div className="space-y-6">
        <h1 className="flex items-center gap-2.5 text-xl font-extrabold text-emerald-deep"><IconBookmark className="h-6 w-6 text-emerald" /> Tersimpan</h1>
        <EmptyState title="Masuk untuk melihat materi tersimpan" body="Daftar bookmark hanya tersedia setelah Anda masuk." />
        <div className="text-center"><Link href="/admin/login" className="btn-primary">Masuk</Link></div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2.5 text-xl font-extrabold text-emerald-deep"><IconBookmark className="h-6 w-6 text-emerald" /> Tersimpan</h1>
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {notice ? <p role="status" className="text-sm text-emerald">{notice}</p> : null}
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="Belum ada materi tersimpan" body="Simpan materi dengan tombol Simpan pada halaman materi, dan materi itu akan tampil di sini." /> : (
        <div className="space-y-3">
          {items.map((b) => {
            const mid = b.material_id || b.material?.id || "";
            const title = b.material ? materialTitle(b.material) : `Materi ${mid}`;
            return (
              <div key={b.id} className="card flex items-center gap-4 p-3.5">
                <Link href={`/materi/${mid}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <TopicCover image={imageForMaterial(b.material)} className="h-14 w-14 shrink-0 rounded-2xl sm:h-16 sm:w-20" />
                  <span className="min-w-0 truncate font-semibold text-emerald-deep">{title}</span>
                </Link>
                <button className="btn-outline shrink-0" onClick={() => remove(b)}><IconX className="h-4 w-4" /> Hapus</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
