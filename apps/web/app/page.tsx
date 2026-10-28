"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MaterialSummary, Topic } from "@pustaka/shared-types";
import { api, apiFetch, getLocalReading, type LocalReadingEntry } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, MaterialCard } from "@/components/ui";
import TopicCover from "@/components/TopicCover";
import HeroSlideshow from "@/components/HeroSlideshow";
import DailyBanner from "@/components/DailyBanner";
import { imageForTopic } from "@/lib/topicImages";
import { groupTopicsByBab } from "@/lib/babs";
import { IconArrowRight, IconChevronRight, IconClock, IconSearch } from "@/components/icons";

/** Cuplikan cakupan per bab untuk kartu deretan "Koleksi awal" (PR #14). */
const BAB_DESC: Record<string, string> = {
  THA: "Pembahasan bersuci: air, wudu, mandi wajib, tayamum, dan najis — dari fatwa para ulama dengan teks Arab dan sumbernya.",
  SHL: "Pembahasan shalat: syarat dan rukun, waktu-waktu shalat, shalat berjamaah, dan hal yang membatalkannya — dari fatwa para ulama dengan teks Arab dan sumbernya.",
  JNZ: "Pembahasan jenazah: memandikan, menyalati, menguburkan, takziah, dan ziarah kubur — dari fatwa para ulama dengan teks Arab dan sumbernya.",
  ZAK: "Pembahasan zakat: harta yang wajib dizakati, nisab, dan cara menunaikannya — dari fatwa para ulama dengan teks Arab dan sumbernya.",
  SWM: "Pembahasan puasa: syarat dan pembatalnya, kafarat, dan puasa-puasa sunah — dari fatwa para ulama dengan teks Arab dan sumbernya.",
  HAJ: "Pembahasan haji dan umrah: manasik, larangan ihram, dan penyembelihan dam — dari fatwa para ulama dengan teks Arab dan sumbernya.",
};

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [reading, setReading] = useState<LocalReadingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [t, m] = await Promise.all([
        // PR #14: limit dinaikkan pada panggilan yang SAMA (bukan panggilan
        // baru) supaya banner harian punya kolam materi lintas topik yang
        // cukup untuk berganti tiap hari; "Materi terbaru" tetap menampilkan
        // 6 pertama dari daftar ini.
        api.topics(), apiFetch<{items:MaterialSummary[]}>("/api/catalog/materials?limit=48", {auth:false}),
      ]);
      setTopics(t); setMaterials(m.items);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat pustaka."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); setReading(getLocalReading()); }, [load]);
  const babGroups = groupTopicsByBab(topics);

  return (
    <div className="space-y-10 md:space-y-14">
      {/* Hero slideshow otomatis (PR #11): foto berganti tiap ±5 detik.
          Salam diberi latar kaca tipis agar tidak bertabrakan dengan foto
          slideshow mana pun yang sedang tampil. */}
      <section className="overflow-hidden rounded-[2rem] bg-emerald-deep shadow-lift">
        <div className="relative">
          <HeroSlideshow className="h-44 w-full sm:h-56" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-deep/85 via-emerald-deep/25 to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <p className="inline-block rounded-full bg-emerald-deep/55 px-3 py-1 text-sm font-medium text-gold backdrop-blur-sm">Assalamu&apos;alaikum</p>
            <h1 className="mt-1.5 max-w-xl text-2xl font-extrabold leading-tight text-white [text-shadow:0_1px_10px_rgba(10,31,68,0.5)] sm:text-3xl">Temukan ilmu dari sumbernya</h1>
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

      {/* PR #14 (28 Okt 2026): "Koleksi awal" kini deretan geser ke samping
          berisi kartu koleksi per bab (mengikuti data bab dari API lewat
          lib/babs.ts — bab baru muncul otomatis). Tiap kartu menaut ke grup
          bab itu di halaman /topik. */}
      {babGroups.length > 0 && <section aria-labelledby="collection-heading">
        <h2 id="collection-heading" className="section-heading">Koleksi awal</h2>
        <p className="mt-1.5 text-sm text-muted">Geser untuk menjelajahi koleksi per bab — ketuk satu koleksi untuk mulai membaca.</p>
        <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2">
          {babGroups.map(g => (
            <article key={g.prefix} className="card w-[85%] shrink-0 snap-start overflow-hidden sm:w-[26rem]">
              <TopicCover image={imageForTopic(g.topics[0])} className="h-36 w-full" />
              <div className="p-5">
                <h3 className="text-xl font-extrabold text-emerald-deep">{g.name_id}{g.name_ar ? <span dir="rtl" lang="ar" className="font-arabic ml-1.5 text-xl font-medium text-emerald">{g.name_ar}</span> : null}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{BAB_DESC[g.prefix] || `Pembahasan ${g.name_id} — dari fatwa para ulama dengan teks Arab, terjemahan Indonesia, dan sumbernya.`}</p>
                <Link href={`/topik#${g.prefix}`} className="btn-primary mt-4">
                  Baca materi {g.name_id} <IconArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>}

      {/* PR #14: "Lanjutkan membaca" kini deretan geser ke samping (pola
          snap-scroll yang sama dengan deretan bab PR #11). */}
      {reading.length > 0 && <section aria-labelledby="continue-heading">
        <h2 id="continue-heading" className="section-heading flex items-center gap-2"><IconClock className="h-5 w-5 text-emerald" /> Lanjutkan membaca</h2>
        <div className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2">{reading.slice(0, 6).map(r => (
          <Link key={r.id} href={`/materi/${r.id}`} className="card group flex w-[85%] shrink-0 snap-start items-center justify-between gap-4 p-4 sm:w-96">
            <span className="min-w-0"><span className="block truncate font-semibold text-emerald-deep group-hover:underline">{r.title}</span>{r.scholar && <span className="text-sm text-muted">{r.scholar}</span>}</span>
            <span className="flex shrink-0 items-center gap-2 text-xs text-muted">{new Date(r.at).toLocaleDateString("id-ID", {day:"numeric",month:"short"})}<IconChevronRight className="h-4 w-4 text-emerald" /></span>
          </Link>
        ))}</div>
      </section>}

      {error ? <ErrorState message={error} onRetry={load} /> : loading ? <LoadingState label="Memuat materi dan topik…" /> : <>
        {/* PR #14: banner slideshow harian di antara "Lanjutkan membaca"
            dan "Materi terbaru" — slide berganti tiap hari (lihat
            components/DailyBanner.tsx). Tidak tampil bila daftar materi
            kosong. */}
        <DailyBanner materials={materials} topics={topics} />

        {/* PR #14: "Materi terbaru" kini deretan geser ke samping juga.
            Kartunya memakai varian `uniform` pada MaterialCard:
            tinggi seragam dalam deretan, judul maks 2 baris, meta
            menempel di dasar kartu. */}
        <section aria-labelledby="latest-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="latest-heading" className="section-heading">Materi terbaru</h2>
            <Link href="/cari" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-emerald underline-offset-4 hover:underline">Lihat semua materi <IconChevronRight className="h-4 w-4" /></Link>
          </div>
          {materials.length === 0 ? <EmptyState title="Belum ada materi terbit" body="Materi akan tersedia setelah diterbitkan oleh admin. Kamu dapat mencoba kembali nanti." /> : <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2">{materials.slice(0, 6).map(m => <div key={m.id} className="w-[88%] min-w-0 shrink-0 snap-start sm:w-[30rem]"><MaterialCard m={m} uniform /></div>)}</div>}
        </section>

        {/* PR #11 (27 Okt 2026): seksi grid "Topik pembahasan" dan daftar
            "Pustaka ulama" TIDAK lagi tampil di Beranda (permintaan user —
            topik kini halaman sendiri /topik, ulama cukup lewat tombol Ulama).
            Sebagai gantinya: deretan BAB INTI geser-samping ala aplikasi
            mobile; bab diturunkan dari grup topik API sehingga bab baru
            (mis. Jenazah) muncul otomatis. Tiap kartu menaut ke grup bab
            itu di halaman /topik. */}
        <section aria-labelledby="bab-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="bab-heading" className="section-heading">Bab pembahasan</h2>
            <Link href="/topik" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-emerald underline-offset-4 hover:underline">Semua topik <IconChevronRight className="h-4 w-4" /></Link>
          </div>
          <p className="mt-1.5 text-sm text-muted">Geser untuk menjelajahi bab — ketuk satu bab untuk melihat topik di dalamnya.</p>
          {babGroups.length === 0 ? <div className="mt-4"><EmptyState title="Bab belum tersedia" body="Daftar bab akan tampil setelah tersedia dari server." /></div> : (
            <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2">
              {babGroups.map(g => (
                <Link key={g.prefix} href={`/topik#${g.prefix}`} className="group w-52 shrink-0 snap-start overflow-hidden rounded-3xl border border-line bg-white shadow-soft transition motion-safe:hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="relative">
                    <TopicCover image={imageForTopic(g.topics[0])} className="h-28 w-full" />
                    {g.name_ar ? <span dir="rtl" lang="ar" className="font-arabic pointer-events-none absolute bottom-2 right-3 text-lg leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]">{g.name_ar}</span> : null}
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-emerald-deep">{g.name_id}</span>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{g.topics.length} topik</span>
                    </span>
                    <IconChevronRight className="h-4 w-4 shrink-0 text-emerald transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </>}
    </div>
  );
}
