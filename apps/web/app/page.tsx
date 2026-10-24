"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MaterialSummary, Scholar, Topic } from "@pustaka/shared-types";
import { api, getLocalReading, scholarName, topicName, type LocalReadingEntry } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, MaterialCard } from "@/components/ui";

// Kategori di luar fokus awal: koleksinya belum tersedia di database,
// ditampilkan jujur dengan status "Segera hadir" (tanpa angka koleksi palsu).
const UPCOMING = ["Shalat", "Puasa", "Zakat", "Akidah", "Muamalah"];

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
      const [t, m, s] = await Promise.all([api.topics(), api.materials(), api.scholars()]);
      setTopics(t); setMaterials(m); setScholars(s);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat data."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); setReading(getLocalReading()); }, [load]);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-deep text-xl text-gold" aria-hidden>✦</span>
          <div>
            <p className="text-sm font-medium text-muted">Assalamu&apos;alaikum</p>
            <h1 className="text-2xl font-extrabold leading-tight text-emerald-deep">Pustaka Ilmu</h1>
          </div>
        </div>
        <p className="mt-3 text-base text-ink">Temukan ilmu dari sumbernya.</p>
        <p className="mt-1 max-w-xl text-sm text-muted">Baca pembahasan asli para ulama beserta terjemahan Indonesianya, lengkap dengan sumber yang dapat ditelusuri.</p>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); router.push(`/cari?q=${encodeURIComponent(q)}`); }}>
          <input className="input flex-1 py-3.5 text-base" placeholder="Cari hukum, fatwa, ulama, atau persoalan..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari materi" />
          <button className="btn-primary px-6" type="submit">Cari</button>
        </form>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link href="/pustaka" className="card p-5 transition hover:shadow-md">
            <p className="text-2xl" aria-hidden>▤</p>
            <p className="mt-2 font-bold text-emerald-deep">Jelajahi Ulama</p>
            <p className="mt-1 text-sm text-muted">Temukan seluruh materi berdasarkan ulama tertentu.</p>
          </Link>
          <Link href="/cari" className="card p-5 transition hover:shadow-md">
            <p className="text-2xl" aria-hidden>⌕</p>
            <p className="mt-2 font-bold text-emerald-deep">Jelajahi Persoalan</p>
            <p className="mt-1 text-sm text-muted">Temukan pembahasan berdasarkan tema atau pertanyaan.</p>
          </Link>
        </div>
      </section>

      <section className="pattern-islamic overflow-hidden rounded-3xl px-6 py-8 text-white shadow-soft">
        <p className="text-xs font-bold uppercase tracking-widest text-gold">Featured Collection</p>
        <h2 className="mt-2 max-w-lg text-2xl font-bold">Thaharah — Panduan Memahami Hukum Bersuci</h2>
        <p className="mt-2 max-w-lg text-sm text-white/85">Koleksi unggulan tahap pertama: air, istinja, wudu dan pembatalnya, mengusap khuf, mandi wajib, tayamum, najis, serta haid dan istihadhah — dari pembahasan para ulama beserta sumber aslinya.</p>
        <Link href="/cari" className="btn-gold mt-5">Mulai Menjelajahi</Link>
      </section>

      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {loading ? <LoadingState /> : (
        <>
          {reading.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-bold text-emerald-deep">Lanjutkan Membaca</h2>
              <div className="space-y-3">
                {reading.slice(0, 3).map((r) => (
                  <Link key={r.id} href={`/materi/${r.id}`} className="card flex items-center justify-between gap-3 p-4">
                    <span>
                      <span className="block font-semibold text-emerald-deep">{r.title}</span>
                      {r.scholar ? <span className="block text-xs text-muted">{r.scholar}</span> : null}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{new Date(r.at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 text-lg font-bold text-emerald-deep">Kategori Persoalan</h2>
            {topics.length === 0 ? <EmptyState title="Belum ada kategori yang diterbitkan" body="Kategori persoalan akan tampil di sini setelah data topik tersedia dari server." /> : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {topics.map((t) => (
                  <Link key={t.id} href={`/cari?q=${encodeURIComponent(topicName(t))}`} className="card p-4">
                    {t.code ? <p className="text-xs font-bold text-gold">{t.code}</p> : null}
                    <p className="mt-1 font-semibold text-emerald-deep">{topicName(t)}</p>
                    {t.name_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-1 text-right text-base text-muted">{t.name_ar}</p> : null}
                  </Link>
                ))}
                {UPCOMING.map((name) => (
                  <div key={name} className="card bg-surface/60 p-4" aria-label={`Kategori ${name}, segera hadir`}>
                    <p className="font-semibold text-muted">{name}</p>
                    <span className="chip mt-2 border-line bg-white text-muted">Segera hadir</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-emerald-deep">Materi Terbaru</h2>
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
                      {s.name_ar ? <span dir="rtl" lang="ar" className="font-arabic block text-right text-base text-muted">{s.name_ar}</span> : null}
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
