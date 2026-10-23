"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { MaterialSummary } from "@pustaka/shared-types";
import { api, materialTitle, scholarName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { ActionButtons, ActionFeedback, useMaterialActions } from "@/components/AdminMaterialActions";

export default function AdminMaterialsPage() {
  const [items, setItems] = useState<MaterialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  async function load() { try { setItems(await api.adminMaterials()); } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat materi."); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  const actions = useMaterialActions(load);
  async function doImport(e: React.FormEvent) {
    e.preventDefault(); setImportBusy(true); setImportMsg(null);
    try { const r = await api.importUrl(importUrl); setImportMsg(`Impor diterima: ${JSON.stringify(r)}`); setImportUrl(""); load(); }
    catch (err) { setImportMsg(err instanceof Error ? err.message : "Impor gagal."); }
    finally { setImportBusy(false); }
  }
  return (
    <div>
      <h1 className="text-2xl font-bold text-emerald-deep">Materials</h1>
      <form onSubmit={doImport} className="card mt-5 flex flex-col gap-3 p-5 sm:flex-row">
        <input className="input flex-1" placeholder="URL materi untuk diimpor…" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} required type="url" aria-label="URL impor" />
        <button className="btn-primary" disabled={importBusy}>{importBusy ? "Mengimpor…" : "Import URL"}</button>
      </form>
      {importMsg ? <p className="mt-3 break-words rounded-2xl bg-emerald/5 px-4 py-2 text-sm text-emerald-deep">{importMsg}</p> : null}
      <ActionFeedback message={actions.message} blockers={actions.blockers} />
      {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
      <div className="card mt-5 overflow-x-auto p-0">
        {loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="Belum ada materi" body="Impor materi pertama lewat formulir Import URL di atas." /> : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead><tr className="border-b bg-ivory text-xs uppercase text-stone-500"><th className="px-4 py-3">Judul</th><th className="px-4 py-3">Ulama</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Demo</th><th className="px-4 py-3">Terjemahan AI</th><th className="px-4 py-3">Aksi</th></tr></thead>
            <tbody>{items.map((m) => {
              const run = m.ai_run || m.last_ai_run;
              return (
                <tr key={m.id} className="border-b align-top last:border-0">
                  <td className="px-4 py-3"><Link href={`/admin/editor/${m.id}`} className="font-semibold text-emerald underline">{materialTitle(m)}</Link>{m.content_type ? <span className="block text-xs text-stone-500">{m.content_type}</span> : null}</td>
                  <td className="px-4 py-3">{scholarName(m.scholar) || m.scholar_name || "—"}</td>
                  <td className="px-4 py-3">{m.status || m.pipeline_status || "—"}{m.ai_label ? <span className="block text-xs text-stone-500">{m.ai_label}</span> : null}</td>
                  <td className="px-4 py-3">{m.is_demo ? <span className="chip border-amber-300 bg-amber-50 text-amber-800">is_demo</span> : "—"}</td>
                  <td className="px-4 py-3"><button disabled={actions.busyId === m.id} className="btn-outline px-3 py-1.5 text-xs" onClick={() => actions.translate(m.id)}>Terjemahkan AI</button>{run?.status ? <span className="mt-1 block text-xs text-stone-600">ai_run: {run.status}{run.error ? ` — ${run.error}` : ""}</span> : null}</td>
                  <td className="px-4 py-3"><ActionButtons id={m.id} busy={actions.busyId === m.id} onAct={(a) => actions.act(m.id, a)} /></td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
