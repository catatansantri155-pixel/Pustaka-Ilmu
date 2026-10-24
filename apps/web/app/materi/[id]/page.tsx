"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { GlossaryItem, MaterialDetail } from "@pustaka/shared-types";
import { ApiError, api, materialTitle, recordLocalReading, scholarName, topicName } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { EmptyState, ErrorState, LoadingState, severityClass } from "@/components/ui";

type DisplayMode = "gabung" | "arab" | "indo";
type ReadMode = "pemula" | "mendalam";
const FONT_STEPS = [0.95, 1.05, 1.2, 1.35];

function loadPref<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function savePref(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* abaikan */ } }

export default function MaterialPage({ params }: { params: { id: string } }) {
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

  async function bookmark() {
    if (!getToken()) { setNotice("Anda perlu masuk terlebih dahulu untuk menyimpan materi."); return; }
    try { await api.addBookmark(params.id); setNotice("Materi disimpan ke daftar Tersimpan."); }
    catch (e) { setNotice(e instanceof ApiError ? e.message : "Gagal menyimpan bookmark."); }
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
  const arSize = `${FONT_STEPS[fontAr]}rem`;
  const idSize = `${FONT_STEPS[fontId]}rem`;

  return (
    <article className="space-y-6">
      <header>
        <div className="flex flex-wrap gap-2">
          {m.topics?.map((t) => <span key={t.id} className="chip border-emerald/20 bg-emerald/5 text-emerald">{t.code ? `${t.code} · ` : ""}{topicName(t)}</span>)}
          {m.content_type ? <span className="chip border-gold/40 bg-gold/10 text-emerald-deep">{m.content_type}</span> : null}
          {m.is_demo ? <span className="chip border-amber-300 bg-amber-50 text-amber-800">Demo</span> : null}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-emerald-deep md:text-3xl">{materialTitle(m)}</h1>
        {m.title_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-2 text-right text-2xl text-ink">{m.title_ar}</p> : null}
        <p className="mt-2 text-sm text-muted">{m.scholar ? <Link className="font-semibold text-emerald underline" href={`/pustaka/${m.scholar.id}`}>{scholarName(m.scholar)}</Link> : m.scholar_name || ""}</p>
        {m.ai_label ? <p className="mt-3 inline-block rounded-2xl border border-gold/50 bg-gold/10 px-4 py-2 text-xs font-semibold text-emerald-deep">{m.ai_label}</p> : null}
      </header>

      <div className="card flex flex-wrap items-center gap-2 p-4">
        <div className="flex overflow-hidden rounded-full border border-emerald/30" role="group" aria-label="Tampilan bahasa">
          {([["gabung", "Arab + Indonesia"], ["arab", "Arab saja"], ["indo", "Indonesia saja"]] as Array<[DisplayMode, string]>).map(([v, label]) => (
            <button key={v} onClick={() => { setDisplay(v); savePref("pustaka:reader:display", v); }} className={`px-3 py-2 text-xs font-semibold sm:text-sm ${display === v ? "bg-emerald text-white" : "bg-white text-emerald"}`}>{label}</button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-full border border-emerald/30" role="group" aria-label="Mode membaca">
          <button onClick={() => { setMode("pemula"); savePref("pustaka:reader:mode", "pemula"); }} className={`px-4 py-2 text-sm font-semibold ${mode === "pemula" ? "bg-emerald text-white" : "bg-white text-emerald"}`}>Pemula</button>
          <button onClick={() => { setMode("mendalam"); savePref("pustaka:reader:mode", "mendalam"); }} className={`px-4 py-2 text-sm font-semibold ${mode === "mendalam" ? "bg-emerald text-white" : "bg-white text-emerald"}`}>Mendalam</button>
        </div>
        <div className="flex items-center gap-1" aria-label="Ukuran font Arab">
          <span className="text-xs text-muted">Arab</span>
          <button className="btn-outline px-3" onClick={() => { const v = Math.max(0, fontAr - 1); setFontAr(v); savePref("pustaka:reader:fontAr", v); }}>A−</button>
          <button className="btn-outline px-3" onClick={() => { const v = Math.min(3, fontAr + 1); setFontAr(v); savePref("pustaka:reader:fontAr", v); }}>A+</button>
        </div>
        <div className="flex items-center gap-1" aria-label="Ukuran font Indonesia">
          <span className="text-xs text-muted">Latin</span>
          <button className="btn-outline px-3" onClick={() => { const v = Math.max(0, fontId - 1); setFontId(v); savePref("pustaka:reader:fontId", v); }}>A−</button>
          <button className="btn-outline px-3" onClick={() => { const v = Math.min(3, fontId + 1); setFontId(v); savePref("pustaka:reader:fontId", v); }}>A+</button>
        </div>
        <button className="btn-outline" onClick={bookmark}>Bookmark</button>
        <button className="btn-outline" onClick={share}>Bagikan</button>
        <button className="btn-outline" onClick={() => setReportOpen((v) => !v)}>Laporkan Kesalahan Terjemahan</button>
      </div>
      {notice ? <div className="rounded-2xl border border-emerald/20 bg-emerald/5 px-4 py-3 text-sm text-emerald-deep">{notice} {notice.includes("masuk terlebih dahulu") ? <Link href="/admin/login" className="font-semibold underline">Masuk di sini</Link> : null}</div> : null}

      {reportOpen ? (
        <form onSubmit={submitReport} className="card space-y-3 p-5">
          <p className="font-semibold text-emerald-deep">Laporkan kemungkinan kesalahan terjemahan</p>
          <p className="text-sm text-muted">Laporan masuk antrean admin dan tidak langsung mengubah materi publik.</p>
          <textarea className="input min-h-24" value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Tuliskan bagian yang Anda nilai keliru dan alasannya…" aria-label="Isi laporan koreksi" />
          <div className="flex items-center gap-3">
            <button className="btn-primary" type="submit" disabled={reporting}>{reporting ? "Mengirim…" : "Kirim Laporan"}</button>
            {reportStatus ? <p className="text-sm text-emerald-deep">{reportStatus}</p> : null}
          </div>
        </form>
      ) : null}

      {pairs.length > 1 ? (
        <nav className="card p-5" aria-label="Daftar isi">
          <h2 className="font-bold text-emerald-deep">Daftar Isi</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {pairs.map((p, idx) => (
              <li key={p.segId || idx}><a className="text-emerald underline" href={`#seg-${idx + 1}`}>Bagian {idx + 1}</a></li>
            ))}
          </ol>
        </nav>
      ) : null}

      <section className="space-y-4">
        {pairs.length === 0 ? (
          <>
            {showAr && (m.arabic?.full_text || m.arabic_text) ? (
              <div className="card p-6"><p dir="rtl" lang="ar" className="font-arabic whitespace-pre-wrap text-right" style={{ fontSize: arSize }}>{m.arabic?.full_text || m.arabic_text}</p></div>
            ) : null}
            {showId && !m.translation ? <EmptyState title="Terjemahan belum tersedia" body="Terjemahan Indonesia untuk materi ini belum diterbitkan." /> : null}
          </>
        ) : pairs.map((p, idx) => (
          <div key={p.segId || idx} id={`seg-${idx + 1}`} className={`card scroll-mt-24 p-5 ${mode === "mendalam" && display === "gabung" ? "grid gap-4 md:grid-cols-2" : ""}`}>
            {showAr && p.ar ? (
              <div className={mode === "mendalam" && display === "gabung" ? "md:order-2" : ""}>
                <p dir="rtl" lang="ar" className="font-arabic text-right" style={{ fontSize: arSize }}>{p.ar}</p>
              </div>
            ) : null}
            {showId && p.idText ? (
              <div className={mode === "pemula" && display === "gabung" ? "mt-3 rounded-2xl bg-surface p-4" : ""}>
                <p className="leading-relaxed text-ink" style={{ fontSize: idSize }}>{p.idText}</p>
              </div>
            ) : null}
          </div>
        ))}
      </section>

      {glossary.length > 0 ? (
        <section className="card p-5">
          <h2 className="font-bold text-emerald-deep">Glosarium Istilah</h2>
          <p className="mt-1 text-sm text-muted">Ketuk istilah untuk melihat penjelasannya.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {glossary.map((g) => (
              <button key={g.id} type="button" onClick={() => setOpenTerm(openTerm === g.id ? null : g.id)} className={`chip ${openTerm === g.id ? "border-emerald bg-emerald text-white" : "border-emerald/25 bg-white text-emerald"}`}>
                <span className="font-arabic">{g.term_ar}</span> · {g.term_id}
              </button>
            ))}
          </div>
          {openTerm ? (() => { const g = glossary.find((x) => x.id === openTerm); return g ? (
            <div className="mt-3 rounded-2xl bg-surface p-4 text-sm">
              <p><span className="font-arabic text-base" dir="rtl" lang="ar">{g.term_ar}</span> — <strong>{g.term_id}</strong></p>
              <p className="mt-1 text-ink">{g.context || "Penjelasan istilah belum tersedia."}</p>
            </div>
          ) : null; })() : null}
        </section>
      ) : null}

      {mode === "mendalam" && (
        <section className="card p-5">
          <h2 className="font-bold text-emerald-deep">Referensi &amp; Temuan Audit</h2>
          {m.findings && m.findings.length > 0 ? (
            <ul className="mt-3 space-y-2">{m.findings.map((f, i) => <li key={f.id || i} className={`chip ${severityClass(f.severity)}`}><span className="font-bold">{f.severity}</span>&nbsp;{f.message || f.detail || f.description || f.category || ""}</li>)}</ul>
          ) : <p className="mt-2 text-sm text-muted">Tidak ada temuan audit yang dilaporkan API untuk materi ini.</p>}
          {m.source_url ? <p className="mt-3 break-all text-sm text-muted">Sumber asli: <a className="text-emerald underline" href={m.source_url} target="_blank" rel="noreferrer">{m.source_url}</a></p> : null}
        </section>
      )}

      <footer className="card p-5 text-sm text-muted">
        <p className="font-semibold text-emerald-deep">Catatan Sumber</p>
        {m.source_url ? <p className="mt-1 break-all">Sumber asli: <a className="text-emerald underline" href={m.source_url} target="_blank" rel="noreferrer">{m.source_url}</a></p> : <p className="mt-1">Tautan sumber asli tidak disediakan API untuk materi ini.</p>}
        {m.translation?.status ? <p className="mt-1">Status terjemahan: {m.translation.status}</p> : null}
      </footer>
    </article>
  );
}
