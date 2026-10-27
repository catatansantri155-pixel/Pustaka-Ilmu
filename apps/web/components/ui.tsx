import Link from "next/link";
import type { ReactNode } from "react";
import type { MaterialSummary } from "@pustaka/shared-types";
import { materialTitle, scholarName, topicName } from "@/lib/api";
import { imageForMaterial } from "@/lib/topicImages";
import TopicCover from "@/components/TopicCover";
import BookmarkButton from "@/components/BookmarkButton";
import { IconAlert, IconBookOpen, IconChevronRight } from "@/components/icons";

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-emerald/30 bg-surface px-5 py-7 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald shadow-soft">
        <IconBookOpen className="h-6 w-6" />
      </span>
      <p className="mt-3 font-semibold text-emerald-deep">{title}</p>
      {body ? <p className="mx-auto mt-1.5 max-w-prose text-sm leading-relaxed text-muted">{body}</p> : null}
    </div>
  );
}
export function SkeletonCard() {
  return (
    <div className="card flex gap-4 p-4" aria-hidden>
      <div className="h-24 w-24 shrink-0 rounded-2xl bg-surface sm:h-28 sm:w-32" />
      <div className="min-w-0 flex-1 py-1">
        <div className="h-3.5 w-24 rounded-full bg-surface" />
        <div className="mt-3 h-4 w-3/4 rounded bg-surface" />
        <div className="mt-2 h-3.5 w-full rounded bg-surface" />
        <div className="mt-2 h-3.5 w-2/3 rounded bg-surface" />
      </div>
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
    <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 px-6 py-6 text-sm text-red-800">
      <p className="flex items-center gap-2 font-semibold">
        <IconAlert className="h-5 w-5 shrink-0" /> Data belum dapat dimuat.
      </p>
      <p className="mt-1.5 leading-relaxed">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800">
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}
export function MaterialCard({ m }: { m: MaterialSummary }) {
  const img = imageForMaterial(m);
  return (
    // PR #12: .cv-material menunda render kartu yang jauh di luar layar
    // (content-visibility) supaya daftar panjang ringan digulir.
    <div className="cv-material relative min-w-0">
    <Link href={`/materi/${m.id}`} className="catalog-entry group w-full">
      <div className="flex min-w-0 gap-4 p-3.5 sm:gap-5 sm:p-4">
        <TopicCover image={img} className="h-24 w-24 shrink-0 rounded-2xl sm:h-28 sm:w-36" />
        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {m.topics?.slice(0, 2).map((t) => (
              <span key={t.id} className="text-[11px] font-semibold uppercase tracking-wide text-emerald">{topicName(t)}</span>
            ))}
            {m.content_type ? <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{m.content_type}</span> : null}
            {m.is_demo ? <span className="chip border-amber-300 bg-amber-50 text-amber-800">Demo</span> : null}
          </div>
          <h3 className="mt-1.5 text-base font-bold leading-snug text-emerald-deep">{materialTitle(m)}</h3>
          {m.title_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-1 truncate text-right text-base text-stone-700">{m.title_ar}</p> : null}
          {m.summary ? <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-600">{m.summary}</p> : null}
          <p className="mt-2.5 flex min-w-0 items-center gap-1 text-xs font-medium text-stone-500">
            <span className="min-w-0 truncate">{scholarName(m.scholar) || m.scholar_name || ""}{m.ai_label ? ` · ${m.ai_label}` : ""}</span>
            <IconChevronRight className="ml-auto h-4 w-4 shrink-0 text-emerald transition group-hover:translate-x-0.5" />
          </p>
        </div>
      </div>
    </Link>
    {/* Tombol penanda lokal: saudara tautan kartu (BUKAN di dalamnya) agar
        kliknya tidak pernah menyatu dengan navigasi kartu. */}
    <div className="absolute right-3 top-3 z-10">
      <BookmarkButton m={m} />
    </div>
    </div>
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
