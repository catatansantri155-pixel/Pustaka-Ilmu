"use client";
import { useEffect, useState } from "react";
import type { AiSettings, GlossaryItem } from "@pustaka/shared-types";
import { api } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-ivory px-4 py-2.5 text-sm">
      <span className="font-medium">{label}</span>
      <span className={`chip ${value ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-red-300 bg-red-50 text-red-800"}`}>{value ? "Terkonfigurasi" : "Belum"}</span>
    </div>
  );
}

export default function AiSettingsPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [items, setItems] = useState<GlossaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ term_ar: "", term_id: "", context: "" });
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ term_ar: "", term_id: "", context: "" });

  async function loadSettings() {
    try { setSettings(await api.aiSettings()); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat pengaturan AI."); }
  }
  async function loadGlossary() {
    try { setItems(await api.glossary()); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat glosarium."); }
  }
  useEffect(() => { Promise.all([loadSettings(), loadGlossary()]).finally(() => setLoading(false)); }, []);

  async function doCreate(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setNotice(null); setError(null);
    try {
      await api.createGlossary({ term_ar: form.term_ar.trim(), term_id: form.term_id.trim(), context: form.context.trim() || undefined });
      setForm({ term_ar: "", term_id: "", context: "" });
      setNotice("Istilah glosarium ditambahkan.");
      await loadGlossary();
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal menambahkan istilah."); }
    finally { setBusy(false); }
  }

  function startEdit(item: GlossaryItem) {
    setEditingId(item.id);
    setEditForm({ term_ar: item.term_ar, term_id: item.term_id, context: item.context || "" });
  }

  async function doUpdate(id: string) {
    setBusy(true); setNotice(null); setError(null);
    try {
      await api.updateGlossary(id, { term_ar: editForm.term_ar.trim(), term_id: editForm.term_id.trim(), context: editForm.context.trim() || undefined });
      setEditingId(null);
      setNotice("Istilah glosarium diperbarui.");
      await loadGlossary();
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal memperbarui istilah."); }
    finally { setBusy(false); }
  }

  async function doDelete(id: string) {
    setBusy(true); setNotice(null); setError(null);
    try {
      await api.deleteGlossary(id);
      setItems((p) => p.filter((x) => x.id !== id));
      setNotice("Istilah glosarium dihapus.");
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal menghapus istilah."); }
    finally { setBusy(false); }
  }

  if (loading) return <LoadingState label="Memuat pengaturan AI…" />;
  return (
    <div>
      <h1 className="text-2xl font-bold text-emerald-deep">AI Settings</h1>
      <p className="mt-1 text-sm text-stone-600">Status konfigurasi AI dibaca dari server. Kunci API tidak pernah ditampilkan atau diminta di halaman ini.</p>
      {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
      {notice ? <p className="mt-3 rounded-2xl bg-emerald/5 px-4 py-2 text-sm text-emerald-deep">{notice}</p> : null}

      <section className="card mt-5 p-6">
        <h2 className="font-bold text-emerald-deep">Status Konfigurasi</h2>
        {settings ? (
          <div className="mt-3 space-y-2">
            <BoolRow label="Base URL API AI" value={settings.ai_api_base_configured} />
            <BoolRow label="Kunci API AI" value={settings.ai_api_key_configured} />
            <BoolRow label="Redis" value={settings.redis_configured} />
            <BoolRow label="Celery eager (mode langsung)" value={settings.celery_eager} />
            <div className="flex items-center justify-between rounded-2xl bg-ivory px-4 py-2.5 text-sm"><span className="font-medium">Model AI</span><span className="font-bold text-emerald-deep">{settings.ai_model || "—"}</span></div>
            <div className="flex items-center justify-between rounded-2xl bg-ivory px-4 py-2.5 text-sm"><span className="font-medium">Batas biaya AI</span><span className="font-bold text-emerald-deep">{settings.ai_cost_limit.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span></div>
          </div>
        ) : <p className="mt-2 text-sm text-stone-600">Pengaturan AI tidak tersedia dari API.</p>}
      </section>

      <section className="card mt-6 p-6">
        <h2 className="font-bold text-emerald-deep">Tambah Istilah Glosarium</h2>
        <form onSubmit={doCreate} className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block text-sm font-semibold">Istilah Arab<input className="input mt-1" dir="rtl" lang="ar" required value={form.term_ar} onChange={(e) => setForm({ ...form, term_ar: e.target.value })} placeholder="مثال" /></label>
          <label className="block text-sm font-semibold">Padanan Indonesia<input className="input mt-1" required value={form.term_id} onChange={(e) => setForm({ ...form, term_id: e.target.value })} placeholder="contoh" /></label>
          <label className="block text-sm font-semibold">Konteks<input className="input mt-1" value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} placeholder="Konteks pemakaian (opsional)" /></label>
          <div className="sm:col-span-3"><button className="btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Tambah Istilah"}</button></div>
        </form>
      </section>

      <div className="card mt-6 overflow-x-auto p-0">
        {items.length === 0 ? <EmptyState title="Glosarium kosong" body="Tambahkan istilah pertama lewat formulir di atas." /> : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b bg-ivory text-xs uppercase text-stone-500"><th className="px-4 py-3">Arab</th><th className="px-4 py-3">Indonesia</th><th className="px-4 py-3">Konteks</th><th className="px-4 py-3">Aksi</th></tr></thead>
            <tbody>{items.map((it) => (
              <tr key={it.id} className="border-b align-top last:border-0">
                {editingId === it.id ? (
                  <>
                    <td className="px-4 py-3"><input className="input" dir="rtl" lang="ar" value={editForm.term_ar} onChange={(e) => setEditForm({ ...editForm, term_ar: e.target.value })} /></td>
                    <td className="px-4 py-3"><input className="input" value={editForm.term_id} onChange={(e) => setEditForm({ ...editForm, term_id: e.target.value })} /></td>
                    <td className="px-4 py-3"><input className="input" value={editForm.context} onChange={(e) => setEditForm({ ...editForm, context: e.target.value })} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button className="btn-primary px-3 py-1.5 text-xs" disabled={busy} onClick={() => doUpdate(it.id)}>Simpan</button>{" "}
                      <button className="btn-outline px-3 py-1.5 text-xs" disabled={busy} onClick={() => setEditingId(null)}>Batal</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3"><span dir="rtl" lang="ar" className="font-arabic text-base">{it.term_ar}</span></td>
                    <td className="px-4 py-3 font-medium">{it.term_id}</td>
                    <td className="px-4 py-3">{it.context || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button className="btn-outline px-3 py-1.5 text-xs" disabled={busy} onClick={() => startEdit(it)}>Edit</button>{" "}
                      <button className="btn-outline border-red-300 px-3 py-1.5 text-xs text-red-700" disabled={busy} onClick={() => doDelete(it.id)}>Hapus</button>
                    </td>
                  </>
                )}
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
