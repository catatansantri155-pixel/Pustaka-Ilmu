"use client";
import { useEffect, useState } from "react";
import type { Scholar, SourceRegistryItem } from "@pustaka/shared-types";
import { api, scholarName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";

export default function AdminSourcesPage() {
  const [items, setItems] = useState<SourceRegistryItem[]>([]);
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", domain: "", scholar_id: "", permission_status: "UNVERIFIED", redistribution_policy: "UNKNOWN" });
  async function load() { try { setItems(await api.adminSources()); } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat sumber."); } finally { setLoading(false); } }
  useEffect(() => { load(); api.scholars().then(setScholars).catch(() => {}); }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setNotice(null);
    const body: Record<string, unknown> = { name: form.name, domain: form.domain, permission_status: form.permission_status, redistribution_policy: form.redistribution_policy };
    if (form.scholar_id) body.scholar_id = form.scholar_id;
    try { await api.createSource(body); setForm({ name: "", domain: "", scholar_id: "", permission_status: "UNVERIFIED", redistribution_policy: "UNKNOWN" }); setNotice("Sumber ditambahkan."); load(); }
    catch (err) { setNotice(err instanceof Error ? err.message : "Gagal menambah sumber."); }
  }
  async function remove(id: string) {
    if (!window.confirm("Hapus sumber ini dari registry?")) return;
    try { await api.deleteSource(id); setItems((p) => p.filter((x) => x.id !== id)); setNotice("Sumber dihapus."); }
    catch (err) { setNotice(err instanceof Error ? err.message : "Gagal menghapus sumber."); }
  }
  return (
    <div>
      <h1 className="text-2xl font-bold text-emerald-deep">Sources</h1>
      <p className="mt-1 text-sm text-stone-600">Registry sumber. Status izin yang belum terverifikasi ditampilkan apa adanya (UNVERIFIED / UNKNOWN) dan menjadi blocker publikasi sampai dinyatakan jelas.</p>
      {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
      {notice ? <p className="mt-3 rounded-2xl bg-emerald/5 px-4 py-2 text-sm text-emerald-deep">{notice}</p> : null}
      <form onSubmit={submit} className="card mt-5 grid gap-3 p-5 sm:grid-cols-2">
        <label className="text-sm font-semibold">Nama sumber<input className="input mt-1" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="text-sm font-semibold">Domain<input className="input mt-1" required value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="example.com" /></label>
        <label className="text-sm font-semibold">Ulama
          <select className="input mt-1" value={form.scholar_id} onChange={(e) => setForm({ ...form, scholar_id: e.target.value })}>
            <option value="">— Tidak spesifik —</option>
            {scholars.map((s) => <option key={s.id} value={s.id}>{scholarName(s)}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Status izin (permission_status)
          <select className="input mt-1" value={form.permission_status} onChange={(e) => setForm({ ...form, permission_status: e.target.value })}>
            <option>UNVERIFIED</option><option>CLEARED</option><option>DENIED</option><option>UNKNOWN</option>
          </select>
        </label>
        <label className="text-sm font-semibold sm:col-span-2">Kebijakan redistribusi (redistribution_policy)
          <select className="input mt-1" value={form.redistribution_policy} onChange={(e) => setForm({ ...form, redistribution_policy: e.target.value })}>
            <option>UNKNOWN</option><option>ALLOWED</option><option>ALLOWED_WITH_ATTRIBUTION</option><option>NOT_ALLOWED</option>
          </select>
        </label>
        <div><button className="btn-primary">Tambah Sumber</button></div>
      </form>
      <div className="card mt-6 overflow-x-auto p-0">
        {loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="Belum ada sumber terdaftar" body="Tambahkan sumber pertama lewat formulir di atas." /> : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b bg-ivory text-xs uppercase text-stone-500"><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Domain</th><th className="px-4 py-3">Ulama</th><th className="px-4 py-3">Izin</th><th className="px-4 py-3">Redistribusi</th><th className="px-4 py-3">Aksi</th></tr></thead>
            <tbody>{items.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.domain || s.base_url || s.url || "—"}</td>
                <td className="px-4 py-3">{typeof s.scholar === "string" ? s.scholar : scholarName(s.scholar) || s.scholar_name || s.scholar_id || "—"}</td>
                <td className="px-4 py-3">{s.permission_status || "—"}</td>
                <td className="px-4 py-3">{s.redistribution_policy || "—"}</td>
                <td className="px-4 py-3"><button className="btn-outline border-red-300 px-3 py-1.5 text-xs text-red-700" onClick={() => remove(s.id)}>Hapus</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
