"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Topic } from "@pustaka/shared-types";
import { api, topicName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import TopicCover from "@/components/TopicCover";
import { groupTopicsByBab } from "@/lib/babs";
import { imageForTopic, topicArabic } from "@/lib/topicImages";
import { IconChevronRight, IconLayers } from "@/components/icons";

/**
 * Halaman Topik (PR #11, permintaan user 27 Okt 2026): item "Topik" kembali
 * sebagai halaman sendiri — semua topik tergrup per bab inti (Thaharah,
 * Shalat, Jenazah, … mengikuti awalan kode topik API). Beranda menaut ke
 * halaman ini dengan jangkar grup bab (/topik#SHL dsb.).
 */
export default function TopikPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setTopics(await api.topics()); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat topik."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  // Jangkar grup bab dari Beranda: setelah data tampil, gulir ke grupnya.
  // (Peramban melompat sebelum konten klien selesai dirender, jadi lompatan
  // bawaan untuk #THA/#SHL sering meleset — ulangi di sini secara eksplisit.)
  useEffect(() => {
    if (loading || topics.length === 0) return;
    const id = window.location.hash.replace("#", "");
    if (id) document.getElementById(id)?.scrollIntoView();
  }, [loading, topics]);
  const groups = groupTopicsByBab(topics);

  return (
    <div className="space-y-9">
      <header>
        <h1 className="flex items-center gap-2.5 text-xl font-extrabold text-emerald-deep">
          <IconLayers className="h-6 w-6 text-emerald" /> Topik pembahasan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">Semua topik tergrup menurut babnya — pilih satu topik untuk melihat fatwa di dalamnya.</p>
      </header>
      {error ? <ErrorState message={error} onRetry={load} /> : loading ? <LoadingState label="Memuat topik…" /> : topics.length === 0 ? (
        <EmptyState title="Topik belum tersedia" body="Daftar topik akan tampil setelah tersedia dari server." />
      ) : groups.map(g => (
        <section key={g.prefix} id={g.prefix} aria-labelledby={`bab-${g.prefix}`} className="scroll-mt-24">
          <h2 id={`bab-${g.prefix}`} className="section-heading flex flex-wrap items-baseline gap-x-2.5">
            {g.name_id}
            {g.name_ar ? <span dir="rtl" lang="ar" className="font-arabic text-lg font-medium text-emerald">{g.name_ar}</span> : null}
            <span className="text-xs font-medium text-muted">{g.topics.length} topik</span>
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-3">
            {g.topics.map(t => (
              <Link key={t.id} href={`/cari?topic_id=${encodeURIComponent(t.id)}`} className="cv-topic group overflow-hidden rounded-3xl border border-line bg-white shadow-soft transition motion-safe:hover:-translate-y-0.5 hover:shadow-lift">
                <div className="relative">
                  <TopicCover image={imageForTopic(t)} className="h-24 w-full sm:h-28" />
                  <span dir="rtl" lang="ar" className="font-arabic pointer-events-none absolute bottom-2 right-3 text-lg leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]">{topicArabic(t)}</span>
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
        </section>
      ))}
    </div>
  );
}
