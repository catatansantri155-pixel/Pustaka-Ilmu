"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MaterialSummary, Scholar, Topic } from "@pustaka/shared-types";
import { api, apiFetch, getLocalReading, scholarName, topicName, type LocalReadingEntry } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, MaterialCard } from "@/components/ui";

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [reading, setReading] = useState<LocalReadingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [t, m, s] = await Promise.all([
        api.topics(), apiFetch<{items:MaterialSummary[]}>("/api/catalog/materials?limit=6", {auth:false}), api.scholars(),
      ]);
      setTopics(t); setMaterials(m.items); setScholars(s);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat pustaka."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); setReading(getLocalReading()); }, [load]);
  const thaharah = topics.find(t => /thaharah|taharah|طهارة/i.test(`${t.name_id} ${t.name_ar} ${t.code}`));

  return (
    <div className="space-y-12 md:space-y-16">
      <section className="grid gap-8 border-b border-line pb-10 md:grid-cols-[1.5fr_1fr] md:gap-12 md:pb-14">
        <div>
          <h1 className="max-w-xl text-3xl font-bold leading-tight text-emerald-deep sm:text-4xl lg:text-5xl">Baca pembahasan fikih dari sumbernya.</h1>
          <p className="mt-5 max-w-prose text-base text-muted">Teks Arab para ulama, terjemahan Indonesia, dan rujukan asli dalam satu tempat.</p>
          <form role="search" className="mt-7" onSubmit={e => { e.preventDefault(); router.push(`/cari?q=${encodeURIComponent(q.trim())}`); }}>
            <label htmlFor="home-search" className="mb-2 block text-sm font-semibold">Apa yang ingin kamu pelajari?</label>
            <div className="flex gap-2">
              <input id="home-search" type="search" className="input flex-1" placeholder="Misalnya: pembatal wudu" value={q} onChange={e => setQ(e.target.value)} />
              <button className="btn-primary" type="submit">Cari</button>
            </div>
          </form>
          <Link href="/pustaka" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-emerald underline underline-offset-4">Lihat pustaka menurut ulama</Link>
        </div>
        <aside className="self-start rounded-lg bg-emerald-deep p-6 text-white md:p-8" aria-labelledby="collection-heading">
          <p className="text-sm text-gold">Koleksi awal</p>
          <h2 id="collection-heading" className="mt-3 text-3xl font-bold">Thaharah</h2>
          <p className="font-arabic mt-1 text-3xl text-gold" lang="ar" dir="rtl">الطهارة</p>
          <p className="mt-5 text-sm leading-relaxed">Pembahasan bersuci: air, wudu, mandi wajib, tayamum, dan najis.</p>
          <Link href={thaharah ? `/cari?topic_id=${encodeURIComponent(thaharah.id)}` : "/cari?q=thaharah"} className="btn-gold mt-6">Baca materi Thaharah</Link>
        </aside>
      </section>

      {reading.length > 0 && <section aria-labelledby="continue-heading">
        <h2 id="continue-heading" className="section-heading">Lanjutkan membaca</h2>
        <div className="mt-3 divide-y divide-line">{reading.slice(0, 3).map(r => (
          <Link key={r.id} href={`/materi/${r.id}`} className="flex items-center justify-between gap-4 py-4 hover:underline">
            <span><span className="block font-semibold text-emerald-deep">{r.title}</span>{r.scholar && <span className="text-sm text-muted">{r.scholar}</span>}</span>
            <span className="shrink-0 text-xs text-muted">{new Date(r.at).toLocaleDateString("id-ID", {day:"numeric",month:"short"})}</span>
          </Link>
        ))}</div>
      </section>}

      {error ? <ErrorState message={error} onRetry={load} /> : loading ? <LoadingState label="Memuat materi, topik, dan ulama…" /> : <>
        <section aria-labelledby="latest-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="latest-heading" className="section-heading">Materi terbaru</h2>
            <Link href="/cari" className="inline-flex min-h-11 items-center text-sm text-emerald underline underline-offset-4">Lihat semua materi</Link>
          </div>
          {materials.length === 0 ? <EmptyState title="Belum ada materi terbit" body="Materi akan tersedia setelah diterbitkan oleh admin. Kamu dapat mencoba kembali nanti." /> : <div className="grid gap-x-10 md:grid-cols-2">{materials.map(m => <MaterialCard key={m.id} m={m} />)}</div>}
        </section>
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <section aria-labelledby="topics-heading">
            <h2 id="topics-heading" className="section-heading">Topik pembahasan</h2>
            <div className="mt-4">{topics.length === 0 ? <EmptyState title="Topik belum tersedia" body="Daftar topik akan tampil setelah tersedia dari server." /> : topics.map(t => (
              <Link key={t.id} href={`/cari?topic_id=${encodeURIComponent(t.id)}`} className="topic-link">
                <span className="font-semibold">{topicName(t)}</span>
                {t.name_ar && <span dir="rtl" lang="ar" className="font-arabic text-lg text-muted">{t.name_ar}</span>}
              </Link>
            ))}</div>
          </section>
          <section aria-labelledby="scholars-heading">
            <h2 id="scholars-heading" className="section-heading">Pustaka ulama</h2>
            <p className="mt-2 text-sm text-muted">Pilih ulama untuk melihat profil dan materi beliau.</p>
            <div className="mt-4">{scholars.length === 0 ? <EmptyState title="Data ulama belum tersedia" body="Coba kembali setelah data tersedia dari server." /> : scholars.map(s => (
              <Link key={s.id} href={`/pustaka/${s.id}`} className="block border-b border-line py-4 hover:bg-surface">
                <span className="block font-semibold text-emerald-deep">{scholarName(s)}</span>
                {s.name_ar && <span dir="rtl" lang="ar" className="font-arabic mt-1 block text-right text-xl text-muted">{s.name_ar}</span>}
              </Link>
            ))}</div>
          </section>
        </div>
      </>}
      <footer className="border-t border-line pt-6 text-sm text-muted">Pustaka Ilmu · Teks Arab dan terjemahan Indonesia. Catatan sumber tersedia pada setiap materi.</footer>
    </div>
  );
}
