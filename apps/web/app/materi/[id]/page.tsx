"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { MaterialDetail } from "@pustaka/shared-types";
import { ApiError, api, materialTitle, scholarName, topicName } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { EmptyState, ErrorState, LoadingState, severityClass } from "@/components/ui";

const FONT_SIZES = ["text-base", "text-lg", "text-xl"];

export default function MaterialPage({ params }: { params: { id: string } }) {
  const [m, setM] = useState<MaterialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArabic, setShowArabic] = useState(true);
  const [mode, setMode] = useState<"pemula" | "mendalam">("pemula");
  const [fontIdx, setFontIdx] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api.material(params.id).then((d) => {
      setM(d);
      if (getToken()) { api.readingHistory(params.id); }
    }).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat materi.")).finally(() => setLoading(false));
  }, [params.id]);

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
    if (!getToken()) { setNotice("Anda perlu masuk terlebih dahulu untuk menyimpan materi. Silakan buka halaman Admin / Masuk."); return; }
    try { await api.addBookmark(params.id); setNotice("Materi disimpan ke daftar Tersimpan."); }
    catch (e) { setNotice(e instanceof ApiError ? e.message : "Gagal menyimpan bookmark."); }
  }
  async function copyQuote() {
    if (!m) return;
    const text = `${materialTitle(m)} — ${scholarName(m.scholar)}\n${window.location.href}`;
    try { await navigator.clipboard.writeText(text); setNotice("Kutipan disalin ke papan klip."); } catch { setNotice("Gagal menyalin. Salin tautan dari bilah alamat peramban."); }
  }
  async function share() {
    if (!m) return;
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: materialTitle(m), url }); } catch {} }
    else { try { await navigator.clipboard.writeText(url); setNotice("Tautan disalin ke papan klip."); } catch { setNotice(url); } }
  }

  if (loading) return <LoadingState label="Memuat materi…" />;
  if (error) return <ErrorState message={error} />;
  if (!m) return <EmptyState title="Materi tidak ditemukan" body="Materi ini belum diterbitkan atau sudah tidak tersedia." />;

  const glossaryEntries: Array<[string, string]> = !m.glossary ? [] : Array.isArray(m.glossary)
    ? m.glossary.map((g) => [g.term, g.definition] as [string, string])
    : Object.entries(m.glossary as Record<string, string>);

  return (
    <article className="space-y-6">
      <header>
        <div className="flex flex-wrap gap-2">
          {m.topics?.map((t) => <span key={t.id} className="chip border-emerald/20 bg-emerald/5 text-emerald">{t.code ? `${t.code} · ` : ""}{topicName(t)}</span>)}
          {m.content_type ? <span className="chip border-gold/40 bg-gold/10 text-emerald-deep">{m.content_type}</span> : null}
          {m.is_demo ? <span className="chip border-amber-300 bg-amber-50 text-amber-800">Demo</span> : null}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-emerald-deep md:text-3xl">{materialTitle(m)}</h1>
        {m.title_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-2 text-right text-2xl leading-relaxed text-stone-700">{m.title_ar}</p> : null}
        <p className="mt-2 text-sm text-stone-600">{m.scholar ? <Link className="font-semibold text-emerald underline" href={`/pustaka/${m.scholar.id}`}>{scholarName(m.scholar)}</Link> : m.scholar_name || ""}</p>
        {m.ai_label ? <p className="mt-3 inline-block rounded-2xl border border-gold/50 bg-gold/10 px-4 py-2 text-xs font-semibold text-emerald-deep">Label AI: {m.ai_label}</p> : null}
        {m.summary && mode === "mendalam" ? <p className="mt-3 text-sm leading-relaxed text-stone-700">{m.summary}</p> : null}
      </header>

      <div className="card flex flex-wrap items-center gap-2 p-4">
        <button className="btn-outline" onClick={() => setShowArabic((v) => !v)}>{showArabic ? "Sembunyikan Arab" : "Tampilkan Arab"}</button>
        <div className="flex overflow-hidden rounded-full border border-emerald/30">
          <button onClick={() => setMode("pemula")} className={`px-4 py-2 text-sm font-semibold ${mode === "pemula" ? "bg-emerald text-white" : "bg-white text-emerald"}`}>Pemula</button>
          <button onClick={() => setMode("mendalam")} className={`px-4 py-2 text-sm font-semibold ${mode === "mendalam" ? "bg-emerald text-white" : "bg-white text-emerald"}`}>Mendalam</button>
        </div>
        <div className="flex items-center gap-1" aria-label="Ukuran font">
          <button className="btn-outline px-3" onClick={() => setFontIdx((i) => Math.max(0, i - 1))}>A−</button>
          <span className="text-xs text-stone-500">Ukuran {fontIdx + 1}/3</span>
          <button className="btn-outline px-3" onClick={() => setFontIdx((i) => Math.min(2, i + 1))}>A+</button>
        </div>
        <button className="btn-outline" onClick={bookmark}>Bookmark</button>
        <button className="btn-outline" onClick={copyQuote}>Salin Kutipan</button>
        <button className="btn-outline" onClick={share}>Bagikan</button>
      </div>
      {notice ? <div className="rounded-2xl border border-emerald/20 bg-emerald/5 px-4 py-3 text-sm text-emerald-deep">{notice} {notice.includes("masuk terlebih dahulu") ? <Link href="/admin/login" className="font-semibold underline">Masuk di sini</Link> : null}</div> : null}

      <section className={`space-y-4 ${FONT_SIZES[fontIdx]}`}>
        {pairs.length === 0 ? (
          <>
            {showArabic && (m.arabic?.full_text || m.arabic_text) ? (
              <div className="card p-6"><p dir="rtl" lang="ar" className="font-arabic whitespace-pre-wrap text-right leading-loose">{m.arabic?.full_text || m.arabic_text}</p></div>
            ) : null}
            {!m.translation ? <EmptyState title="Terjemahan belum tersedia" body="Terjemahan Indonesia untuk materi ini belum diterbitkan." /> : null}
          </>
        ) : pairs.map((p, idx) => (
          <div key={p.segId || idx} className={`card p-5 ${mode === "mendalam" ? "grid gap-4 md:grid-cols-2" : ""}`}>
            {showArabic && p.ar ? (
              <div className={mode === "mendalam" ? "md:order-2" : ""}>
                <p dir="rtl" lang="ar" className="font-arabic text-right leading-loose">{p.ar}</p>
              </div>
            ) : null}
            {p.idText ? (
              <div className={mode === "pemula" ? "mt-3 rounded-2xl bg-ivory p-4" : ""}>
                <p className="leading-relaxed text-stone-800">{p.idText}</p>
              </div>
            ) : null}
          </div>
        ))}
      </section>

      {mode === "pemula" && glossaryEntries.length > 0 ? null : glossaryEntries.length > 0 ? (
        <section className="card p-5">
          <h2 className="font-bold text-emerald-deep">Glosarium</h2>
          <dl className="mt-3 space-y-2">{glossaryEntries.map(([k, v]) => <div key={k}><dt className="font-semibold">{k}</dt><dd className="text-sm text-stone-600">{v}</dd></div>)}</dl>
        </section>
      ) : null}

      {mode === "mendalam" && (
        <section className="card p-5">
          <h2 className="font-bold text-emerald-deep">Referensi &amp; Temuan Audit</h2>
          {m.findings && m.findings.length > 0 ? (
            <ul className="mt-3 space-y-2">{m.findings.map((f) => <li key={f.id} className={`chip ${severityClass(f.severity)}`}><span className="font-bold">{f.severity}</span>&nbsp;{f.message || f.detail || f.description || f.category || ""}</li>)}</ul>
          ) : <p className="mt-2 text-sm text-stone-600">Tidak ada temuan audit yang dilaporkan API untuk materi ini.</p>}
          {Array.isArray(m.references) && m.references.length > 0 ? (
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-ivory p-3 text-xs">{JSON.stringify(m.references, null, 2)}</pre>
          ) : <p className="mt-2 text-sm text-stone-600">Panel referensi terperinci belum disediakan API untuk materi ini.</p>}
        </section>
      )}

      <footer className="card p-5 text-sm text-stone-600">
        <p className="font-semibold text-emerald-deep">Catatan Sumber</p>
        {m.source_url ? <p className="mt-1 break-all">Sumber asli: <a className="text-emerald underline" href={m.source_url} target="_blank" rel="noreferrer">{m.source_url}</a></p> : <p className="mt-1">Tautan sumber asli tidak disediakan API untuk materi ini.</p>}
        {m.translation?.status ? <p className="mt-1">Status terjemahan: {m.translation.status}</p> : null}
      </footer>
    </article>
  );
}
