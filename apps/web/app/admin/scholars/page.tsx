"use client";
import { useEffect, useState } from "react";
import type { Scholar } from "@pustaka/shared-types";
import { api, scholarName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
export default function AdminScholarsPage() {
  const [items, setItems] = useState<Scholar[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.scholars().then(setItems).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat.")).finally(() => setLoading(false)); }, []);
  return (<div><h1 className="text-2xl font-bold text-emerald-deep">Scholars</h1><p className="mt-1 text-sm text-stone-600">Data ulama dari endpoint publik. Pengelolaan (tambah atau ubah) ulama belum disediakan kontrak API admin pada MVP, sehingga halaman ini bersifat baca.</p>
    {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="Belum ada data ulama" body="Data ulama belum tersedia dari server." /> : items.map((s) => (<div key={s.id} className="card p-5"><span className="font-arabic flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-deep text-xl text-gold">{(s.name_ar || scholarName(s)).slice(0, 2)}</span><h2 className="mt-3 font-bold text-emerald-deep">{scholarName(s)}</h2>{s.name_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-1 text-right">{s.name_ar}</p> : null}{(s.bio_id || s.bio) ? <p className="mt-2 text-sm text-stone-600">{s.bio_id || s.bio}</p> : null}</div>))}</div></div>);
}
