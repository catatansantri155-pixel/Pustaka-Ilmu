"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Topic } from "@pustaka/shared-types";
import { apiFetch } from "@/lib/api";
import {
  KONTEMPORER_GROUPS, kontemporerCountPath, kontemporerHref,
} from "@/lib/kontemporer";
import { IconArrowRight } from "@/components/icons";

/**
 * Bagian "Fikih Kontemporer" di Beranda, di BAWAH daftar bab (arahan user
 * 29 Okt 2026; dibangun 2 Nov 2026 setelah jilid Muamalah tuntas terbit).
 * Mengelompokkan materi Bin Baz yang sudah terbit menurut tema transaksi
 * masa kini — peta kelompoknya di lib/kontemporer.ts mengikuti
 * docs/Peta-Fikih-Kontemporer-BinBaz.md. Jumlah materi tiap kartu dihitung
 * langsung dari endpoint katalog yang sama dengan komponen lain
 * (limit=1, hanya membaca totalnya); bila hitungan gagal, kartu tetap
 * tampil tanpa angka.
 */
export default function KontemporerSection({ topics }: { topics: Topic[] }) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, number> = {};
      await Promise.all(KONTEMPORER_GROUPS.map(async (g) => {
        let total = 0;
        let any = false;
        for (const link of g.links) {
          const path = kontemporerCountPath(link, topics);
          if (!path) continue;
          try {
            const r = await apiFetch<{ total: number }>(path, { auth: false });
            if (typeof r?.total === "number") { total += r.total; any = true; }
          } catch { /* abaikan: kartu tampil tanpa hitungan tautan ini */ }
        }
        if (any) next[g.id] = total;
      }));
      if (!cancelled) setCounts(next);
    })();
    return () => { cancelled = true; };
  }, [topics]);

  return (
    <section aria-labelledby="kontemporer-heading">
      <h2 id="kontemporer-heading" className="section-heading">Fikih Kontemporer</h2>
      <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-muted sm:text-sm">
        Pembahasan Syaikh Bin Baz tentang persoalan transaksi masa kini, dihimpun dari materi
        yang sudah terbit. Beliau wafat pada 1999, jadi produk modern seperti kripto, dompet
        digital, dan paylater tidak dibahas langsung oleh beliau — untuk tema-tema itu yang
        ditampilkan adalah kaidah umum beliau, bukan fatwa produk spesifik.
      </p>
      <div className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2">
        {KONTEMPORER_GROUPS.map((g) => (
          <article key={g.id} className="flex w-72 shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-soft sm:w-80">
            <div className="flex h-20 items-center justify-center bg-emerald-deep">
              <span dir="rtl" lang="ar" className="font-arabic text-2xl leading-none text-gold">{g.name_ar}</span>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="text-sm font-bold text-emerald-deep sm:text-base">{g.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-sm">{g.description}</p>
              {counts[g.id] != null && (
                <p className="mt-2.5 text-[11px] font-medium uppercase tracking-wide text-muted">{counts[g.id]} materi tertaut</p>
              )}
              <div className="mt-auto pt-3">
                {g.links.map((l) => (
                  <Link key={l.label} href={kontemporerHref(l, topics)} className="flex min-h-11 items-center gap-1.5 text-sm font-semibold text-emerald underline-offset-4 hover:underline">
                    {l.label} <IconArrowRight className="h-4 w-4 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
