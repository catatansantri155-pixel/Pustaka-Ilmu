"use client";
import { useEffect, useState } from "react";
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
 */
const SLIDES: TopicImage[] = [
  HOME_HERO,
  TOPIC_IMAGES["THA-10"],
  TOPIC_IMAGES["THA-01"],
  TOPIC_IMAGES["THA-08"],
];

export default function HeroSlideshow({ className = "" }: { className?: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`relative overflow-hidden ${className}`} role="img" aria-label={SLIDES[0].alt}>
      {SLIDES.map((s, i) => (
        <div
          key={s.src}
          aria-hidden={i !== idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === idx ? "opacity-100" : "opacity-0"}`}
        >
          <TopicCover image={s} className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}
