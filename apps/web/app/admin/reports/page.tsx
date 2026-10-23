"use client";
import { useEffect, useState } from "react";
import type { ReportsSummary } from "@pustaka/shared-types";
import { api } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";

function BarTable({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  const max = entries.reduce((m, [, v]) => Math.max(m, v), 0);
  return (
    <section className="card p-5">
      <h2 className="font-bold text-emerald-deep">{title}</h2>
      {entries.length === 0 ? <p className="mt-2 text-sm text-stone-600">Tidak ada data.</p> : (
        <table className="mt-3 w-full text-left text-sm">
          <tbody>{entries.map(([k, v]) => (
            <tr key={k} className="border-b last:border-0">
              <td className="py-2 pr-3 font-medium">{k}</td>
              <td className="w-[55%] py-2 pr-3"><div className="h-2.5 w-full overflow-hidden rounded-full bg-emerald/10"><div className="h-full rounded-full bg-emerald" style={{ width: `${max > 0 ? Math.max(4, Math.round((v / max) * 100)) : 0}%` }} /></div></td>
              <td className="py-2 text-right font-bold text-emerald-deep">{v}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </section>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.reportsSummary().then(setData).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat laporan.")).finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingState label="Memuat laporan…" />;
  return (
    <div>
      <h1 className="text-2xl font-bold text-emerald-deep">Reports</h1>
      <p className="mt-1 text-sm text-stone-600">Agregat materi, temuan kualitas, penggunaan AI, dan pekerjaan dari API admin.</p>
      {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
      {!data && !error ? <div className="mt-5"><EmptyState title="Laporan kosong" body="API tidak mengembalikan data laporan." /></div> : null}
      {data ? (
        <>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <BarTable title="Materi per Status" data={data.materials_by_status} />
            <BarTable title="Temuan per Severity" data={data.findings_by_severity} />
            <BarTable title="Materi per Ulama" data={data.materials_by_scholar} />
            <BarTable title="Materi per Topik" data={data.materials_by_topic} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="card p-5">
              <h2 className="font-bold text-emerald-deep">Ringkasan AI</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between rounded-2xl bg-ivory px-4 py-2"><dt>Jumlah run</dt><dd className="font-bold text-emerald-deep">{data.ai.runs}</dd></div>
                <div className="flex justify-between rounded-2xl bg-ivory px-4 py-2"><dt>Token masuk</dt><dd className="font-bold text-emerald-deep">{data.ai.tokens_input.toLocaleString("id-ID")}</dd></div>
                <div className="flex justify-between rounded-2xl bg-ivory px-4 py-2"><dt>Token keluar</dt><dd className="font-bold text-emerald-deep">{data.ai.tokens_output.toLocaleString("id-ID")}</dd></div>
                <div className="flex justify-between rounded-2xl bg-ivory px-4 py-2"><dt>Estimasi biaya</dt><dd className="font-bold text-emerald-deep">{data.ai.cost_estimate.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</dd></div>
              </dl>
            </section>
            <section className="card p-5">
              <h2 className="font-bold text-emerald-deep">Pekerjaan (Jobs)</h2>
              <h3 className="mt-3 text-sm font-semibold text-stone-600">Akuisisi per status</h3>
              {Object.keys(data.jobs.acquisition_by_status || {}).length === 0 ? <p className="mt-1 text-sm text-stone-600">Tidak ada data.</p> : <ul className="mt-1 space-y-1 text-sm">{Object.entries(data.jobs.acquisition_by_status).map(([k, v]) => <li key={k} className="flex justify-between rounded-2xl bg-ivory px-4 py-2"><span>{k}</span><span className="font-bold text-emerald-deep">{v}</span></li>)}</ul>}
              <h3 className="mt-4 text-sm font-semibold text-stone-600">Pemrosesan per status</h3>
              {Object.keys(data.jobs.processing_by_status || {}).length === 0 ? <p className="mt-1 text-sm text-stone-600">Tidak ada data.</p> : <ul className="mt-1 space-y-1 text-sm">{Object.entries(data.jobs.processing_by_status).map(([k, v]) => <li key={k} className="flex justify-between rounded-2xl bg-ivory px-4 py-2"><span>{k}</span><span className="font-bold text-emerald-deep">{v}</span></li>)}</ul>}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
