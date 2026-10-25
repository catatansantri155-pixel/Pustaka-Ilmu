"use client";
import { useParams } from "next/navigation";
import CatalogBrowser from "@/components/CatalogBrowser";
import { useEffect, useState } from "react";
import type { Scholar } from "@pustaka/shared-types";
import { api, scholarName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, MaterialCard } from "@/components/ui";

export default function ScholarDetailPage() {
  const params = useParams<{ scholarId: string }>();
  const [scholar, setScholar] = useState<Scholar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const allScholars = await api.scholars();
        setScholar(allScholars.find((s) => s.id === params.scholarId) || null);

      } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat."); }
      finally { setLoading(false); }
    })();
  }, [params.scholarId, nonce]);
  if (loading) return <LoadingState />;
  return (
    <div className="space-y-6">
      {error ? <ErrorState message={error} onRetry={() => setNonce((n) => n + 1)} /> : null}
      {!scholar ? <EmptyState title="Ulama tidak ditemukan" body="Profil ulama ini belum tersedia dari server." /> : (
        <>
          <section className="card pattern-islamic-light p-6">
            <div className="flex items-start gap-4">
              <span className="font-arabic flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-deep text-2xl text-gold" aria-hidden>{(scholar.name_ar || scholarName(scholar)).slice(0, 2)}</span>
              <div>
                <h1 className="text-xl font-extrabold text-emerald-deep">{scholarName(scholar)}</h1>
                {scholar.name_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-1 text-right text-lg text-stone-700">{scholar.name_ar}</p> : null}
                {(scholar.death_year || scholar.death_year_hijri || scholar.died) ? <p className="mt-1 text-sm text-stone-500">Wafat: {String(scholar.death_year || scholar.death_year_hijri || scholar.died)}</p> : null}
              </div>
            </div>
            {(scholar.bio_id || scholar.bio || scholar.description) ? <p className="mt-4 text-sm leading-relaxed text-stone-700">{scholar.bio_id || scholar.bio || scholar.description}</p> : null}
          </section>
          <CatalogBrowser scholarId={params.scholarId} />
        </>
      )}
    </div>
  );
}
