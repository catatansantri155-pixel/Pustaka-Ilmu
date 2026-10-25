"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MaterialSummary, Scholar, Topic } from "@pustaka/shared-types";
import { api, apiFetch, getLocalReading, scholarName, topicName, type LocalReadingEntry } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, MaterialCard } from "@/components/ui";
import TopicCover from "@/components/TopicCover";
import ScholarEmblem from "@/components/ScholarEmblem";
import { HOME_HERO, imageForTopic, topicArabic } from "@/lib/topicImages";
import { IconArrowRight, IconChevronRight, IconClock, IconSearch } from "@/components/icons";

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
    <div className="space-y-10 md:space-y-14">
      {/* Hero fotografis hangat + pencarian utama */}
      <section className="overflow-hidden rounded-[2rem] bg-emerald-deep shadow-lift">
        <div className="relative">
          <TopicCover image={HOME_HERO} className="h-44 w-full sm:h-56" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/85 via-emerald-deep/25 to-transparent" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <p className="text-sm font-medium text-gold">Assalamu&apos;alaikum</p>
            <h1 className="mt-1 max-w-xl text-2xl font-extrabold leading-tight text-white sm:text-3xl">Temukan ilmu dari sumbernya</h1>
          </div>
        </div>
        <div className="p-5 sm:p-7 sm:pt-5">
          <p className="max-w-prose text-sm leading-relaxed text-white/85">Telusuri fatwa para ulama berdasarkan persoalan — lengkap dengan teks Arab, terjemahan Indonesia, dan sumber aslinya.</p>
          <form role="search" className="mt-5" onSubmit={e => { e.preventDefault(); router.push(`/cari?q=${encodeURIComponent(q.trim())}`); }}>
            <label htmlFor="home-search" className="mb-2 block text-sm font-semibold text-white">Apa yang ingin kamu pelajari?</label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                <input id="home-search" type="search" className="input input-search min-w-0" placeholder="Misalnya: pembatal wudu" value={q} onChange={e => setQ(e.target.value)} />
              </div>
              <button className="btn-gold shrink-0" type="submit">Cari</button>
            </div>
          </form>
          <Link href="/pustaka" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-gold underline-offset-4 hover:underline">
            Lihat pustaka menurut ulama <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Satu blok koleksi: Thaharah */}
      <section className="card overflow-hidden" aria-labelledby="collection-heading">
        <div className="grid sm:grid-cols-[1fr_1.2fr]">
          <TopicCover image={imageForTopic(thaharah || topics[3] || null)} className="h-36 w-full sm:h-full sm:min-h-44" />
          <div className="p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald">Koleksi awal</p>
            <h2 id="collection-heading" className="mt-1.5 text-xl font-extrabold text-emerald-deep">Thaharah <span dir="rtl" lang="ar" className="font-arabic ml-1 text-xl font-medium text-emerald">الطهارة</span></h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Pembahasan bersuci: air, wudu, mandi wajib, tayamum, dan najis — dari fatwa para ulama dengan teks Arab dan sumbernya.</p>
            <Link href={thaharah ? `/cari?topic_id=${encodeURIComponent(thaharah.id)}` : "/cari"} className="btn-primary mt-4">
              Baca materi Thaharah <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {reading.length > 0 && <section aria-labelledby="continue-heading">
        <h2 id="continue-heading" className="section-heading flex items-center gap-2"><IconClock className="h-5 w-5 text-emerald" /> Lanjutkan membaca</h2>
        <div className="mt-3 space-y-2.5">{reading.slice(0, 3).map(r => (
          <Link key={r.id} href={`/materi/${r.id}`} className="card group flex items-center justify-between gap-4 p-4">
            <span className="min-w-0"><span className="block truncate font-semibold text-emerald-deep group-hover:underline">{r.title}</span>{r.scholar && <span className="text-sm text-muted">{r.scholar}</span>}</span>
            <span className="flex shrink-0 items-center gap-2 text-xs text-muted">{new Date(r.at).toLocaleDateString("id-ID", {day:"numeric",month:"short"})}<IconChevronRight className="h-4 w-4 text-emerald" /></span>
          </Link>
        ))}</div>
      </section>}

      {error ? <ErrorState message={error} onRetry={load} /> : loading ? <LoadingState label="Memuat materi, topik, dan ulama…" /> : <>
        <section aria-labelledby="latest-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="latest-heading" className="section-heading">Materi terbaru</h2>
            <Link href="/cari" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-emerald underline-offset-4 hover:underline">Lihat semua materi <IconChevronRight className="h-4 w-4" /></Link>
          </div>
          {materials.length === 0 ? <EmptyState title="Belum ada materi terbit" body="Materi akan tersedia setelah diterbitkan oleh admin. Kamu dapat mencoba kembali nanti." /> : <div className="mt-4 grid gap-4 md:grid-cols-2">{materials.map(m => <MaterialCard key={m.id} m={m} />)}</div>}
        </section>

        <section id="topik" aria-labelledby="topics-heading" className="scroll-mt-24">
          <h2 id="topics-heading" className="section-heading">Topik pembahasan</h2>
          <p className="mt-1.5 text-sm text-muted">Sepuluh bab Thaharah — pilih satu untuk melihat fatwa di dalamnya.</p>
          {topics.length === 0 ? <div className="mt-4"><EmptyState title="Topik belum tersedia" body="Daftar topik akan tampil setelah tersedia dari server." /></div> : (
            <div className="mt-4 grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-3">
              {topics.map(t => (
                <Link key={t.id} href={`/cari?topic_id=${encodeURIComponent(t.id)}`} className="group overflow-hidden rounded-3xl border border-line bg-white shadow-soft transition motion-safe:hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="relative">
                    <TopicCover image={imageForTopic(t)} className="h-24 w-full sm:h-28" />
                    <span dir="rtl" lang="ar" className="font-arabic absolute bottom-2 right-3 text-lg leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]">{topicArabic(t)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-emerald-deep">{topicName(t)}</span>
                      {t.code ? <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{t.code}</span> : null}
                    </span>
                    <IconChevronRight className="h-4 w-4 shrink-0 text-emerald transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="scholars-heading">
          <h2 id="scholars-heading" className="section-heading">Pustaka ulama</h2>
          <p className="mt-1.5 text-sm text-muted">Pilih ulama untuk melihat profil dan materi beliau.</p>
          {scholars.length === 0 ? <div className="mt-4"><EmptyState title="Data ulama belum tersedia" body="Coba kembali setelah data tersedia dari server." /></div> : (
            <div className="mt-4 space-y-2.5">
              {scholars.map(s => (
                <Link key={s.id} href={`/pustaka/${s.id}`} className="card group flex items-center gap-4 p-4">
                  <ScholarEmblem scholar={s} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-emerald-deep group-hover:underline">{scholarName(s)}</span>
                    {s.name_ar && <span dir="rtl" lang="ar" className="font-arabic block truncate text-right text-base text-muted">{s.name_ar}</span>}
                  </span>
                  <IconChevronRight className="h-4 w-4 shrink-0 text-emerald transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </>}
    </div>
  );
}
