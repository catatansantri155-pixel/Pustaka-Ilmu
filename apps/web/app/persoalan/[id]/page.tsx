"use client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { MaterialSummary } from "@pustaka/shared-types";
import { api, topicName, type IssueDetail } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, MaterialCard } from "@/components/ui";

export default function IssuePage() {
  const params = useParams<{ id: string }>();
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(() => {
    setLoading(true); setError(null);
    api.issue(params.id).then(setIssue)
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat persoalan."))
      .finally(() => setLoading(false));
  }, [params.id]);
  useEffect(() => { load(); }, [load, nonce]);

  if (loading) return <LoadingState label="Memuat persoalan…" />;
  if (error) return <ErrorState message={error} onRetry={() => setNonce((n) => n + 1)} />;
  if (!issue) return <EmptyState title="Persoalan tidak ditemukan" body="Persoalan ini belum tersedia dari server." />;

  const mats = (issue.materials || []) as unknown as MaterialSummary[];
  return (
    <div className="space-y-6">
      <header>
        {issue.code ? <p className="text-xs font-bold text-gold">{issue.code}</p> : null}
        <h1 className="mt-1 text-2xl font-extrabold text-emerald-deep md:text-3xl">{issue.title_id}</h1>
        {issue.topic ? <p className="mt-2 text-sm text-muted">Kategori: <Link className="font-semibold text-emerald underline" href={`/cari?q=${encodeURIComponent(topicName(issue.topic as never))}`}>{topicName(issue.topic as never)}</Link></p> : null}
        {issue.description_id ? <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink">{issue.description_id}</p> : null}
      </header>

      <section>
        <h2 className="mb-3 text-lg font-bold text-emerald-deep">Fatwa &amp; Materi Terkait</h2>
        {mats.length === 0 ? (
          <EmptyState
            title="Menunggu materi sumber"
            body={issue.materials_status || "Belum ada materi terbit yang tertaut pada persoalan ini. Materi hanya ditautkan bila benar-benar membahas persoalan ini dan telah lolos gerbang publikasi."}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mats.map((m) => <MaterialCard key={m.id} m={m} />)}
          </div>
        )}
      </section>
      <p className="text-sm text-muted"><Link href="/cari" className="font-semibold text-emerald underline">← Kembali ke daftar persoalan</Link></p>
    </div>
  );
}
