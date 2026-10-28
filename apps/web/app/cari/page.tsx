"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Issue } from "@pustaka/shared-types";
import { api } from "@/lib/api";
import CatalogBrowser from "@/components/CatalogBrowser";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { IconChevronRight, IconLayers } from "@/components/icons";
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
  return <div className="space-y-6 sm:space-y-10">
    <header><h1 className="text-[17px] font-extrabold text-emerald-deep sm:text-xl">Cari pembahasan</h1><p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-sm">Gunakan kata kunci, lalu pilih ulama atau topik untuk mempersempit hasil.</p></header>
    <CatalogBrowser initialQuery={params.get("q") || ""} topicId={params.get("topic_id") || undefined} />
    <section><h2 className="section-heading mb-4 flex items-center gap-2"><IconLayers className="h-5 w-5 text-emerald" /> Daftar persoalan</h2>
      {error ? <ErrorState message={error} onRetry={load} /> : loading ? <LoadingState label="Memuat daftar persoalan…" /> : issues.length === 0 ? <EmptyState title="Daftar persoalan belum tersedia" body="Kamu tetap dapat mencari materi melalui kolom pencarian di atas." /> : <div className="space-y-2.5">{issues.map(i => <Link className="card group flex items-center gap-4 p-3.5 sm:p-4" key={i.id} href={`/persoalan/${i.id}`}><span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold uppercase tracking-wide text-emerald">{i.code}</span><strong className="mt-0.5 block text-sm text-emerald-deep group-hover:underline">{i.title_id}</strong>{i.description_id && <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted sm:text-sm">{i.description_id}</span>}</span><IconChevronRight className="h-5 w-5 shrink-0 text-emerald transition group-hover:translate-x-0.5" /></Link>)}</div>}
    </section>
  </div>;
}
export default function SearchPage() { return <Suspense fallback={<LoadingState />}><Search /></Suspense>; }
