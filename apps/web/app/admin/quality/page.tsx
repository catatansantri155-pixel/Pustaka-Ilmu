"use client";
import { useEffect, useState } from "react";
import type { QualityFinding } from "@pustaka/shared-types";
import { api } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, severityClass } from "@/components/ui";
export default function QualityPage() {
  const [items, setItems] = useState<QualityFinding[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.findings().then(setItems).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat temuan.")).finally(() => setLoading(false)); }, []);
  return (<div><h1 className="text-2xl font-bold text-emerald-deep">Quality Audit</h1><p className="mt-1 text-sm text-stone-600">Temuan audit kualitas dari API admin. Temuan CRITICAL menjadi blocker publikasi.</p>
    {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
    <div className="mt-5 space-y-3">{loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="Tidak ada temuan audit" body="API belum melaporkan temuan audit apa pun saat ini." /> : items.map((f) => (<div key={f.id} className={`rounded-3xl border px-5 py-4 text-sm ${severityClass(f.severity)}`}><span className="font-bold">{f.severity}</span>{f.category || f.type || f.code ? ` · ${f.category || f.type || f.code}` : ""}{f.material_id ? ` · Materi ${f.material_id}` : ""}<p className="mt-1">{f.message || f.detail || f.description || ""}</p>{f.created_at ? <p className="mt-1 text-xs opacity-75">{f.created_at}</p> : null}</div>))}</div></div>);
}
