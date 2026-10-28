"use client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { GlossaryItem, MaterialDetail } from "@pustaka/shared-types";
import { ApiError, api, materialTitle, recordLocalReading, scholarName, topicName } from "@/lib/api";
import { toggleLocalBookmark, useIsBookmarked } from "@/lib/bookmarks";
import { getToken } from "@/lib/auth";
import { EmptyState, ErrorState, LoadingState, severityClass } from "@/components/ui";
import TopicCover from "@/components/TopicCover";
import { imageForMaterial } from "@/lib/topicImages";
import { IconArrowLeft, IconBookmark, IconFlag, IconShare, IconType } from "@/components/icons";

type DisplayMode = "gabung" | "arab" | "indo";
type ReadMode = "pemula" | "mendalam";
/** Tangga ukuran font pembaca (rem) — basis PR #3 lebih kecil dari sebelumnya. */
const FONT_STEPS_AR = [1.05, 1.2, 1.38, 1.58];
const FONT_STEPS_ID = [0.85, 0.95, 1.08, 1.22];
const LEADING_ID = 1.8;

/** Pecah teks segmen menjadi paragraf nyata (teks sumber memakai \n / \n\n). */
function paragraphs(text?: string | null): string[] {
  if (!text) return [];
  return text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
}

function loadPref<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function savePref(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* abaikan */ } }

