"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  IconBookmark, IconGrid, IconHeadphones, IconHome,
  IconSearch, IconUsers,
} from "@/components/icons";
import { PHOTO_CREDITS } from "@/lib/topicImages";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const NAV_MAIN: Array<{ href: string; label: string; icon: IconType }> = [
  { href: "/", label: "Beranda", icon: IconHome },
  { href: "/cari", label: "Cari", icon: IconSearch },
  { href: "/pustaka", label: "Ulama", icon: IconUsers },
  { href: "/tersimpan", label: "Tersimpan", icon: IconBookmark },
];
const NAV_EXTRA: Array<{ href: string; label: string; icon: IconType }> = [
  { href: "/cari", label: "Katalog", icon: IconGrid },
  { href: "/audio", label: "Audio", icon: IconHeadphones },
];

export default function ReaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return <>{children}</>;
  const active = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };
  // Satu pintu per tujuan: "Katalog" (NAV_EXTRA[0]) menuju /cari yang sama
  // dengan "Cari" — dua tombol berdampingan ke halaman yang sama terasa
  // menyatu/duplikat, jadi nav desktop hanya memakai satu di antaranya.
  const desktopNav = [...NAV_MAIN, NAV_EXTRA[1]];
  return (
    <div className="reader-shell min-h-screen bg-ivory pt-[65px]">
      <a className="skip-link" href="#konten-utama">Langsung ke isi</a>

      {/* Header FIXED (bukan sticky) — PR #10 lanjutan, bukti tangkapan layar
          user 27 Okt 2026: di ponsel nyata header sticky TIDAK menempel saat
          halaman digulir. Fixed menempel ke viewport tanpa bergantung pada
          wadah gulir leluhur mana pun, jadi selalu diam di atas. Kompensasinya:
          padding-top 65px pada .reader-shell di atas (tinggi header = py-2.5
          20px + isi h-11 44px + border 1px), dan jangkar tetap aman karena
          scroll-padding-top html 5rem dan scroll-margin segmen 6rem > 65px. */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/60 bg-white/70 shadow-[0_8px_30px_-12px_rgba(10,31,68,0.18)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2.5" aria-label="Maktabah Al-'Ilmiyyah — Beranda">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
              <img src="/images/logo-maktabah.png" alt="" aria-hidden className="h-full w-full object-contain p-0.5" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-extrabold tracking-tight text-emerald-deep">Maktabah Al-'Ilmiyyah</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Perpustakaan Fatwa &amp; Khazanah</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
            {desktopNav.map((n) => {
              const Icon = n.icon;
              const isActive = active(n.href);
              return (
                <Link
                  key={n.label}
                  href={n.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 text-sm transition ${isActive ? "bg-emerald font-bold text-white shadow-soft" : "text-emerald-deep hover:bg-surface"}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          {/* Pintu masuk admin SENGAJA tidak ditampilkan di UI publik;
              rute /admin tetap dapat dibuka lewat URL langsung. */}
        </div>
      </header>

      <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 md:px-6 md:pt-10 lg:pb-14">{children}</main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-32 md:px-6 lg:pb-10">
        <div className="border-t border-line pt-5 text-xs leading-relaxed text-muted">
          <p className="font-semibold text-emerald-deep">Maktabah Al-'Ilmiyyah</p>
          <p className="mt-1">Perpustakaan fatwa dan khazanah Islam — teks Arab beserta terjemahan Indonesia. Catatan sumber tersedia pada setiap materi.</p>
          <p className="mt-3">
            Foto sampul adalah foto asli (bukan hasil generate) dari{" "}
            {PHOTO_CREDITS.map((c, i) => (
              <span key={c.src}>
                {i > 0 ? ", " : ""}
                <a href={c.creditUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-emerald-deep">
                  {c.creditSource} · {c.creditName}
                </a>
              </span>
            ))}
            .
          </p>
        </div>
      </footer>

      {/* Navigasi bawah melayang (mobile & tablet, <lg) — gaya aplikasi native.
          PENTING: selama nav ini tampil, padding bawah <main> dan <footer>
          harus tetap pb-32 (±128px > tinggi pil + offset ±74px); jangan
          dikecilkan di breakpoint md, atau elemen terbawah tertutup pil
          dan tidak bisa diklik. */}
      {/* Lebar nav ditegaskan TANPA max-w-md/mx-auto (PR #10 lanjutan, bukti
          tangkapan layar user 27 Okt 2026): skema lama inset-x-3 + max-w-md +
          mx-auto pada elemen fixed terukur me-render ±470-495px pada viewport
          ±390px di ponsel nyata — sel ke-4 "Tersimpan" jatuh di luar layar dan
          tidak terlihat sama sekali. Skema baru: lebar = min(28rem, 100vw-1.5rem)
          dan dipusatkan dengan left-1/2 -translate-x-1/2, jadi pada ponsel
          lebarnya selalu tepat selebar layar dikurangi 12px di kedua sisi dan
          keempat sel grid sama lebar di dalam layar; di tablet ia tetap
          terpusat dengan lebar maksimum 28rem seperti desain awal. */}
      <nav
        className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-50 w-[min(28rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-full border border-white/60 bg-white/75 shadow-pill backdrop-blur-xl lg:hidden"
        aria-label="Navigasi utama ponsel"
      >
        <div className="grid grid-cols-4 px-1.5 py-1.5">
          {NAV_MAIN.map((n) => {
            const Icon = n.icon;
            const isActive = active(n.href);
            return (
              <Link
                key={n.label}
                href={n.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 text-[11px] leading-tight transition ${isActive ? "bg-emerald font-bold text-white shadow-soft" : "text-emerald-deep"}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
