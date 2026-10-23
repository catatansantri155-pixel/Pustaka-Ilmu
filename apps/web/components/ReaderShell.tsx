"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/", label: "Beranda", icon: "⌂" },
  { href: "/cari", label: "Cari", icon: "⌕" },
  { href: "/pustaka", label: "Pustaka", icon: "▤" },
  { href: "/audio", label: "Audio", icon: "♪" },
  { href: "/tersimpan", label: "Tersimpan", icon: "⚑" },
];

export default function ReaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return <>{children}</>;
  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <div className="min-h-screen bg-ivory">
      <header className="sticky top-0 z-40 hidden border-b border-emerald-900/10 bg-ivory/95 backdrop-blur md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-deep text-lg text-gold">✦</span>
            <span className="text-lg font-bold text-emerald-deep">Pustaka Ilmu</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`rounded-full px-4 py-2 text-sm font-semibold ${active(n.href) ? "bg-emerald text-white" : "text-emerald-deep hover:bg-emerald/10"}`}>{n.label}</Link>
            ))}
            <Link href="/admin/login" className="ml-2 rounded-full border border-gold px-4 py-2 text-sm font-semibold text-emerald-deep">Admin</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 md:px-6 md:pb-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-3 z-50 flex justify-center md:hidden" aria-label="Navigasi utama">
        <div className="flex items-center gap-1 rounded-full border border-emerald-900/10 bg-white/95 p-1.5 shadow-soft backdrop-blur">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`flex min-w-[60px] flex-col items-center rounded-full px-2 py-1.5 text-[11px] font-semibold ${active(n.href) ? "bg-emerald text-white" : "text-emerald-deep"}`}>
              <span className="text-base leading-none">{n.icon}</span>{n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
