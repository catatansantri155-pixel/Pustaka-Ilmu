"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Issue } from "@pustaka/shared-types";
import { api } from "@/lib/api";
import CatalogBrowser from "@/components/CatalogBrowser";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
function Search() {
  const params = useSearchParams();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setIssues(await api.issues()); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat daftar persoalan."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return <div className="space-y-10">
    <header><h1 className="text-3xl font-bold text-emerald-deep">Cari pembahasan</h1><p className="mt-3 text-sm text-muted">Gunakan kata kunci, lalu pilih ulama atau topik untuk mempersempit hasil.</p></header>
    <CatalogBrowser initialQuery={params.get("q") || ""} topicId={params.get("topic_id") || undefined} />
    <section><h2 className="section-heading mb-4">Daftar persoalan</h2>
      {error ? <ErrorState message={error} onRetry={load} /> : loading ? <LoadingState label="Memuat daftar persoalan…" /> : issues.length === 0 ? <EmptyState title="Daftar persoalan belum tersedia" body="Kamu tetap dapat mencari materi melalui kolom pencarian di atas." /> : <div className="divide-y divide-line">{issues.map(i => <Link className="block space-y-2 py-5 hover:underline" key={i.id} href={`/persoalan/${i.id}`}><span className="block text-xs text-muted">{i.code}</span><strong>{i.title_id}</strong>{i.description_id && <p className="text-sm text-muted">{i.description_id}</p>}</Link>)}</div>}
    </section>
  </div>;
}
export default function SearchPage() { return <Suspense fallback={<LoadingState />}><Search /></Suspense>; }
