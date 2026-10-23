"use client";
import { useEffect, useMemo, useState } from "react";
import type { DashboardStats } from "@pustaka/shared-types";
import { api } from "@/lib/api";
import { ErrorState, LoadingState } from "@/components/ui";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return <div className="card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p><p className="mt-1 text-3xl font-extrabold text-emerald-deep">{value}</p></div>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.dashboard().then(setStats).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat dashboard.")).finally(() => setLoading(false)); }, []);
  const byStatus = useMemo(() => stats?.by_status || stats?.status_counts || {}, [stats]);
  const activity = stats?.recent_activity || stats?.audit_logs || stats?.activity || [];
  if (loading) return <LoadingState label="Memuat dashboard…" />;
  return (
    <div>
      <h1 className="text-2xl font-bold text-emerald-deep">Dashboard</h1>
      <p className="mt-1 text-sm text-stone-600">Semua angka di halaman ini berasal langsung dari API admin.</p>
      {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
      {stats ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Total Materi" value={stats.total_materials ?? stats.materials_total ?? stats.total ?? "—"} />
            <StatCard label="Menunggu Review" value={stats.pending_review ?? stats.awaiting_review ?? byStatus["ADMIN_REVIEW"] ?? byStatus["PENDING_REVIEW"] ?? "—"} />
            <StatCard label="Terbit" value={stats.published ?? stats.published_count ?? byStatus["PUBLISHED_AI"] ?? byStatus["PUBLISHED"] ?? "—"} />
            <StatCard label="Temuan Kritis" value={stats.critical_findings ?? stats.critical_findings_count ?? "—"} />
            <StatCard label="Sumber Terdaftar" value={stats.total_sources ?? stats.sources_total ?? stats.sources ?? "—"} />
          </div>
          {Object.keys(byStatus).length > 0 && (
            <section className="card mt-6 p-6">
              <h2 className="font-bold text-emerald-deep">Materi per Status</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(byStatus).map(([k, v]) => <div key={k} className="flex items-center justify-between rounded-2xl bg-ivory px-4 py-2 text-sm"><span className="font-medium">{k}</span><span className="font-bold text-emerald-deep">{v}</span></div>)}
              </div>
            </section>
          )}
          <section className="card mt-6 p-6">
            <h2 className="font-bold text-emerald-deep">Aktivitas Audit Terbaru</h2>
            {activity.length === 0 ? <p className="mt-2 text-sm text-stone-600">API belum melaporkan aktivitas audit terbaru.</p> : (
              <ul className="mt-3 space-y-2 text-sm">{activity.map((a, i) => <li key={a.id || i} className="rounded-2xl bg-ivory px-4 py-2"><span className="font-semibold">{a.action || "aktivitas"}</span>{a.entity_type ? ` · ${a.entity_type}` : ""}{a.actor ? ` · ${a.actor}` : ""}{a.created_at ? ` · ${a.created_at}` : ""}{a.detail ? <span className="block text-stone-600">{a.detail}</span> : null}</li>)}</ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
