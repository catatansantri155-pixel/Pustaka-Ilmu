"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconChevronRight, IconInfo, IconSettings, IconType } from "@/components/icons";

/**
 * Halaman Pengaturan (port Lovable, keputusan user 4 Nov 2026: pojok kanan
 * atas header hanya tombol Pengaturan). Isinya adalah preferensi membaca
 * yang sama dengan panel kontrol di halaman Baca — kunci localStorage-nya
 * identik (pustaka:reader:*), jadi perubahan di sini langsung berlaku di
 * halaman Baca dan sebaliknya. Semua tersimpan lokal di perangkat ini.
 */
type DisplayMode = "gabung" | "arab" | "indo";
type ReadMode = "pemula" | "mendalam";
/** Tangga ukuran font — cerminan tangga di halaman Baca (materi/[id]). */
const FONT_STEPS_AR = [1.05, 1.2, 1.38, 1.58];
const FONT_STEPS_ID = [0.85, 0.95, 1.08, 1.22];

function loadPref<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function savePref(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* abaikan */ } }

export default function PengaturanPage() {
  const [display, setDisplay] = useState<DisplayMode>("gabung");
  const [mode, setMode] = useState<ReadMode>("pemula");
  const [fontAr, setFontAr] = useState(1);
  const [fontId, setFontId] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDisplay(loadPref<DisplayMode>("pustaka:reader:display", "gabung"));
    setMode(loadPref<ReadMode>("pustaka:reader:mode", "pemula"));
    setFontAr(loadPref<number>("pustaka:reader:fontAr", 1));
    setFontId(loadPref<number>("pustaka:reader:fontId", 1));
    setReady(true);
  }, []);

  const chip = (active: boolean) =>
    `chip font-semibold ${active ? "border-emerald bg-emerald text-white" : "border-emerald/25 bg-white text-emerald"}`;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2.5 text-xl font-extrabold text-emerald-deep">
          <IconSettings className="h-6 w-6 text-emerald" /> Pengaturan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Atur kenyamanan membaca di perangkat ini. Perubahan tersimpan otomatis dan berlaku di halaman Baca.
        </p>
      </header>

      <section className="card space-y-5 p-6" aria-labelledby="pengaturan-baca">
        <h2 id="pengaturan-baca" className="font-read text-lg font-semibold text-emerald-deep">Tampilan membaca</h2>

        <div>
          <p className="text-sm font-semibold text-emerald-deep">Bahasa yang ditampilkan</p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Tampilan bahasa">
            {([["gabung", "Arab + Indonesia"], ["arab", "Arab saja"], ["indo", "Indonesia saja"]] as Array<[DisplayMode, string]>).map(([v, label]) => (
              <button key={v} aria-pressed={display === v} onClick={() => { setDisplay(v); savePref("pustaka:reader:display", v); }} className={chip(display === v)}>{label}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-emerald-deep">Mode membaca</p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Mode membaca">
            <button aria-pressed={mode === "pemula"} onClick={() => { setMode("pemula"); savePref("pustaka:reader:mode", "pemula"); }} className={chip(mode === "pemula")}>Pemula</button>
            <button aria-pressed={mode === "mendalam"} onClick={() => { setMode("mendalam"); savePref("pustaka:reader:mode", "mendalam"); }} className={chip(mode === "mendalam")}>Mendalam</button>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">Mode Mendalam menampilkan Arab dan terjemahan berdampingan di layar lebar, plus referensi dan temuan audit pada materi.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-deep"><IconType className="h-4 w-4" /> Ukuran teks Arab</p>
            <div className="mt-2 flex items-center gap-1.5">
              <button className="chip border-emerald/25 bg-white font-semibold text-emerald" aria-label="Perkecil teks Arab" onClick={() => { const v = Math.max(0, fontAr - 1); setFontAr(v); savePref("pustaka:reader:fontAr", v); }}>A−</button>
              <span className="min-w-12 text-center text-sm text-muted">{ready ? `${Math.round(FONT_STEPS_AR[fontAr] * 100)}%` : "…"}</span>
              <button className="chip border-emerald/25 bg-white font-semibold text-emerald" aria-label="Perbesar teks Arab" onClick={() => { const v = Math.min(3, fontAr + 1); setFontAr(v); savePref("pustaka:reader:fontAr", v); }}>A+</button>
            </div>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-deep"><IconType className="h-4 w-4" /> Ukuran teks Indonesia</p>
            <div className="mt-2 flex items-center gap-1.5">
              <button className="chip border-emerald/25 bg-white font-semibold text-emerald" aria-label="Perkecil teks Indonesia" onClick={() => { const v = Math.max(0, fontId - 1); setFontId(v); savePref("pustaka:reader:fontId", v); }}>A−</button>
              <span className="min-w-12 text-center text-sm text-muted">{ready ? `${Math.round(FONT_STEPS_ID[fontId] * 100)}%` : "…"}</span>
              <button className="chip border-emerald/25 bg-white font-semibold text-emerald" aria-label="Perbesar teks Indonesia" onClick={() => { const v = Math.min(3, fontId + 1); setFontId(v); savePref("pustaka:reader:fontId", v); }}>A+</button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-paper p-4 ring-1 ring-line">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-goldink">Pratinjau</p>
          <p dir="rtl" lang="ar" className="font-arabic mt-2 text-right text-emerald-deep" style={{ fontSize: `${FONT_STEPS_AR[fontAr]}rem` }}>إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ</p>
          <p className="font-read mt-2 text-ink" style={{ fontSize: `${FONT_STEPS_ID[fontId]}rem`, lineHeight: 1.8 }}>Sesungguhnya setiap amalan tergantung pada niatnya.</p>
        </div>
      </section>

      <Link href="/tentang" className="card flex min-h-14 items-center gap-3 p-4">
        <IconInfo className="h-5 w-5 shrink-0 text-emerald" />
        <span className="flex-1 text-sm font-medium text-emerald-deep">Tentang aplikasi, sumber fatwa, serta saran dan dukungan</span>
        <IconChevronRight className="h-4 w-4 shrink-0 text-muted" />
      </Link>
    </div>
  );
}
