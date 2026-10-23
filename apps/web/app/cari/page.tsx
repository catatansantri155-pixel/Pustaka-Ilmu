"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Issue, MaterialSummary, Scholar } from "@pustaka/shared-types";
import { api, scholarName, topicName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, MaterialCard } from "@/components/ui";

function CariInner() {
  const params = useSearchParams();
  const initial = params.get("q") || "";
  const [q, setQ] = useState(initial);
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<MaterialSummary[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [scholarFilter, setScholarFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api.issues().then(setIssues).catch(() => {}); api.scholars().then(setScholars).catch(() => {}); }, []);
  useEffect(() => {
    if (!initial) return;
    setLoading(true); setError(null);
    api.search(initial).then((r) => { setResults(r); setSearched(true); })
      .catch((e) => setError(e instanceof Error ? e.message : "Pencarian gagal."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const filtered = useMemo(() => {
    if (!scholarFilter) return results;
    return results.filter((r) => r.scholar_id === scholarFilter || r.scholar?.id === scholarFilter);
  }, [results, scholarFilter]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault(); setQuery(q); setLoading(true); setError(null);
    try { setResults(await api.search(q)); setSearched(true); }
    catch (err) { setError(err instanceof Error ? err.message : "Pencarian gagal."); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-extrabold text-emerald-deep">Cari Persoalan</h1>
        <form className="mt-4 flex gap-2" onSubmit={onSearch}>
          <input className="input flex-1 py-3" placeholder="Ketik kata kunci persoalan…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Kata kunci pencarian" />
          <button className="btn-primary px-6" type="submit" disabled={loading}>Cari</button>
        </form>
        {scholars.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setScholarFilter("")} className={`chip ${!scholarFilter ? "border-emerald bg-emerald text-white" : "border-emerald/25 bg-white text-emerald"}`}>Semua Ulama</button>
            {scholars.map((s) => (
              <button key={s.id} onClick={() => setScholarFilter(s.id)} className={`chip ${scholarFilter === s.id ? "border-emerald bg-emerald text-white" : "border-emerald/25 bg-white text-emerald"}`}>{scholarName(s)}</button>
            ))}
          </div>
        )}
      </section>
      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState label="Mencari materi…" /> : searched ? (
        <section>
          <h2 className="mb-3 text-lg font-bold text-emerald-deep">Hasil{query ? ` untuk “${query}”` : ""}</h2>
          {filtered.length === 0 ? (
            <EmptyState title="Tidak ditemukan" body="Tidak ada materi terbit yang cocok dengan kata kunci dan filter ini. Coba kata kunci lain, misalnya wudu, tayamum, atau najis." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m) => (
                <div key={m.id}>
                  <MaterialCard m={m} />
                  <p className="mt-1 px-1 text-xs text-stone-500">
                    {scholarName(m.scholar) ? `Ulama: ${scholarName(m.scholar)}` : ""}{m.topics?.length ? ` · Topik: ${m.topics.map(topicName).filter(Boolean).join(", ")}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
      <section>
        <h2 className="mb-3 text-lg font-bold text-emerald-deep">Daftar Persoalan</h2>
        {issues.length === 0 ? <EmptyState title="Belum ada daftar persoalan" body="Daftar persoalan akan tampil di sini setelah data persoalan tersedia dari server." /> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {issues.map((i) => (
              <button key={i.id} onClick={() => { const t = i.title_id || i.title || i.question || ""; setQ(t); setQuery(t); setLoading(true); api.search(t).then((r) => { setResults(r); setSearched(true); }).catch((e) => setError(e instanceof Error ? e.message : "Pencarian gagal.")).finally(() => setLoading(false)); }} className="card p-4 text-left">
                {i.code ? <p className="text-xs font-bold text-gold">{i.code}</p> : null}
                <p className="font-semibold text-emerald-deep">{i.title_id || i.title || i.question}</p>
                {i.description ? <p className="mt-1 text-sm text-stone-600">{i.description}</p> : null}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
export default function CariPage() {
  return <Suspense fallback={<LoadingState />}><CariInner /></Suspense>;
}
