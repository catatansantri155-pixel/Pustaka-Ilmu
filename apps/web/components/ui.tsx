import Link from "next/link";
import type { ReactNode } from "react";
import type { MaterialSummary } from "@pustaka/shared-types";
import { materialTitle, scholarName, topicName } from "@/lib/api";

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-5 py-7">
      <p className="font-semibold text-emerald-deep">{title}</p>
      {body ? <p className="mt-2 max-w-prose text-sm text-muted">{body}</p> : null}
    </div>
  );
}
export function SkeletonCard() {
  return (
    <div className="card p-5" aria-hidden>
      <div className="h-4 w-24 rounded-full bg-surface" />
      <div className="mt-3 h-5 w-3/4 rounded bg-surface" />
      <div className="mt-2 h-4 w-full rounded bg-surface" />
      <div className="mt-2 h-4 w-2/3 rounded bg-surface" />
    </div>
  );
}
export function LoadingState({ label = "Memuat data…" }: { label?: string }) {
  // Skeleton terbatas: permintaan API mempunyai timeout keras (lib/api.ts),
  // jadi status ini selalu berakhir menjadi data, empty state, atau error state.
  return (
    <div role="status" aria-label={label} className="space-y-3">
      <p className="text-sm text-muted">{label}</p>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-6 py-6 text-sm text-red-800">
      <p className="font-semibold">Data belum dapat dimuat.</p>
      <p className="mt-1">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-4 inline-flex items-center justify-center rounded-full bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800">
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}
export function MaterialCard({ m }: { m: MaterialSummary }) {
  return (
    <Link href={`/materi/${m.id}`} className="catalog-entry">
      <div className="flex flex-wrap gap-2">
        {m.topics?.slice(0, 2).map((t) => (
          <span key={t.id} className="text-xs text-muted">{topicName(t)}</span>
        ))}
        {m.content_type ? <span className="text-xs text-muted">{m.content_type}</span> : null}
        {m.is_demo ? <span className="chip border-amber-300 bg-amber-50 text-amber-800">Demo</span> : null}
      </div>
      <h3 className="mt-2 text-lg font-bold leading-snug text-emerald-deep">{materialTitle(m)}</h3>
      {m.title_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-1 text-right text-lg leading-relaxed text-stone-700">{m.title_ar}</p> : null}
      {m.summary ? <p className="mt-2 line-clamp-3 text-sm text-stone-600">{m.summary}</p> : null}
      <p className="mt-3 text-xs font-medium text-stone-500">{scholarName(m.scholar) || m.scholar_name || ""}{m.ai_label ? ` · ${m.ai_label}` : ""}</p>
    </Link>
  );
}
export function AdminPlaceholder({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-emerald-deep">{title}</h1>
      <div className="card mt-5 p-6">
        <p className="font-semibold text-emerald-deep">Modul ini belum diimplementasikan pada MVP</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">{description}</p>
        {children}
      </div>
    </div>
  );
}
export function statusClass(status?: string | null): string {
  const s = (status || "").toUpperCase();
  if (["COMPLETED", "DONE", "SUCCESS", "SUCCEEDED", "PUBLISHED", "PUBLISHED_AI", "APPROVED", "OK", "ACTIVE"].includes(s)) return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (["FAILED", "ERROR", "REJECTED", "CRITICAL"].includes(s)) return "border-red-300 bg-red-50 text-red-800";
  if (["RUNNING", "PROCESSING", "IN_PROGRESS", "TRANSLATING"].includes(s)) return "border-sky-300 bg-sky-50 text-sky-800";
  if (["PENDING", "QUEUED", "WAITING", "DRAFT", "ADMIN_REVIEW"].includes(s)) return "border-amber-300 bg-amber-50 text-amber-800";
  return "border-stone-300 bg-stone-50 text-stone-700";
}
export function StatusChip({ status }: { status?: string | null }) {
  if (!status) return <span className="text-stone-400">—</span>;
  return <span className={`chip ${statusClass(status)}`}>{status}</span>;
}
export function severityClass(sev: string): string {
  const s = (sev || "").toUpperCase();
  if (s === "CRITICAL") return "border-red-300 bg-red-50 text-red-800";
  if (s === "HIGH" || s === "ERROR") return "border-orange-300 bg-orange-50 text-orange-800";
  if (s === "MEDIUM" || s === "WARNING") return "border-amber-300 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}
