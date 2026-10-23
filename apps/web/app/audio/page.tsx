"use client";
import { useEffect, useState } from "react";
import type { MaterialSummary } from "@pustaka/shared-types";
import { api } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, MaterialCard } from "@/components/ui";

export default function AudioPage() {
  const [items, setItems] = useState<MaterialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.materials().then((all) => setItems(all.filter((m) => (m.content_type || "").toUpperCase() === "AUDIO")))
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat.")).finally(() => setLoading(false));
  }, []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-emerald-deep">Audio</h1>
      <p className="text-sm text-stone-600">Materi berbentuk audio yang sudah diterbitkan. Kandidat audio dari sumber eksternal memerlukan proses transkripsi sebelum dapat diterbitkan.</p>
      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState /> : items.length === 0 ? (
        <EmptyState title="Belum ada audio yang diterbitkan" body="Belum ada audio yang diterbitkan. Materi audio akan tampil di sini setelah diterbitkan oleh admin." />
      ) : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((m) => <MaterialCard key={m.id} m={m} />)}</div>}
    </div>
  );
}
