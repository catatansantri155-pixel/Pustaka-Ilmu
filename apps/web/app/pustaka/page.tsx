"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Scholar } from "@pustaka/shared-types";
import { api, scholarName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { IconChevronRight, IconUsers } from "@/components/icons";

export default function PustakaPage() {
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => { setLoading(true); setError(null); api.scholars().then(setScholars).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat.")).finally(() => setLoading(false)); }, [nonce]);
  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2.5 text-xl font-extrabold text-emerald-deep"><IconUsers className="h-6 w-6 text-emerald" /> Pustaka Ulama</h1>
      <p className="text-sm leading-relaxed text-stone-600">Pilih seorang ulama untuk melihat profil dan materi terbit beliau.</p>
      {error ? <ErrorState message={error} onRetry={() => setNonce((n) => n + 1)} /> : null}
      {loading ? <LoadingState /> : scholars.length === 0 ? <EmptyState title="Belum ada data ulama" body="Data ulama akan tampil di sini setelah tersedia dari server." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scholars.map((s) => (
            <Link key={s.id} href={`/pustaka/${s.id}`} className="card group p-5 transition motion-safe:hover:-translate-y-0.5 hover:shadow-lift">
              <span className="flex items-start justify-between gap-3">
                <span className="font-arabic flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-deep text-xl text-gold" aria-hidden>{(s.name_ar || scholarName(s)).slice(0, 2)}</span>
                <IconChevronRight className="h-5 w-5 shrink-0 text-emerald transition group-hover:translate-x-0.5" />
              </span>
              <h2 className="mt-3 text-base font-bold text-emerald-deep group-hover:underline">{scholarName(s)}</h2>
              {s.name_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-1 text-right text-base text-stone-700">{s.name_ar}</p> : null}
              {(s.death_year || s.death_year_hijri || s.died) ? <p className="mt-1 text-xs text-stone-500">Wafat: {String(s.death_year || s.death_year_hijri || s.died)}</p> : null}
              {(s.bio_id || s.bio) ? <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">{s.bio_id || s.bio}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
