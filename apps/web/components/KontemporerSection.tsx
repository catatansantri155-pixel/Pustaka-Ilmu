"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Topic } from "@pustaka/shared-types";
import { apiFetch } from "@/lib/api";
import {
  KONTEMPORER_GROUPS, kontemporerCountPath, kontemporerHref,
  type KontemporerGroup,
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
 *
 * Rombak desain (umpan balik user 2 Nov 2026): kartu versi pertama dinilai
 * terlalu besar dan polos. Kartu kini mengikuti pola kartu kecil aplikasi:
 * cangkang yang sama persis dengan kartu "Bab pembahasan" (w-52,
 * rounded-3xl, gambar h-20/sm:h-28 dengan istilah Arab sebagai overlay di
 * sudut gambar) dan tombol btn-primary yang jelas seperti kartu
 * "Koleksi awal". Satu gambar tema khas per kelompok (aturan gambar
 * aplikasi: tanpa makhluk bernyawa, tanpa duplikat antar-kelompok).
 * Logika data, tautan tujuan, hitungan live, dan label kaidah umum TIDAK
 * berubah dari versi pertama.
 */

/**
 * Gambar tema kartu. Bila berkas gambar gagal dimuat, tampilkan cadangan
 * bergaya: gradasi hijau–emas + istilah Arab kelompok (mengikuti pola
 * TopicCover — tidak pernah menampilkan gambar rusak / kotak abu-abu).
 */
function KontemporerCover({ group }: { group: KontemporerGroup }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className="flex h-20 w-full items-center justify-center bg-gradient-to-br from-emerald via-emerald-deep to-[#0A2A22] sm:h-28"
        role="img"
        aria-label={`Ilustrasi tema ${group.title}`}
      >
        <span dir="rtl" lang="ar" className="font-arabic text-xl leading-none text-gold">{group.name_ar}</span>
      </div>
    );
  }
  return (
    <img
      src={group.image}
      alt={`Ilustrasi tema ${group.title}`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="photo-warm h-20 w-full object-cover sm:h-28"
    />
  );
}

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
      <p className="mt-1.5 text-xs text-muted sm:text-sm">Geser untuk menjelajahi kelompok — ketuk tombol pada kartu untuk membuka materinya.</p>
      <div className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2">
        {KONTEMPORER_GROUPS.map((g) => (
          <article key={g.id} className="flex w-52 shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-soft transition motion-safe:hover:-translate-y-0.5 hover:shadow-lift">
            <div className="relative">
              <KontemporerCover group={g} />
              <span dir="rtl" lang="ar" className="font-arabic pointer-events-none absolute bottom-2 right-3 text-lg leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]">{g.name_ar}</span>
            </div>
            <div className="flex flex-1 flex-col p-3 sm:p-3.5">
              <h3 className="text-sm font-bold leading-snug text-emerald-deep">{g.title}</h3>
              {counts[g.id] != null && (
                <p className="mt-1 text-[0.6875rem] font-medium uppercase tracking-wide text-muted">{counts[g.id]} materi tertaut</p>
              )}
              <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted">{g.description}</p>
              {g.id === "kaidah-produk-modern" && (
                <p className="mt-2 rounded-xl bg-gold/15 px-2.5 py-1.5 text-[0.6875rem] font-semibold leading-snug text-emerald-deep">
                  Kaidah umum, bukan fatwa produk spesifik.
                </p>
              )}
              <div className="mt-auto flex flex-col gap-2 pt-3">
                {g.links.map((l) => (
                  <Link key={l.label} href={kontemporerHref(l, topics)} className="btn-primary w-full">
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
