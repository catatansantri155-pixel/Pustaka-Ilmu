import type { Scholar } from "@pustaka/shared-types";
import { scholarName } from "@/lib/api";
import { scholarImage } from "@/lib/scholarImages";

const SIZES = {
  lg: "h-16 w-16 rounded-3xl text-2xl",
  md: "h-14 w-14 rounded-2xl text-xl",
  sm: "h-12 w-12 rounded-2xl text-lg",
} as const;
const PX = { lg: 64, md: 56, sm: 48 } as const;

/** Lambang ulama: foto bila tersedia (lihat lib/scholarImages), selain itu monogram huruf Arab. */
export default function ScholarEmblem({ scholar, size = "md" }: { scholar: Scholar; size?: keyof typeof SIZES }) {
  const cls = SIZES[size];
  const img = scholarImage(scholar);
  if (img) {
    // PR #12: foto lambang selalu di bawah lipatan daftar — lazy + decoding
    // async + dimensi tegas sesuai ukuran tampilnya (anti geser tata letak).
    return <img src={img} alt="" aria-hidden loading="lazy" decoding="async" width={PX[size]} height={PX[size]} className={`${cls} shrink-0 object-cover`} />;
  }
  return (
    <span className={`font-arabic flex ${cls} shrink-0 items-center justify-center bg-emerald-deep text-gold`} aria-hidden>
      {(scholar.name_ar || scholarName(scholar)).slice(0, 2)}
    </span>
  );
}
