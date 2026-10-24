"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearToken, getToken, getUser } from "@/lib/auth";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/acquisition", label: "Acquisition" },
  { href: "/admin/processing", label: "Processing Queue" },
  { href: "/admin/ai-translation", label: "AI Translation" },
  { href: "/admin/corpus", label: "Pertumbuhan Koleksi" },
  { href: "/admin/materials", label: "Materials" },
  { href: "/admin/scholars", label: "Scholars" },
  { href: "/admin/topics", label: "Topics" },
  { href: "/admin/references", label: "References" },
  { href: "/admin/editor", label: "Bilingual Editor" },
  { href: "/admin/quality", label: "Quality Audit" },
  { href: "/admin/publication", label: "Publication" },
  { href: "/admin/corrections", label: "Laporan Koreksi" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/ai-settings", label: "AI Settings" },
  { href: "/admin/settings", label: "System Settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const isLogin = pathname === "/admin/login";
  useEffect(() => {
    if (isLogin) { setReady(true); return; }
    if (!getToken()) { router.replace("/admin/login"); return; }
    setReady(true);
  }, [isLogin, router]);
  if (isLogin) return <div className="min-h-screen bg-ivory">{children}</div>;
  if (!ready) return <div className="min-h-screen bg-ivory p-8 text-sm text-stone-500">Memeriksa sesi masuk…</div>;
  const user = getUser();
  const active = (href: string) => href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  return (
    <div className="flex min-h-screen bg-ivory">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-emerald-deep p-4 text-white md:flex">
        <Link href="/admin" className="mb-1 px-2 text-lg font-bold">Pustaka Ilmu</Link>
        <p className="mb-4 px-2 text-xs text-white/70">Admin{user ? ` · ${user.email}` : ""}</p>
        <nav className="flex flex-1 flex-col gap-1">
          {ADMIN_NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`rounded-xl px-3 py-2 text-sm font-medium ${active(n.href) ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"}`}>{n.label}</Link>
          ))}
        </nav>
        <Link href="/" className="mt-4 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10">← Ke Reader</Link>
        <button onClick={() => { clearToken(); router.replace("/admin/login"); }} className="mt-1 rounded-xl px-3 py-2 text-left text-sm text-gold hover:bg-white/10">Keluar</button>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="border-b border-emerald-900/10 bg-white px-4 py-3 md:hidden">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-deep">Admin Pustaka Ilmu</span>
            <button onClick={() => { clearToken(); router.replace("/admin/login"); }} className="text-sm font-semibold text-emerald">Keluar</button>
          </div>
          <nav className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {ADMIN_NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`chip shrink-0 ${active(n.href) ? "border-emerald bg-emerald text-white" : "border-emerald/25 bg-white text-emerald"}`}>{n.label}</Link>
            ))}
          </nav>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
