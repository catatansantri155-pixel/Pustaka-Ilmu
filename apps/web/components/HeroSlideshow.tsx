"use client";
import { useEffect, useRef, useState } from "react";
import TopicCover from "@/components/TopicCover";
import { HOME_HERO, TOPIC_IMAGES, type TopicImage } from "@/lib/topicImages";

/**
 * Slideshow hero Beranda (PR #11, permintaan user 27 Okt 2026): foto berganti
 * otomatis tiap ±5 detik dengan crossfade halus supaya beranda terasa hidup.
 * Foto HANYA dari pool yang sudah ada dan sudah teraudit aturan user
 * (tanpa makhluk bernyawa): rehal mushaf, masjid saat senja, air jernih,
 * bukit pasir. Kredit keempat fotografernya sudah tercantum di footer
 * (PHOTO_CREDITS memuat seluruh TOPIC_IMAGES + sampul umum).
 * Gerak dikurangi: bila pengguna meminta prefers-reduced-motion, slideshow
 * berhenti di foto pertama (transisi juga dimatikan oleh CSS global).
 *
 * PR #12 (ringan): slideshow kini berhenti berputar saat tab tidak aktif
 * (visibilitychange) atau hero sudah tergulir keluar layar
 * (IntersectionObserver) — tidak membakar CPU/baterai untuk animasi yang
 * tidak sedang dilihat. Slide pertama dimuat eager (di atas lipatan),
 * slide berikutnya tetap lazy.
 */
const SLIDES: TopicImage[] = [
  HOME_HERO,
  TOPIC_IMAGES["THA-10"],
  TOPIC_IMAGES["THA-01"],
  TOPIC_IMAGES["THA-08"],
];

export default function HeroSlideshow({ className = "" }: { className?: string }) {
  const [idx, setIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tabHidden = document.hidden;
    let heroHidden = false;
    const paused = () => tabHidden || heroHidden;
    const onVis = () => { tabHidden = document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    let io: IntersectionObserver | null = null;
    if (rootRef.current && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => { heroHidden = !entries[0]?.isIntersecting; },
        { threshold: 0 },
      );
      io.observe(rootRef.current);
    }
    const t = setInterval(() => {
      if (!paused()) setIdx((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
    };
  }, []);
  return (
    <div ref={rootRef} className={`relative overflow-hidden ${className}`} role="img" aria-label={SLIDES[0].alt}>
      {SLIDES.map((s, i) => (
        <div
          key={s.src}
          aria-hidden={i !== idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === idx ? "opacity-100" : "opacity-0"}`}
        >
          <TopicCover image={s} eager={i === 0} className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}
