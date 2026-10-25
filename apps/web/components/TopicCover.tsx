"use client";
import { useState } from "react";
import type { TopicImage } from "@/lib/topicImages";
import { IconDroplet } from "@/components/icons";

/**
 * Sampul foto topik. Bila berkas foto gagal dimuat, tampilkan cadangan
 * bergaya: gradasi hijau–emas + ikon + kata Arab topik (tidak pernah
 * menampilkan gambar rusak / kotak abu-abu).
 */
export default function TopicCover({
  image,
  className = "",
}: {
  image: TopicImage;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-emerald via-emerald-deep to-[#0A2A22] text-gold ${className}`}
        role="img"
        aria-label={image.alt}
      >
        <span className="flex flex-col items-center gap-1 p-2 text-center">
          <IconDroplet className="h-6 w-6 opacity-80" />
          <span dir="rtl" lang="ar" className="font-arabic text-xl leading-none">{image.ar}</span>
        </span>
      </div>
    );
  }
  return (
    <img
      src={image.src}
      alt={image.alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`photo-warm object-cover ${className}`}
      style={image.position ? { objectPosition: image.position } : undefined}
    />
  );
}
