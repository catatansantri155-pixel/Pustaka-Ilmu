"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { AiRunsResponse, MaterialSummary } from "@pustaka/shared-types";
import { api, materialTitle } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, StatusChip } from "@/components/ui";

function fmtNum(n?: number | null) { return n == null ? "—" : n.toLocaleString("id-ID"); }
function fmtCost(n?: number | null) { return n == null ? "—" : n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 4 }); }
function fmtDate(v?: string | null) { return v ? new Date(v).toLocaleString("id-ID") : "—"; }

export default function AiTranslationPage() {
  const [data, setData] = useState<AiRunsResponse | null>(null);
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [runMsg, setRunMsg] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  async function load() {
    try { setData(await api.aiRuns()); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat riwayat terjemahan AI."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); api.adminMaterials().then((m) => { setMaterials(m); if (m.length) setSelected(m[0].id); }).catch(() => {}); }, []);

  async function doTranslate() {
    if (!selected) return;
    setBusy(true); setRunMsg(null); setRunError(null);
    try {
      const res = await api.translate(selected) as Record<string, unknown> | null;
      const run = (res?.ai_run || res?.run || res) as Record<string, unknown> | null;
      const status = run && typeof run.status === "string" ? run.status : null;
      const err = run && (typeof run.error === "string" ? run.error : typeof run.message === "string" ? run.message : null);
      if (status === "FAILED") setRunError(`Terjemahan AI GAGAL${err ? `: ${err}` : ""}`);
      else setRunMsg(`Terjemahan AI terkirim${status ? ` (status: ${status})` : ""}. Daftar run di bawah telah dimuat ulang.`);
      await load();
    } catch (e) { setRunError(e instanceof Error ? e.message : "Terjemahan gagal."); }
    finally { setBusy(false); }
  }

  const totals = data?.totals;
  const runs = data?.runs || [];
  return (
    <div>
      <h1 className="text-2xl font-bold text-emerald-deep">AI Translation</h1>
      <p className="mt-1 text-sm text-stone-600">Riwayat penerjemahan AI dan ringkasan penggunaan dari API admin.</p>
      {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
      {loading ? <div className="mt-5"><LoadingState label="Memuat riwayat AI…" /></div> : null}

      {totals ? (
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Jumlah Run</p><p className="mt-1 text-3xl font-extrabold text-emerald-deep">{fmtNum(totals.runs)}</p></div>
          <div className="card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Token Masuk</p><p className="mt-1 text-3xl font-extrabold text-emerald-deep">{fmtNum(totals.tokens_input)}</p></div>
          <div className="card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Token Keluar</p><p className="mt-1 text-3xl font-extrabold text-emerald-deep">{fmtNum(totals.tokens_output)}</p></div>
          <div className="card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Estimasi Biaya</p><p className="mt-1 text-3xl font-extrabold text-emerald-deep">{fmtCost(totals.cost_estimate)}</p></div>
        </div>
      ) : null}
      {totals && Object.keys(totals.by_status || {}).length > 0 ? (
        <div className="card mt-4 flex flex-wrap items-center gap-2 p-4">
          <span className="text-sm font-semibold text-emerald-deep">Per status:</span>
          {Object.entries(totals.by_status).map(([k, v]) => <span key={k} className="chip border-emerald/20 bg-emerald/5 text-emerald">{k}: {v}</span>)}
        </div>
      ) : null}

      <section className="card mt-6 p-5">
        <h2 className="font-bold text-emerald-deep">Jalankan Terjemahan</h2>
        <p className="mt-1 text-sm text-stone-600">Pilih materi lalu jalankan terjemahan AI. Hasil atau error run akan ditampilkan dan daftar di bawah dimuat ulang.</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <select className="input flex-1" value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Pilih materi">
            {materials.length === 0 ? <option value="">(Tidak ada materi)</option> : materials.map((m) => <option key={m.id} value={m.id}>{materialTitle(m)} — {m.id}</option>)}
          </select>
          <button className="btn-primary" disabled={busy || !selected} onClick={doTranslate}>{busy ? "Menjalankan…" : "Jalankan Terjemahan"}</button>
        </div>
        {runMsg ? <p className="mt-3 rounded-2xl bg-emerald/5 px-4 py-2 text-sm text-emerald-deep">{runMsg}</p> : null}
        {runError ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{runError}</p> : null}
      </section>

      <div className="card mt-6 overflow-x-auto p-0">
        {!loading && runs.length === 0 ? <EmptyState title="Belum ada run terjemahan" body="Jalankan terjemahan dari panel di atas atau dari halaman Materials." /> : runs.length > 0 ? (
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead><tr className="border-b bg-ivory text-xs uppercase text-stone-500"><th className="px-4 py-3">Materi</th><th className="px-4 py-3">Model</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Token In/Out</th><th className="px-4 py-3">Biaya</th><th className="px-4 py-3">Error</th><th className="px-4 py-3">Dibuat</th></tr></thead>
            <tbody>{runs.map((r) => (
              <tr key={r.id} className="border-b align-top last:border-0">
                <td className="px-4 py-3">{r.material_id ? <Link href={`/admin/editor/${r.material_id}`} className="text-emerald underline">{r.material_id}</Link> : "—"}</td>
                <td className="px-4 py-3">{r.model || "—"}</td>
                <td className="px-4 py-3"><StatusChip status={r.status} /></td>
                <td className="px-4 py-3 whitespace-nowrap">{fmtNum(r.tokens_input)} / {fmtNum(r.tokens_output)}</td>
                <td className="px-4 py-3">{fmtCost(r.cost_estimate)}</td>
                <td className="px-4 py-3 text-red-700">{r.error ? <span title={r.error} className="block max-w-[240px] truncate">{r.error}</span> : "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">{fmtDate(r.created_at)}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : null}
      </div>
      <p className="mt-3 text-sm"><Link href="/admin/materials" className="text-emerald underline">Buka Materials</Link></p>
    </div>
  );
}
