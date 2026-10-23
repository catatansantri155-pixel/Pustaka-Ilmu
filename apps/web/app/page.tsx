"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MaterialSummary, Scholar, Topic } from "@pustaka/shared-types";
import { api, scholarName, topicName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, MaterialCard } from "@/components/ui";

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [t, m, s] = await Promise.all([api.topics(), api.materials(), api.scholars()]);
        setTopics(t); setMaterials(m); setScholars(s);
      } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat data."); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-stone-600">Assalamu&apos;alaikum</p>
        <h1 className="mt-1 text-3xl font-extrabold text-emerald-deep">Pustaka Ilmu</h1>
        <p className="mt-1 max-w-xl text-sm text-stone-600">Perpustakaan fatwa dan khazanah Islam. Baca teks Arab beserta terjemahan Indonesianya.</p>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); router.push(`/cari?q=${encodeURIComponent(q)}`); }}>
          <input className="input flex-1 py-3 text-base" placeholder="Cari persoalan, misalnya wudu, tayamum, shalat…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari materi" />
          <button className="btn-primary px-6" type="submit">Cari</button>
        </form>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link href="/pustaka" className="card p-4 text-center font-semibold text-emerald-deep">Jelajahi Ulama</Link>
          <Link href="/cari" className="card p-4 text-center font-semibold text-emerald-deep">Jelajahi Persoalan</Link>
        </div>
      </section>

      <section className="pattern-islamic overflow-hidden rounded-3xl px-6 py-8 text-white shadow-soft">
        <p className="text-xs font-bold uppercase tracking-widest text-gold">Fokus Awal: Thaharah</p>
        <h2 className="mt-2 max-w-lg text-2xl font-bold">Bersuci sebagai pintu ibadah</h2>
        <p className="mt-2 max-w-lg text-sm text-white/85">Kumpulan materi awal pustaka ini berfokus pada persoalan thaharah: air, najis, wudu, mandi, tayamum, dan persoalan terkait, sebagaimana dibahas para ulama.</p>
        <Link href="/cari" className="btn-gold mt-5">Mulai Menjelajahi</Link>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState /> : (
        <>
          <section>
            <h2 className="mb-3 text-lg font-bold text-emerald-deep">Kategori Persoalan</h2>
            {topics.length === 0 ? <EmptyState title="Belum ada kategori yang diterbitkan" body="Kategori persoalan akan tampil di sini setelah data topik tersedia dari server." /> : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {topics.map((t) => (
                  <Link key={t.id} href={`/cari?q=${encodeURIComponent(topicName(t))}`} className="card p-4">
                    {t.code ? <p className="text-xs font-bold text-gold">{t.code}</p> : null}
                    <p className="mt-1 font-semibold text-emerald-deep">{topicName(t)}</p>
                    {t.name_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-1 text-right text-base text-stone-600">{t.name_ar}</p> : null}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-emerald-deep">Materi Terbit</h2>
            {materials.length === 0 ? (
              <EmptyState title="Belum ada materi yang diterbitkan" body="Belum ada materi yang diterbitkan. Materi akan tampil di sini setelah melalui proses penelaahan dan diterbitkan oleh admin." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{materials.map((m) => <MaterialCard key={m.id} m={m} />)}</div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-emerald-deep">Para Ulama</h2>
            {scholars.length === 0 ? <EmptyState title="Belum ada data ulama" body="Data ulama akan tampil di sini setelah tersedia dari server." /> : (
              <div className="grid gap-4 sm:grid-cols-3">
                {scholars.slice(0, 3).map((s) => (
                  <Link key={s.id} href={`/pustaka/${s.id}`} className="card flex items-center gap-4 p-5">
                    <span className="font-arabic flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-deep text-xl text-gold" aria-hidden>{(s.name_ar || scholarName(s)).slice(0, 2)}</span>
                    <span>
                      <span className="block font-bold text-emerald-deep">{scholarName(s)}</span>
                      {s.name_ar ? <span dir="rtl" lang="ar" className="font-arabic block text-right text-base text-stone-600">{s.name_ar}</span> : null}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
