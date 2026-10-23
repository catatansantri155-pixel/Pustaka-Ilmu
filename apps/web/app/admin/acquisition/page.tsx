"use client";
import { useState } from "react";
import { api } from "@/lib/api";
export default function AcquisitionPage() {
  const [url, setUrl] = useState(""); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setMsg(null); try { const r = await api.importUrl(url); setMsg(`Impor diterima: ${JSON.stringify(r)}`); setUrl(""); } catch (err) { setMsg(err instanceof Error ? err.message : "Impor gagal."); } finally { setBusy(false); } }
  return (<div><h1 className="text-2xl font-bold text-emerald-deep">Acquisition</h1>
    <form onSubmit={submit} className="card mt-5 flex flex-col gap-3 p-5 sm:flex-row"><input className="input flex-1" type="url" required placeholder="URL materi (artikel atau halaman fatwa)…" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="URL impor" /><button className="btn-primary" disabled={busy}>{busy ? "Mengimpor…" : "Import URL"}</button></form>
    {msg ? <p className="mt-3 break-words rounded-2xl bg-emerald/5 px-4 py-2 text-sm text-emerald-deep">{msg}</p> : null}
    <div className="card mt-6 p-6 text-sm leading-relaxed text-stone-600"><p className="font-semibold text-emerald-deep">Catatan kandidat audio</p><p className="mt-2">URL yang menunjuk ke berkas atau halaman audio diperlakukan sebagai kandidat audio. Kandidat audio memerlukan proses transkripsi menjadi teks terlebih dahulu sebelum dapat diterjemahkan, diaudit, dan diterbitkan — audio tidak diterbitkan langsung dari hasil impor.</p></div>
  </div>);
}