export default function MaterialPage() {
  const params = useParams<{ id: string }>();
  const [m, setM] = useState<MaterialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [display, setDisplay] = useState<DisplayMode>("gabung");
  const [mode, setMode] = useState<ReadMode>("pemula");
  const [fontAr, setFontAr] = useState(1);
  const [fontId, setFontId] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    setDisplay(loadPref<DisplayMode>("pustaka:reader:display", "gabung"));
    setMode(loadPref<ReadMode>("pustaka:reader:mode", "pemula"));
    setFontAr(loadPref<number>("pustaka:reader:fontAr", 1));
    setFontId(loadPref<number>("pustaka:reader:fontId", 1));
  }, []);

  const load = useCallback(() => {
    setLoading(true); setError(null);
    api.material(params.id).then((d) => {
      setM(d);
      recordLocalReading({ id: params.id, title: materialTitle(d), scholar: scholarName(d.scholar) || undefined });
      if (getToken()) { api.readingHistory(params.id); }
    }).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat materi.")).finally(() => setLoading(false));
  }, [params.id]);
  useEffect(() => { load(); }, [load, nonce]);
  useEffect(() => { api.glossaryPublic().then(setGlossary).catch(() => setGlossary([])); }, []);

  const pairs = useMemo(() => {
    if (!m) return [] as Array<{ ar?: string; segId?: string; idText?: string }>;
    const segs = m.arabic?.segments || [];
    const tSegs = m.translation?.segments || [];
    if (segs.length === 0 && tSegs.length === 0) return [];
    if (segs.length === 0) return tSegs.map((t): { ar?: string; segId?: string; idText?: string } => ({ segId: t.text_segment_id, idText: t.text_id }));
    return segs.map((s) => {
      const t = tSegs.find((x) => x.text_segment_id === s.id);
      return { ar: s.text_ar, segId: s.id, idText: t?.text_id };
    });
  }, [m]);

  // Bookmark LOKAL perangkat (localStorage) — tanpa login, tanpa API.
  const saved = useIsBookmarked(params.id);
  function bookmark() {
    if (!m) return;
    const now = toggleLocalBookmark(m);
    setNotice(now ? "Materi disimpan di perangkat ini — lihat menu Tersimpan." : "Materi dihapus dari daftar Tersimpan di perangkat ini.");
  }
  async function share() {
    if (!m) return;
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: materialTitle(m), url }); } catch { /* dibatalkan pengguna */ } }
    else { try { await navigator.clipboard.writeText(url); setNotice("Tautan disalin ke papan klip."); } catch { setNotice(url); } }
  }
  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (reportText.trim().length < 5) { setReportStatus("Tuliskan laporan sedikit lebih rinci (minimal 5 karakter)."); return; }
    setReporting(true); setReportStatus(null);
    try {
      await api.reportCorrection({ material_id: params.id, message: reportText.trim() });
      setReportStatus("Terima kasih. Laporan Anda tersimpan dan masuk antrean penelaahan admin. Materi publik tidak berubah.");
      setReportText("");
    } catch (err) {
      setReportStatus(err instanceof ApiError ? err.message : "Gagal mengirim laporan. Coba lagi nanti.");
    } finally { setReporting(false); }
  }

  if (loading) return <LoadingState label="Memuat materi…" />;
  if (error) return <ErrorState message={error} onRetry={() => setNonce((n) => n + 1)} />;
  if (!m) return <EmptyState title="Materi tidak ditemukan" body="Materi ini belum diterbitkan atau sudah tidak tersedia." />;

  const showAr = display !== "indo";
  const showId = display !== "arab";
  const arSize = `${FONT_STEPS_AR[fontAr]}rem`;
  const idSize = `${FONT_STEPS_ID[fontId]}rem`;
  const hero = imageForMaterial(m);

  return (
    <article className="space-y-5 sm:space-y-7">
      <Link href="/cari" className="inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-semibold text-emerald underline-offset-4 hover:underline">
        <IconArrowLeft className="h-4 w-4" /> Kembali ke katalog
      </Link>

      {/* PR mobile-compact: hero ponsel h-44→h-32, radius 2rem→1.5rem,
          judul 20→18px, padding kartu segmen p-5→p-4 — hanya di ponsel;
          tangga font pembaca & teks Arab tidak disentuh.
          Putaran 2 (mobile-compact-2): judul 18→17px, padding kartu
          segmen & kartu teks penuh p-4→p-3.5 — sm:/md: tetap. */}
      <div className="relative overflow-hidden rounded-3xl shadow-lift sm:rounded-[2rem]">
        <TopicCover image={hero} className="h-32 w-full sm:h-56" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-deep/70 via-transparent to-transparent" aria-hidden />
        <p dir="rtl" lang="ar" className="font-arabic pointer-events-none absolute bottom-3 right-5 text-2xl leading-none text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">{hero.ar}</p>
      </div>

      <header>
        <div className="flex flex-wrap gap-2">
          {m.topics?.map((t) => <span key={t.id} className="chip border-emerald/20 bg-emerald/5 text-emerald">{t.code ? `${t.code} · ` : ""}{topicName(t)}</span>)}
          {m.content_type ? <span className="chip border-gold/40 bg-gold/10 text-emerald-deep">{m.content_type}</span> : null}
          {m.is_demo ? <span className="chip border-amber-300 bg-amber-50 text-amber-800">Demo</span> : null}
        </div>
        <h1 className="mt-3 text-[17px] font-extrabold leading-snug text-emerald-deep md:text-2xl">{materialTitle(m)}</h1>
        {m.title_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-2 text-right text-xl text-ink">{m.title_ar}</p> : null}
        <p className="mt-2 text-[13px] text-muted sm:text-sm">{m.scholar ? <Link className="font-semibold text-emerald underline" href={`/pustaka/${m.scholar.id}`}>{scholarName(m.scholar)}</Link> : m.scholar_name || ""}</p>
        {m.ai_label ? <p className="mt-3 inline-block rounded-2xl border border-gold/50 bg-gold/10 px-4 py-2 text-xs font-semibold leading-relaxed text-emerald-deep">{m.ai_label}</p> : null}
      </header>

      {/* Panel kontrol pembaca — ukuran disamakan PERSIS dengan chip Daftar Isi
          (PR #9 lanjutan, permintaan user 27 Okt 2026): semua elemen panel memakai
          kelas .chip yang sama dengan chip "Bagian N" (inline-flex, rounded-full,
          border, px-2.5 py-1, text-xs) + override warna/font daftar isi; keadaan
          aktif memakai isian emerald seperti pola chip glosarium di berkas ini.
          Hanya ukuran & bentuk yang disamakan — fungsi setiap kontrol tidak berubah. */}
      <div className="card flex flex-wrap items-center gap-x-2.5 gap-y-2 p-3">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Tampilan bahasa">
          {([["gabung", "Arab + Indonesia"], ["arab", "Arab saja"], ["indo", "Indonesia saja"]] as Array<[DisplayMode, string]>).map(([v, label]) => (
            <button key={v} aria-pressed={display === v} onClick={() => { setDisplay(v); savePref("pustaka:reader:display", v); }} className={`chip font-semibold ${display === v ? "border-emerald bg-emerald text-white" : "border-emerald/25 bg-white text-emerald"}`}>{label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Mode membaca">
          <button aria-pressed={mode === "pemula"} onClick={() => { setMode("pemula"); savePref("pustaka:reader:mode", "pemula"); }} className={`chip font-semibold ${mode === "pemula" ? "border-emerald bg-emerald text-white" : "border-emerald/25 bg-white text-emerald"}`}>Pemula</button>
          <button aria-pressed={mode === "mendalam"} onClick={() => { setMode("mendalam"); savePref("pustaka:reader:mode", "mendalam"); }} className={`chip font-semibold ${mode === "mendalam" ? "border-emerald bg-emerald text-white" : "border-emerald/25 bg-white text-emerald"}`}>Mendalam</button>
        </div>
        <div className="flex items-center gap-1" aria-label="Ukuran font Arab">
          <span className="flex items-center gap-1.5 text-xs text-muted"><IconType className="h-3.5 w-3.5" /> Arab</span>
          <button className="chip border-emerald/25 bg-white font-semibold text-emerald" aria-label="Perkecil font Arab" onClick={() => { const v = Math.max(0, fontAr - 1); setFontAr(v); savePref("pustaka:reader:fontAr", v); }}>A−</button>
          <button className="chip border-emerald/25 bg-white font-semibold text-emerald" aria-label="Perbesar font Arab" onClick={() => { const v = Math.min(3, fontAr + 1); setFontAr(v); savePref("pustaka:reader:fontAr", v); }}>A+</button>
        </div>
        <div className="flex items-center gap-1" aria-label="Ukuran font Indonesia">
          <span className="flex items-center gap-1.5 text-xs text-muted"><IconType className="h-3.5 w-3.5" /> Latin</span>
          <button className="chip border-emerald/25 bg-white font-semibold text-emerald" aria-label="Perkecil font Indonesia" onClick={() => { const v = Math.max(0, fontId - 1); setFontId(v); savePref("pustaka:reader:fontId", v); }}>A−</button>
          <button className="chip border-emerald/25 bg-white font-semibold text-emerald" aria-label="Perbesar font Indonesia" onClick={() => { const v = Math.min(3, fontId + 1); setFontId(v); savePref("pustaka:reader:fontId", v); }}>A+</button>
        </div>
        <button className={`chip font-semibold ${saved ? "border-emerald bg-emerald text-white" : "border-emerald/25 bg-white text-emerald"}`} aria-pressed={saved} onClick={bookmark}><IconBookmark className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} /> {saved ? "Tersimpan" : "Simpan materi"}</button>
        <button className="chip border-emerald/25 bg-white font-semibold text-emerald" onClick={share}><IconShare className="h-3.5 w-3.5" /> Bagikan</button>
        <button className="chip border-emerald/25 bg-white font-semibold text-emerald" aria-expanded={reportOpen} aria-controls="correction-form" onClick={() => setReportOpen((v) => !v)}><IconFlag className="h-3.5 w-3.5" /> Laporkan kesalahan terjemahan</button>
      </div>
      {notice ? <div role="status" className="rounded-lg border border-emerald/20 bg-emerald/5 px-4 py-3 text-[13px] text-emerald-deep sm:text-sm">{notice}</div> : null}

      {reportOpen ? (
        <form id="correction-form" onSubmit={submitReport} className="card space-y-3 p-4 sm:p-5">
          <p className="font-semibold text-emerald-deep">Laporkan kemungkinan kesalahan terjemahan</p>
          <p className="text-[13px] text-muted sm:text-sm">Laporan masuk antrean admin dan tidak langsung mengubah materi publik.</p>
          <textarea className="input min-h-24" value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Tuliskan bagian yang Anda nilai keliru dan alasannya…" aria-label="Isi laporan koreksi" />
          <div className="flex items-center gap-3">
            <button className="btn-primary" type="submit" disabled={reporting}>{reporting ? "Mengirim…" : "Kirim Laporan"}</button>
            {reportStatus ? <p role="status" className="text-sm text-emerald-deep">{reportStatus}</p> : null}
          </div>
        </form>
      ) : null}

      {pairs.length > 1 ? (
        <nav className="card p-4 sm:p-5" aria-label="Daftar isi">
          <h2 className="font-bold text-emerald-deep">Daftar Isi</h2>
          {/* Susunan MENYAMPING (PR #9, permintaan user 27 Okt 2026): chip bagian
              mengalir horizontal dan membungkus ke baris berikutnya, bukan daftar vertikal. */}
          <div className="mt-3 flex flex-wrap gap-2">
            {pairs.map((p, idx) => (
              <a key={p.segId || idx} className="chip border-emerald/25 bg-white font-semibold text-emerald" href={`#seg-${idx + 1}`}>Bagian {idx + 1}</a>
            ))}
          </div>
        </nav>
      ) : null}

      <section className="space-y-5">
        {pairs.length === 0 ? (
          <>
            {showAr && (m.arabic?.full_text || m.arabic_text) ? (
              <div className="card p-3.5 sm:p-6">
                <div className="space-y-4">
                  {paragraphs(m.arabic?.full_text || m.arabic_text).map((para, i) => (
                    <p key={i} dir="rtl" lang="ar" className="font-arabic text-right" style={{ fontSize: arSize }}>{para}</p>
                  ))}
                </div>
              </div>
            ) : null}
            {showId && !m.translation ? <EmptyState title="Terjemahan belum tersedia" body="Terjemahan Indonesia untuk materi ini belum diterbitkan." /> : null}
          </>
        ) : pairs.map((p, idx) => (
          <div key={p.segId || idx} id={`seg-${idx + 1}`} className={`card p-3.5 sm:p-6 ${mode === "mendalam" && display === "gabung" ? "grid gap-5 md:grid-cols-2" : ""}`}>
            {showAr && p.ar ? (
              <div className={mode === "mendalam" && display === "gabung" ? "md:order-2" : ""}>
                <div className="space-y-4">
                  {paragraphs(p.ar).map((para, i) => (
                    <p key={i} dir="rtl" lang="ar" className="font-arabic text-right" style={{ fontSize: arSize }}>{para}</p>
                  ))}
                </div>
              </div>
            ) : null}
            {showId && p.idText ? (
              <div className={mode === "pemula" && display === "gabung" ? "mt-4 rounded-3xl bg-surface p-3.5 sm:p-5" : ""}>
                <div className="space-y-3.5">
                  {paragraphs(p.idText).map((para, i) => (
                    <p key={i} className="text-ink" style={{ fontSize: idSize, lineHeight: LEADING_ID }}>{para}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </section>

      {glossary.length > 0 ? (
        <section className="card p-4 sm:p-5">
          <h2 className="font-bold text-emerald-deep">Glosarium Istilah</h2>
          <p className="mt-1 text-[13px] text-muted sm:text-sm">Ketuk istilah untuk melihat penjelasannya.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {glossary.map((g) => (
              <button key={g.id} type="button" onClick={() => setOpenTerm(openTerm === g.id ? null : g.id)} className={`chip ${openTerm === g.id ? "border-emerald bg-emerald text-white" : "border-emerald/25 bg-white text-emerald"}`}>
                <span className="font-arabic">{g.term_ar}</span> · {g.term_id}
              </button>
            ))}
          </div>
          {openTerm ? (() => { const g = glossary.find((x) => x.id === openTerm); return g ? (
            <div className="mt-3 rounded-2xl bg-surface p-3.5 text-[13px] sm:p-4 sm:text-sm">
              <p><span className="font-arabic text-base" dir="rtl" lang="ar">{g.term_ar}</span> — <strong>{g.term_id}</strong></p>
              <p className="mt-1 text-ink">{g.context || "Penjelasan istilah belum tersedia."}</p>
            </div>
          ) : null; })() : null}
        </section>
      ) : null}

      {mode === "mendalam" && (
        <section className="card p-4 sm:p-5">
          <h2 className="font-bold text-emerald-deep">Referensi &amp; Temuan Audit</h2>
          {m.findings && m.findings.length > 0 ? (
            <ul className="mt-3 space-y-2">{m.findings.map((f, i) => <li key={f.id || i} className={`chip ${severityClass(f.severity)}`}><span className="font-bold">{f.severity}</span>&nbsp;{f.message || f.detail || f.description || f.category || ""}</li>)}</ul>
          ) : <p className="mt-2 text-[13px] text-muted sm:text-sm">Tidak ada temuan audit yang dilaporkan API untuk materi ini.</p>}
          {m.source_url ? <p className="mt-3 break-all text-[13px] text-muted sm:text-sm">Sumber asli: <a className="text-emerald underline" href={m.source_url} target="_blank" rel="noreferrer">{m.source_url}</a></p> : null}
        </section>
      )}

      <footer className="card p-4 text-[13px] text-muted sm:p-5 sm:text-sm">
        <p className="font-semibold text-emerald-deep">Catatan Sumber</p>
        {m.citations?.length ? <div className="mt-3 space-y-3"><p>Catatan sebagaimana tercantum pada sumber asli; rincian referensi belum diverifikasi secara terpisah.</p>{m.citations.map(c=><p key={c.id} dir="rtl" lang="ar" className="font-arabic text-right text-base">{c.text}</p>)}</div> : null}
        {m.source_url ? <p className="mt-1 break-all">Sumber asli: <a className="text-emerald underline" href={m.source_url} target="_blank" rel="noreferrer">{m.source_url}</a></p> : <p className="mt-1">Tautan sumber asli tidak disediakan API untuk materi ini.</p>}
        {m.translation?.status ? <p className="mt-1">Status terjemahan: {m.translation.status}</p> : null}
      </footer>
    </article>
  );
}
