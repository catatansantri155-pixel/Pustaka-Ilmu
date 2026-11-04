"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MaterialSummary, Topic } from "@pustaka/shared-types";
import { api, apiFetch, getLocalReading, type LocalReadingEntry } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, MaterialCard } from "@/components/ui";
import TopicCover from "@/components/TopicCover";
import DailyBanner from "@/components/DailyBanner";
import KontemporerSection from "@/components/KontemporerSection";
import { imageForTopic } from "@/lib/topicImages";
import { groupTopicsByBab } from "@/lib/babs";
import { IconChevronRight, IconClock, IconSearch } from "@/components/icons";

/**
 * Beranda — port komposisi prototipe Lovable "Pustaka Ilmu" (Nov 2026),
 * direkonsiliasi dengan perilaku main: hero gradasi teal + kartu pencarian
 * menumpang, kisi kartu bab kecil berfoto sampul asli per bab, lalu Fikih
 * Kontemporer di bawah daftar bab. Perilaku data mengikuti main: kolam
 * materi limit=48 untuk banner harian, banner "Pembahasan pilihan hari
 * ini" (DailyBanner) di antara "Lanjutkan membaca" dan "Materi terbaru",
 * dan "Materi terbaru" menampilkan 6 pertama dari kolam itu.
 */
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
      {/* Hero Lovable: gradasi teal tua + pola bintang emas samar. */}
      <section className="relative">
        <div className="bg-hero-grad relative overflow-hidden rounded-[2rem] px-5 pb-16 pt-7 text-white shadow-lift sm:px-7">
          <div className="pattern-islamic pointer-events-none absolute inset-0 opacity-30" style={{ backgroundColor: "transparent" }} aria-hidden />
          <div className="relative">
            <p className="text-sm text-white/80">Assalamu&apos;alaikum</p>
            <h1 className="font-read mt-1.5 max-w-xl text-2xl font-semibold leading-snug sm:text-3xl">Apa yang ingin Anda pelajari hari ini?</h1>
            <p className="mt-2.5 max-w-prose text-sm leading-relaxed text-white/85">Telusuri fatwa para ulama berdasarkan persoalan — lengkap dengan teks Arab, terjemahan Indonesia, dan sumber aslinya.</p>
          </div>
        </div>
        {/* Kartu pencarian menumpang di tepi bawah hero (pola Lovable). */}
        <div className="relative z-10 mx-1 -mt-8 sm:mx-3">
          <form role="search" onSubmit={e => { e.preventDefault(); router.push(`/cari?q=${encodeURIComponent(q.trim())}`); }} className="rounded-2xl border border-line bg-card p-3.5 shadow-lift sm:p-4">
            <label htmlFor="home-search" className="mb-2 block text-sm font-semibold text-emerald-deep">Apa yang ingin kamu pelajari?</label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                <input id="home-search" type="search" className="input input-search min-w-0" placeholder="Misalnya: pembatal wudu" value={q} onChange={e => setQ(e.target.value)} />
              </div>
              <button className="btn-gold shrink-0" type="submit">Cari</button>
            </div>
          </form>
          {/* Tautan "Lihat pustaka menurut ulama" DIHAPUS atas permintaan
              user 4 Nov 2026 — beranda langsung ke "Lanjutkan membaca"
              sesudah kartu pencarian (posisi bagian itu ikut naik). */}
        </div>
      </section>

      {reading.length > 0 && <section aria-labelledby="continue-heading">
        <h2 id="continue-heading" className="section-heading flex items-center gap-2"><IconClock className="h-5 w-5 text-emerald" /> Lanjutkan membaca</h2>
        <div className="mt-3 space-y-2.5">{reading.slice(0, 6).map(r => (
          <Link key={r.id} href={`/materi/${r.id}`} className="card group flex items-center justify-between gap-4 p-4">
            <span className="min-w-0"><span className="block truncate font-semibold text-emerald-deep group-hover:underline">{r.title}</span>{r.scholar && <span className="text-sm text-muted">{r.scholar}</span>}</span>
            <span className="flex shrink-0 items-center gap-2 text-xs text-muted">{new Date(r.at).toLocaleDateString("id-ID", {day:"numeric",month:"short"})}<IconChevronRight className="h-4 w-4 text-emerald" /></span>
          </Link>
        ))}</div>
      </section>}

      {error ? <ErrorState message={error} onRetry={load} /> : loading ? <LoadingState label="Memuat materi dan topik…" /> : <>
        {/* PR #14: banner slideshow harian di antara "Lanjutkan membaca"
            dan "Materi terbaru" — slide berganti tiap hari (lihat
            components/DailyBanner.tsx). Tidak tampil bila daftar materi
            kosong. Dikembalikan pada rekonsiliasi port Lovable menggantikan
            banner "Materi Pilihan" statis milik port. */}
        <DailyBanner materials={materials} topics={topics} />

        <section aria-labelledby="latest-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="latest-heading" className="section-heading">Materi terbaru</h2>
            <Link href="/cari" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-emerald underline-offset-4 hover:underline">Lihat semua materi <IconChevronRight className="h-4 w-4" /></Link>
          </div>
          {materials.length === 0 ? <EmptyState title="Belum ada materi terbit" body="Materi akan tersedia setelah diterbitkan oleh admin. Kamu dapat mencoba kembali nanti." /> : <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">{materials.slice(0, 6).map(m => <MaterialCard key={m.id} m={m} uniform />)}</div>}
        </section>

        {/* Kisi bab: kartu kecil 2 kolom di ponsel (tata letak port),
            berfoto sampul ASLI per bab lewat sistem main (TopicCover +
            imageForTopic, istilah Arab sebagai overlay — koreksi user
            4 Nov 2026: gambar asli dipertahankan, pola kode tidak dipakai).
            Tiap kartu menaut ke grup bab itu di halaman /topik. Bab
            diturunkan dari grup topik API sehingga bab baru muncul
            otomatis. */}
        <section aria-labelledby="bab-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="bab-heading" className="section-heading">Bab Fikih</h2>
              <p className="mt-1 text-sm text-muted">{babGroups.length} bab · fatwa para ulama</p>
            </div>
            <Link href="/topik" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-emerald underline-offset-4 hover:underline">Semua topik <IconChevronRight className="h-4 w-4" /></Link>
          </div>
          {babGroups.length === 0 ? <div className="mt-4"><EmptyState title="Bab belum tersedia" body="Daftar bab akan tampil setelah tersedia dari server." /></div> : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {babGroups.map(g => (
                <Link key={g.prefix} href={`/topik#${g.prefix}`} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-soft transition motion-safe:hover:-translate-y-0.5 hover:shadow-lift">
                  <span className="relative block">
                    <TopicCover image={imageForTopic(g.topics[0])} className="h-20 w-full sm:h-24" />
                    {g.name_ar ? <span dir="rtl" lang="ar" className="font-arabic pointer-events-none absolute bottom-2 right-3 text-lg leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]">{g.name_ar}</span> : null}
                  </span>
                  <span className="flex flex-1 flex-col p-3 sm:p-3.5">
                    <span className="line-clamp-2 min-h-10 text-sm font-semibold leading-tight text-emerald-deep">{g.name_id}</span>
                    <span className="text-[11px] text-muted">{g.topics.length} topik</span>
                    <span className="mt-2.5 inline-flex min-h-11 items-center justify-center rounded-lg bg-secondary px-3 text-xs font-semibold text-secondary-foreground transition group-hover:bg-emerald group-hover:text-white">Buka Bab</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Bagian "Fikih Kontemporer" (arahan user 29 Okt 2026: di BAWAH
            daftar bab; dibangun 2 Nov 2026 setelah jilid Muamalah tuntas
            terbit 1.000/1.000). Mengelompokkan materi Bin Baz yang sudah
            terbit per tema transaksi masa kini — lihat
            components/KontemporerSection.tsx dan lib/kontemporer.ts. */}
        <KontemporerSection topics={topics} />
      </>}
    </div>
  );
}
