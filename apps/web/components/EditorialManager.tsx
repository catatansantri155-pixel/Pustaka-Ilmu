"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { ErrorState, LoadingState } from "@/components/ui";

type Row = Record<string, string | null>;
type Field = { key: string; label: string; required?: boolean; multiline?: boolean; options?: Row[]; optionLabel?: string };
export default function EditorialManager({ kind, title, fields }: { kind: string; title: string; fields: Field[] }) {
  const [items, setItems] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Row>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await apiFetch<Row[]>(`/api/admin/${kind}`)); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat data"); }
    finally { setLoading(false); }
  }, [kind]);
  useEffect(() => { load(); }, [load]);
  function choose(row?: Row) {
    setSelected(row?.id || null); setNotice("");
    setDraft(Object.fromEntries(fields.map(f => [f.key, row?.[f.key] || ""])));
  }
  async function save(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    const body = Object.fromEntries(fields.map(f => [f.key, f.key.endsWith("_id") && f.options && !draft[f.key] ? null : draft[f.key] || ""]));
    try {
      await apiFetch(`/api/admin/${kind}${selected ? `/${selected}` : ""}`, { method: selected ? "PUT" : "POST", body: JSON.stringify(body) });
      await load(); setSelected(null); setDraft({}); setNotice("Data berhasil disimpan.");
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal menyimpan"); }
    finally { setBusy(false); }
  }
  return <section className="space-y-5">
    <h1 className="text-2xl font-bold text-emerald-deep">{title}</h1>
    {error && <ErrorState message={error} onRetry={load} />}
    {notice && <p role="status" className="card p-4 text-emerald-deep">{notice}</p>}
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <div className="card max-h-[650px] space-y-2 overflow-auto p-4">
        <button className="btn-primary mb-3" onClick={() => choose()}>Tambah Baru</button>
        {loading ? <LoadingState /> : items.map(row => <button key={row.id} onClick={() => choose(row)} className={`block w-full rounded-xl border p-4 text-left ${selected === row.id ? "border-emerald bg-emerald/5" : "border-line"}`}>
          <span className="block text-xs text-muted">{row.code}</span><strong>{row.name_id || row.title_id}</strong>
        </button>)}
      </div>
      <form className="card space-y-4 p-5" onSubmit={save}>
        <h2 className="font-bold">{selected ? "Ubah Data" : "Tambah Data"}</h2>
        {fields.map(f => <label className="block text-sm" key={f.key}><span className="mb-1 block font-medium">{f.label}</span>
          {f.options ? <select className="input w-full" value={draft[f.key] || ""} onChange={e => setDraft({...draft, [f.key]:e.target.value})}>
            <option value="">Tanpa pilihan</option>{f.options.map(o => <option key={o.id} value={o.id || ""}>{o[f.optionLabel || "name_id"]}</option>)}
          </select> : f.multiline ? <textarea className="input min-h-32 w-full" value={draft[f.key] || ""} required={f.required} onChange={e => setDraft({...draft, [f.key]:e.target.value})} /> :
            <input className="input w-full" dir={f.key.endsWith("_ar") ? "rtl" : undefined} value={draft[f.key] || ""} required={f.required} onChange={e => setDraft({...draft, [f.key]:e.target.value})} />}
        </label>)}
        <button className="btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
      </form>
    </div>
  </section>;
}
