"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { PublicationResponse } from "@pustaka/shared-types";
import { api } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, StatusChip } from "@/components/ui";
import { ActionFeedback, useMaterialActions } from "@/components/AdminMaterialActions";

export default function PublicationPage() {
  const [data, setData] = useState<PublicationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  async function load() {
    setLoading(true); setError(null);
    try { setData(await api.publication()); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat data publikasi."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const actions = useMaterialActions(() => { load(); });
  const items = data?.items || [];

  if (loading) return <LoadingState label="Memuat data publikasi…" />;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-emerald-deep">Publication</h1>
        <button className="btn-outline px-4 py-2 text-xs" onClick={load}>Muat Ulang</button>
      </div>
      <p className="mt-1 text-sm text-stone-600">Status publikasi, hak, blocker gerbang kualitas, dan riwayat approval per materi.</p>
      {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
      <ActionFeedback message={actions.message} blockers={actions.blockers} />
      <div className="card mt-5 overflow-x-auto p-0">
        {items.length === 0 ? <EmptyState title="Belum ada materi" body="API publikasi belum mengembalikan materi apa pun." /> : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead><tr className="border-b bg-ivory text-xs uppercase text-stone-500"><th className="px-4 py-3">Materi</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Hak</th><th className="px-4 py-3">Blockers</th><th className="px-4 py-3">Approvals</th><th className="px-4 py-3">Aksi</th></tr></thead>
            <tbody>{items.map((it) => {
              const published = it.published ?? (it.status || "").toUpperCase().startsWith("PUBLISHED");
              return (
                <tr key={it.material_id} className="border-b align-top last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/editor/${it.material_id}`} className="font-semibold text-emerald underline">{it.title_id || it.material_id}</Link>
                    <span className="block text-xs text-stone-500">{it.material_id}{it.is_demo ? " · Demo" : ""}</span>
                  </td>
                  <td className="px-4 py-3"><StatusChip status={it.status} />{published ? <span className="mt-1 block text-xs font-semibold text-emerald">Terbit</span> : <span className="mt-1 block text-xs text-stone-500">Belum terbit</span>}</td>
                  <td className="px-4 py-3">{it.rights_status || "—"}</td>
                  <td className="px-4 py-3">{it.blockers && it.blockers.length > 0 ? <ul className="list-disc space-y-0.5 pl-4 text-red-700">{it.blockers.map((b, i) => <li key={i}>{b}</li>)}</ul> : <span className="text-emerald">Tidak ada</span>}</td>
                  <td className="px-4 py-3">{it.approvals && it.approvals.length > 0 ? <ul className="space-y-1">{it.approvals.map((a) => <li key={a.id} className="text-xs"><span className="font-semibold">{a.decision || "—"}</span>{a.admin_id ? ` · ${a.admin_id}` : ""}{a.created_at ? <span className="block text-stone-500">{new Date(a.created_at).toLocaleString("id-ID")}</span> : null}{a.notes ? <span className="block text-stone-600">{a.notes}</span> : null}</li>)}</ul> : <span className="text-stone-400">—</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {published
                        ? <button disabled={actions.busyId === it.material_id} className="btn-outline px-3 py-1.5 text-xs" onClick={() => actions.act(it.material_id, "unpublish")}>Unpublish</button>
                        : <button disabled={actions.busyId === it.material_id} className="btn-outline px-3 py-1.5 text-xs" onClick={() => actions.act(it.material_id, "publish")}>Publish</button>}
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </div>
      <p className="mt-3 text-sm"><Link href="/admin/materials" className="text-emerald underline">Buka Materials</Link></p>
    </div>
  );
}
