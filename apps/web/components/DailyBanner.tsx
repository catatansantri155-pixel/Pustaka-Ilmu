"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { MaterialSummary, Topic } from "@pustaka/shared-types";
import { materialTitle, topicName } from "@/lib/api";
import { imageForMaterial, type TopicImage } from "@/lib/topicImages";
import { babPrefixOf, groupTopicsByBab } from "@/lib/babs";
import TopicCover from "@/components/TopicCover";
import { IconArrowRight } from "@/components/icons";

/**
 * Banner "Pembahasan pilihan hari ini" (PR #14, permintaan user 28 Okt 2026).
 * Slideshow gambar otomatis di antara "Lanjutkan membaca" dan "Materi
 * terbaru": tiap slide = satu pembahasan dari korpus TERBIT dengan gambar
 * pool topiknya, judul, cuplikan ringkasan materinya, dan tombol
 * "Baca selanjutnya" ke halaman materi itu.
 *
 * Pemilihan slide BERGANTI TIAP HARI dan deterministik: benih dari tanggal
 * lokal (YYYY-MM-DD) mengacak urutan kandidat secara stabil — semua
 * pengunjung pada hari yang sama melihat slide yang sama, dan susunannya
 * berubah keesokan harinya. Tiap slide beda pembahasan: maksimal 1 slide
 * per topik, dan gambar tidak boleh duplikat antar slide. Pemilihan murni
 * sisi klien dari daftar materi yang sudah dimuat beranda (tanpa panggilan
 * API baru); bila daftar kosong, banner tidak dirender sama sekali.
 *
 * Perilaku slideshow meniru HeroSlideshow (PR #11/#12): crossfade ±5 detik,
 * berhenti saat tab tidak aktif atau banner keluar layar, dan diam di
 * slide pertama bila prefers-reduced-motion. Indikator titik bisa diklik
 * untuk melompat antar slide.
 */

const MAX_SLIDES = 5;
const ROTATE_MS = 5000;

interface DailySlide {
  m: MaterialSummary;
  img: TopicImage;
  babLabel: string;
  topicLabel: string;
  excerpt: string;
}

/** Hash FNV-1a 32-bit — deterministik lintas kunjungan & platform. */
function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Benih harian dari tanggal lokal pengunjung: "YYYY-MM-DD". */
function todaySeed(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function pickDailySlides(materials: MaterialSummary[], topics: Topic[], seed: string): DailySlide[] {
  const babName = new Map(groupTopicsByBab(topics).map((g) => [g.prefix, g.name_id]));
  const candidates = materials.filter((m) => m && m.id && !m.is_demo && materialTitle(m) !== "(Tanpa judul)");
  // Urutan kandidat diacak stabil oleh benih tanggal + id materi.
  const scored = candidates
    .map((m) => ({ m, score: hashStr(`${seed}:${m.id}`) }))
    .sort((a, b) => a.score - b.score)
    .map((x) => x.m);

  const picked: DailySlide[] = [];
  const usedTopics = new Set<string>();
  const usedImages = new Set<string>();
  const topicKey = (m: MaterialSummary) => {
    const t = (m.topics && m.topics[0]) || m.topic || null;
    return t?.code || t?.id || `id:${m.id}`;
  };
  const tryPick = (m: MaterialSummary, needTopic: boolean, needImage: boolean, needSummary: boolean): boolean => {
    if (picked.length >= MAX_SLIDES) return false;
    const key = topicKey(m);
    if (needTopic && usedTopics.has(key)) return false;
    const img = imageForMaterial(m);
    if (needImage && usedImages.has(img.src)) return false;
    const excerpt = (m.summary || "").replace(/\s+/g, " ").trim();
    if (needSummary && !excerpt) return false;
    const t = (m.topics && m.topics[0]) || m.topic || null;
    const prefix = babPrefixOf(t?.code);
    picked.push({
      m,
      img,
      babLabel: babName.get(prefix) || "",
      topicLabel: topicName(t),
      excerpt,
    });
    usedTopics.add(key);
    usedImages.add(img.src);
    return true;
  };
  // Lintasan ketat dulu (beda topik + beda gambar + ada cuplikan), lalu
  // dilonggarkan bertahap supaya banner tetap terisi dari kolam yang ada.
  for (const m of scored) tryPick(m, true, true, true);
  for (const m of scored) tryPick(m, true, true, false);
  for (const m of scored) tryPick(m, true, false, false);
  for (const m of scored) tryPick(m, false, false, false);
  return picked;
}

export default function DailyBanner({ materials, topics }: { materials: MaterialSummary[]; topics: Topic[] }) {
  const seed = useMemo(() => todaySeed(), []);
  const slides = useMemo(() => pickDailySlides(materials, topics, seed), [materials, topics, seed]);
  const [idx, setIdx] = useState(0);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tabHidden = document.hidden;
    let bannerHidden = false;
    const paused = () => tabHidden || bannerHidden;
    const onVis = () => { tabHidden = document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    let io: IntersectionObserver | null = null;
    if (rootRef.current && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => { bannerHidden = !entries[0]?.isIntersecting; },
        { threshold: 0 },
      );
      io.observe(rootRef.current);
    }
    const t = setInterval(() => {
      if (!paused()) setIdx((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
    };
  }, [slides.length]);

  if (slides.length === 0) return null;
  const active = Math.min(idx, slides.length - 1);

  return (
    <section ref={rootRef} aria-labelledby="daily-heading" aria-roledescription="carousel" aria-label="Pembahasan pilihan hari ini">
      <h2 id="daily-heading" className="section-heading">Pembahasan pilihan hari ini</h2>
      {/* PR mobile-compact: tinggi banner di ponsel 22rem→18rem dan radius
          2rem→1.5rem; sm: ke atas persis seperti sebelumnya. */}
      <div className="relative mt-3 h-72 overflow-hidden rounded-3xl bg-emerald-deep shadow-lift sm:mt-4 sm:h-80 sm:rounded-[2rem]">
        {slides.map((s, i) => {
          const isActive = i === active;
          const label = [s.babLabel, s.topicLabel].filter(Boolean).join(" · ");
          return (
            <div
              key={s.m.id}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <TopicCover image={s.img} eager={i === 0} className="absolute inset-0 h-full w-full" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-deep/90 via-emerald-deep/35 to-emerald-deep/10" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-7">
                {label ? (
                  <p className="inline-block max-w-full truncate rounded-full bg-emerald-deep/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gold backdrop-blur-sm">{label}</p>
                ) : null}
                <h3 className="mt-2 line-clamp-2 max-w-xl text-lg font-extrabold leading-snug text-white [text-shadow:0_1px_10px_rgba(10,31,68,0.5)] sm:text-2xl">{materialTitle(s.m)}</h3>
                {s.excerpt ? <p className="mt-1.5 line-clamp-2 max-w-prose text-[13px] leading-relaxed text-white/85 sm:text-sm">{s.excerpt}</p> : null}
                <Link
                  href={`/materi/${s.m.id}`}
                  tabIndex={isActive ? 0 : -1}
                  className="btn-gold mt-3.5"
                  aria-label={`Baca selanjutnya: ${materialTitle(s.m)}`}
                >
                  Baca selanjutnya <IconArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
        {slides.length > 1 ? (
          <div className="absolute right-4 top-4 z-10 flex gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.m.id}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}: ${materialTitle(s.m)}`}
                aria-current={i === active}
                className={`h-2.5 rounded-full shadow-soft transition-all ${i === active ? "w-6 bg-gold" : "w-2.5 bg-white/60 hover:bg-white/85"}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
