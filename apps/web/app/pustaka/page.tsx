"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Scholar } from "@pustaka/shared-types";
import { api, scholarName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";

export default function PustakaPage() {
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.scholars().then(setScholars).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat.")).finally(() => setLoading(false)); }, []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-emerald-deep">Pustaka Ulama</h1>
      <p className="text-sm text-stone-600">Pilih seorang ulama untuk melihat profil dan materi terbit beliau.</p>
      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState /> : scholars.length === 0 ? <EmptyState title="Belum ada data ulama" body="Data ulama akan tampil di sini setelah tersedia dari server." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scholars.map((s) => (
            <Link key={s.id} href={`/pustaka/${s.id}`} className="card p-5">
              <span className="font-arabic flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-deep text-2xl text-gold" aria-hidden>{(s.name_ar || scholarName(s)).slice(0, 2)}</span>
              <h2 className="mt-3 font-bold text-emerald-deep">{scholarName(s)}</h2>
              {s.name_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-1 text-right text-lg text-stone-700">{s.name_ar}</p> : null}
              {(s.death_year || s.death_year_hijri || s.died) ? <p className="mt-1 text-xs text-stone-500">Wafat: {String(s.death_year || s.death_year_hijri || s.died)}</p> : null}
              {(s.bio_id || s.bio) ? <p className="mt-2 line-clamp-3 text-sm text-stone-600">{s.bio_id || s.bio}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
