"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { MaterialSummary } from "@pustaka/shared-types";
import { api, materialTitle, scholarName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";

export default function EditorIndexPage() {
  const [items, setItems] = useState<MaterialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.adminMaterials().then(setItems).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat.")).finally(() => setLoading(false)); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold text-emerald-deep">Bilingual Editor</h1>
      <p className="mt-1 text-sm text-stone-600">Pilih materi untuk dibuka di editor dwibahasa (Indonesia di kiri, Arab di kanan).</p>
      {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
      <div className="mt-5 space-y-3">
        {loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="Belum ada materi" body="Belum ada materi yang dapat dibuka di editor." /> : items.map((m) => (
          <Link key={m.id} href={`/admin/editor/${m.id}`} className="card flex items-center justify-between gap-3 p-4">
            <span><span className="font-semibold text-emerald-deep">{materialTitle(m)}</span><span className="block text-xs text-stone-500">{scholarName(m.scholar) || m.scholar_name || ""} · {m.status || m.pipeline_status || ""}{m.is_demo ? " · Demo" : ""}</span></span>
            <span className="btn-outline shrink-0">Buka Editor</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
