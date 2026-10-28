"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Scholar } from "@pustaka/shared-types";
import { api, scholarName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { IconChevronRight, IconUsers } from "@/components/icons";
import ScholarEmblem from "@/components/ScholarEmblem";

export default function PustakaPage() {
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => { setLoading(true); setError(null); api.scholars().then(setScholars).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat.")).finally(() => setLoading(false)); }, [nonce]);
  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2.5 text-xl font-extrabold text-emerald-deep"><IconUsers className="h-6 w-6 text-emerald" /> Pustaka Ulama</h1>
      <p className="text-[13px] leading-relaxed text-stone-600 sm:text-sm">Pilih seorang ulama untuk melihat profil dan materi terbit beliau.</p>
      {error ? <ErrorState message={error} onRetry={() => setNonce((n) => n + 1)} /> : null}
      {loading ? <LoadingState /> : scholars.length === 0 ? <EmptyState title="Belum ada data ulama" body="Data ulama akan tampil di sini setelah tersedia dari server." /> : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {scholars.map((s) => (
            <Link key={s.id} href={`/pustaka/${s.id}`} className="card cv-scholar group p-4 transition motion-safe:hover:-translate-y-0.5 hover:shadow-lift sm:p-5">
              <span className="flex items-start justify-between gap-3">
                <ScholarEmblem scholar={s} size="md" />
                <IconChevronRight className="h-5 w-5 shrink-0 text-emerald transition group-hover:translate-x-0.5" />
              </span>
              <h2 className="mt-3 text-[15px] font-bold text-emerald-deep group-hover:underline sm:text-base">{scholarName(s)}</h2>
              {s.name_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-1 text-right text-base text-stone-700">{s.name_ar}</p> : null}
              {(s.death_year || s.death_year_hijri || s.died) ? <p className="mt-1 text-xs text-stone-500">Wafat: {String(s.death_year || s.death_year_hijri || s.died)}</p> : null}
              {(s.bio_id || s.bio) ? <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-stone-600 sm:text-sm">{s.bio_id || s.bio}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
