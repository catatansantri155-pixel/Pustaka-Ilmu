"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/cari", label: "Cari" },
  { href: "/pustaka", label: "Pustaka" },
  { href: "/audio", label: "Audio" },
  { href: "/tersimpan", label: "Tersimpan" },
];

export default function ReaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return <>{children}</>;
  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <div className="reader-shell min-h-screen bg-ivory">
      <a className="skip-link" href="#konten-utama">Langsung ke isi</a>
      <header className="border-b border-line bg-ivory">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/" className="inline-flex min-h-11 items-center text-lg font-bold text-emerald-deep">
            Pustaka Ilmu
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={`inline-flex min-h-11 items-center border-b-2 px-3 text-sm ${active(n.href) ? "border-emerald font-bold text-emerald-deep" : "border-transparent text-muted hover:text-emerald-deep"}`}>{n.label}</Link>
            ))}
          </nav>
          <Link href="/admin/login" className="inline-flex min-h-11 items-center px-2 text-sm text-muted underline underline-offset-4">Admin</Link>
        </div>
      </header>
      <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 md:px-6 md:pb-16 md:pt-12">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-ivory pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Navigasi utama ponsel">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={`flex min-h-11 min-w-0 items-center justify-center rounded px-1 py-2 text-xs ${active(n.href) ? "bg-emerald font-bold text-white" : "text-emerald-deep"}`}>
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
