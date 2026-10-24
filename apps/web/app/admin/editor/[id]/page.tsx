"use client";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { MaterialDetail } from "@pustaka/shared-types";
import { api, materialTitle, scholarName, topicName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, severityClass } from "@/components/ui";
import { ActionButtons, ActionFeedback, useMaterialActions } from "@/components/AdminMaterialActions";

import MaterialVerification from "@/components/MaterialVerification";
import MaterialMetadata from "@/components/MaterialMetadata";

type Pair = { ar?: string; textSegmentId: string; initialIdText: string; initialVersion?: number };

export default function EditorDetailPage() {
  const params = useParams<{ id: string }>();
  const [m, setM] = useState<MaterialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savedTexts, setSavedTexts] = useState<Record<string, string>>({});
  const [versions, setVersions] = useState<Record<string, number | undefined>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({});

  async function load() {
    try { setM(await api.adminMaterial(params.id)); }
    catch { try { setM(await api.material(params.id)); } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat materi."); } }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [params.id]);
  const actions = useMaterialActions(load);

  const pairs = useMemo<Pair[]>(() => {
    if (!m) return [];
    const segs = [...(m.arabic?.segments || [])].sort((a, b) => a.order_index - b.order_index);
    const tSegs = m.translation?.segments || [];
    if (segs.length === 0) return tSegs.map((t) => ({ textSegmentId: t.text_segment_id, initialIdText: t.text_id || "", initialVersion: t.version }));
    return segs.map((s) => {
      const t = tSegs.find((x) => x.text_segment_id === s.id);
      return { ar: s.text_ar, textSegmentId: s.id, initialIdText: t?.text_id || "", initialVersion: t?.version };
    });
  }, [m]);

  useEffect(() => {
    const d: Record<string, string> = {};
    const v: Record<string, number | undefined> = {};
    for (const p of pairs) { d[p.textSegmentId] = p.initialIdText; v[p.textSegmentId] = p.initialVersion; }
    setDrafts(d); setVersions(v); setSavedTexts(d);
  }, [pairs]);

  async function saveSegment(textSegmentId: string) {
    if (!m) return;
    setSavingId(textSegmentId);
    setFeedback((prev) => { const n = { ...prev }; delete n[textSegmentId]; return n; });
    try {
      const res = await api.updateSegment(m.id, textSegmentId, drafts[textSegmentId] ?? "");
      setVersions((prev) => ({ ...prev, [textSegmentId]: res.version }));
      setDrafts((prev) => ({ ...prev, [textSegmentId]: res.text_id }));
      setSavedTexts((prev) => ({ ...prev, [textSegmentId]: res.text_id }));
      setFeedback((prev) => ({ ...prev, [textSegmentId]: { ok: true, msg: `Tersimpan — versi segmen sekarang ${res.version}${res.material_version != null ? ` (versi materi ${res.material_version})` : ""}.` } }));
    } catch (e) {
      setFeedback((prev) => ({ ...prev, [textSegmentId]: { ok: false, msg: e instanceof Error ? e.message : "Gagal menyimpan segmen." } }));
    } finally { setSavingId(null); }
  }

  if (loading) return <LoadingState label="Memuat editor…" />;
  if (error) return <ErrorState message={error} />;
  if (!m) return <EmptyState title="Materi tidak ditemukan" body="Materi ini tidak tersedia dari API admin maupun publik." />;
  return (
    <div>
      <h1 className="text-2xl font-bold text-emerald-deep">{materialTitle(m)}</h1>
      {m.title_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-1 text-right text-xl text-stone-700">{m.title_ar}</p> : null}
      <p className="mt-1 text-sm text-stone-600">{scholarName(m.scholar) || m.scholar_name || ""} · Status: {m.status || m.pipeline_status || "—"}{m.is_demo ? " · Demo" : ""}{m.topics?.length ? ` · ${m.topics.map(topicName).filter(Boolean).join(", ")}` : ""}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButtons id={m.id} busy={actions.busyId === m.id} onAct={(a) => actions.act(m.id, a)} />
        <button disabled={actions.busyId === m.id} className="btn-outline px-3 py-1.5 text-xs" onClick={() => actions.translate(m.id)}>Terjemahkan AI</button>
      </div>
      <ActionFeedback message={actions.message} blockers={actions.blockers} />
      <div className="my-5"><MaterialMetadata id={m.id} onSaved={load} /><div className="mt-4"><MaterialVerification id={m.id} onSaved={load} /></div></div>

      <div className="mt-3 grid gap-2 rounded-2xl bg-white p-4 text-sm md:grid-cols-2">
        <span className="font-semibold text-emerald-deep">← Kolom kiri: Indonesia (dapat disunting)</span>
        <span className="text-right font-semibold text-emerald-deep">Kolom kanan: Arab (RTL) →</span>
      </div>
      <section className="mt-3 space-y-3">
        {pairs.length === 0 ? <EmptyState title="Belum ada segmen dwibahasa" body="API belum menyediakan segmen teks Arab maupun terjemahan untuk materi ini." /> : pairs.map((p, i) => {
          const fb = feedback[p.textSegmentId];
          const ver = versions[p.textSegmentId];
          const dirty = (drafts[p.textSegmentId] ?? "") !== (savedTexts[p.textSegmentId] ?? p.initialIdText);
          return (
            <div key={p.textSegmentId} className="card grid gap-4 p-5 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-bold text-stone-400">ID · Segmen {i + 1}{ver != null ? ` · Versi ${ver}` : " · Belum ada terjemahan"}</p>
                <textarea className="input min-h-[120px] leading-relaxed" value={drafts[p.textSegmentId] ?? ""} onChange={(e) => setDrafts((prev) => ({ ...prev, [p.textSegmentId]: e.target.value }))} placeholder="Tulis atau sunting terjemahan Indonesia segmen ini…" aria-label={`Terjemahan segmen ${i + 1}`} />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button className="btn-primary px-4 py-2 text-xs" disabled={savingId === p.textSegmentId} onClick={() => saveSegment(p.textSegmentId)}>{savingId === p.textSegmentId ? "Menyimpan…" : "Simpan Segmen"}</button>
                  {dirty ? <span className="text-xs text-amber-700">Ada perubahan belum disimpan</span> : null}
                </div>
                {fb ? <p className={`mt-2 rounded-2xl px-3 py-2 text-sm ${fb.ok ? "bg-emerald/5 text-emerald-deep" : "border border-red-200 bg-red-50 text-red-800"}`}>{fb.msg}</p> : null}
              </div>
              <div><p className="mb-1 text-right text-xs font-bold text-stone-400">AR · Segmen {i + 1}</p>{p.ar ? <p dir="rtl" lang="ar" className="font-arabic text-right text-lg leading-loose">{p.ar}</p> : <p className="text-right text-sm italic text-amber-700">Teks Arab segmen ini belum tersedia.</p>}</div>
            </div>
          );
        })}
      </section>
      {m.arabic?.full_text ? <section className="card mt-4 p-5"><h2 className="font-bold text-emerald-deep">Teks Arab Lengkap</h2><p dir="rtl" lang="ar" className="font-arabic mt-2 whitespace-pre-wrap text-right leading-loose">{m.arabic.full_text}</p></section> : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-bold text-emerald-deep">Panel Temuan Audit</h2>
          {m.findings && m.findings.length > 0 ? <ul className="mt-3 space-y-2">{m.findings.map((f) => <li key={f.id} className={`rounded-2xl border px-3 py-2 text-sm ${severityClass(f.severity)}`}><span className="font-bold">{f.severity}</span>{f.category ? ` · ${f.category}` : ""}<span className="block">{f.message || f.detail || f.description || ""}</span></li>)}</ul> : <p className="mt-2 text-sm text-stone-600">Tidak ada temuan audit pada materi ini menurut API.</p>}
        </section>
        <section className="card p-5">
          <h2 className="font-bold text-emerald-deep">Referensi &amp; Approval</h2>
          {m.source_url ? <p className="mt-2 break-all text-sm">Sumber: <a className="text-emerald underline" href={m.source_url} target="_blank" rel="noreferrer">{m.source_url}</a></p> : <p className="mt-2 text-sm text-stone-600">Tautan sumber tidak disediakan API.</p>}
          {m.ai_label ? <p className="mt-1 text-sm">Label AI: {m.ai_label}</p> : null}
          {m.translation?.status ? <p className="mt-1 text-sm">Status terjemahan: {m.translation.status}</p> : null}
          {m.approval ? <pre className="mt-2 overflow-x-auto rounded-2xl bg-ivory p-3 text-xs">{JSON.stringify(m.approval, null, 2)}</pre> : <p className="mt-1 text-sm text-stone-600">Info approval terperinci tidak disediakan API; status materi di atas adalah catatan approval yang tersedia.</p>}
          {Array.isArray(m.references) && m.references.length > 0 ? <pre className="mt-2 overflow-x-auto rounded-2xl bg-ivory p-3 text-xs">{JSON.stringify(m.references, null, 2)}</pre> : null}
        </section>
      </div>
      <p className="mt-4 text-xs text-stone-500">Catatan: setiap penyimpanan segmen menaikkan nomor versi segmen tersebut dan tercatat di audit log server. Segmen yang belum memiliki terjemahan dapat dibuat langsung dengan mengisi textarea lalu menekan Simpan Segmen.</p>
    </div>
  );
}
