"use client";
import QueueUI from "./queue-ui";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProcessingResponse } from "@pustaka/shared-types";
import { api } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, StatusChip } from "@/components/ui";

function trunc(text?: string | null) {
  if (!text) return "—";
  return <span title={text} className="block max-w-[280px] truncate">{text}</span>;
}
function fmtDate(v?: string | null) { return v ? new Date(v).toLocaleString("id-ID") : "—"; }

export default function ProcessingPage() {
  const [data, setData] = useState<ProcessingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  async function load() {
    setLoading(true); setError(null);
    try { setData(await api.processing()); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat antrean pemrosesan."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  if (loading) return <LoadingState label="Memuat antrean pemrosesan…" />;
  const acq = data?.acquisition_jobs || [];
  const proc = data?.processing_jobs || [];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-emerald-deep">Processing Queue</h1>
        <button className="btn-outline px-4 py-2 text-xs" onClick={load}>Muat Ulang</button>
      </div>
      <QueueUI />
      <p className="mt-1 text-sm text-stone-600">Antrean akuisisi (impor URL) dan pemrosesan (ekstraksi, pembersihan, segmentasi) dari API admin.</p>
      {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}

      <h2 className="mt-6 font-bold text-emerald-deep">Akuisisi</h2>
      <div className="card mt-3 overflow-x-auto p-0">
        {acq.length === 0 ? <EmptyState title="Belum ada pekerjaan akuisisi" body="Tidak ada pekerjaan akuisisi yang tercatat oleh API." /> : (
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead><tr className="border-b bg-ivory text-xs uppercase text-stone-500"><th className="px-4 py-3">URL</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Materi</th><th className="px-4 py-3">Error</th><th className="px-4 py-3">Dibuat</th></tr></thead>
            <tbody>{acq.map((j) => (
              <tr key={j.id} className="border-b align-top last:border-0">
                <td className="px-4 py-3">{j.url ? <a href={j.url} target="_blank" rel="noreferrer" title={j.url} className="block max-w-[320px] truncate text-emerald underline">{j.url}</a> : "—"}</td>
                <td className="px-4 py-3"><StatusChip status={j.status} /></td>
                <td className="px-4 py-3">{j.material_id ? <Link href={`/admin/editor/${j.material_id}`} className="text-emerald underline">{j.material_id}</Link> : "—"}</td>
                <td className="px-4 py-3 text-red-700">{trunc(j.error)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{fmtDate(j.created_at)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      <h2 className="mt-8 font-bold text-emerald-deep">Pemrosesan</h2>
      <div className="card mt-3 overflow-x-auto p-0">
        {proc.length === 0 ? <EmptyState title="Belum ada pekerjaan pemrosesan" body="Tidak ada pekerjaan pemrosesan yang tercatat oleh API." /> : (
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead><tr className="border-b bg-ivory text-xs uppercase text-stone-500"><th className="px-4 py-3">Materi</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Detail</th><th className="px-4 py-3">Error</th><th className="px-4 py-3">Dibuat</th></tr></thead>
            <tbody>{proc.map((j) => (
              <tr key={j.id} className="border-b align-top last:border-0">
                <td className="px-4 py-3">{j.material_id ? <Link href={`/admin/editor/${j.material_id}`} className="text-emerald underline">{j.material_id}</Link> : "—"}</td>
                <td className="px-4 py-3">{j.job_type || "—"}</td>
                <td className="px-4 py-3"><StatusChip status={j.status} /></td>
                <td className="px-4 py-3">{trunc(j.detail)}</td>
                <td className="px-4 py-3 text-red-700">{trunc(j.error)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{fmtDate(j.created_at)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
