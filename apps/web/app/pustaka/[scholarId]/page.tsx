"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MaterialSummary, Scholar } from "@pustaka/shared-types";
import { api, materialTitle, scholarName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, MaterialCard } from "@/components/ui";

export default function ScholarDetailPage({ params }: { params: { scholarId: string } }) {
  const router = useRouter();
  const [scholar, setScholar] = useState<Scholar | null>(null);
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localQ, setLocalQ] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const [allScholars, allMaterials] = await Promise.all([api.scholars(), api.materials()]);
        setScholar(allScholars.find((s) => s.id === params.scholarId) || null);
        setMaterials(allMaterials);
      } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat."); }
      finally { setLoading(false); }
    })();
  }, [params.scholarId]);
  const mine = useMemo(() => materials.filter((m) => m.scholar_id === params.scholarId || m.scholar?.id === params.scholarId), [materials, params.scholarId]);
  const shown = useMemo(() => {
    if (!localQ.trim()) return mine;
    const q = localQ.toLowerCase();
    return mine.filter((m) => materialTitle(m).toLowerCase().includes(q) || (m.title_ar || "").includes(localQ) || (m.summary || "").toLowerCase().includes(q));
  }, [mine, localQ]);
  if (loading) return <LoadingState />;
  return (
    <div className="space-y-6">
      {error ? <ErrorState message={error} /> : null}
      {!scholar ? <EmptyState title="Ulama tidak ditemukan" body="Profil ulama ini belum tersedia dari server." /> : (
        <>
          <section className="card pattern-islamic-light p-6">
            <div className="flex items-start gap-4">
              <span className="font-arabic flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-emerald-deep text-3xl text-gold" aria-hidden>{(scholar.name_ar || scholarName(scholar)).slice(0, 2)}</span>
              <div>
                <h1 className="text-2xl font-extrabold text-emerald-deep">{scholarName(scholar)}</h1>
                {scholar.name_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-1 text-right text-xl text-stone-700">{scholar.name_ar}</p> : null}
                {(scholar.death_year || scholar.death_year_hijri || scholar.died) ? <p className="mt-1 text-sm text-stone-500">Wafat: {String(scholar.death_year || scholar.death_year_hijri || scholar.died)}</p> : null}
              </div>
            </div>
            {(scholar.bio_id || scholar.bio || scholar.description) ? <p className="mt-4 text-sm leading-relaxed text-stone-700">{scholar.bio_id || scholar.bio || scholar.description}</p> : null}
          </section>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); router.push(`/cari?q=${encodeURIComponent(localQ)}`); }}>
            <input className="input flex-1" placeholder="Cari di materi ulama ini (filter lokal) atau tekan Cari untuk pencarian global…" value={localQ} onChange={(e) => setLocalQ(e.target.value)} aria-label="Cari materi ulama ini" />
            <button className="btn-outline" type="submit">Cari Global</button>
          </form>
          <section>
            <h2 className="mb-3 text-lg font-bold text-emerald-deep">Materi Terbit</h2>
            {shown.length === 0 ? <EmptyState title="Belum ada materi terbit dari ulama ini" body="Belum ada materi yang diterbitkan untuk ulama ini, atau tidak ada yang cocok dengan filter pencarian lokal." /> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map((m) => <MaterialCard key={m.id} m={m} />)}</div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
