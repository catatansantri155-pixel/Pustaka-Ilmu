"use client";
import { useEffect, useState } from "react";
import type { Issue, Topic } from "@pustaka/shared-types";
import { api, topicName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]); const [issues, setIssues] = useState<Issue[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => { Promise.all([api.topics(), api.issues()]).then(([t, i]) => { setTopics(t); setIssues(i); }).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat.")).finally(() => setLoading(false)); }, []);
  return (<div><h1 className="text-2xl font-bold text-emerald-deep">Topics</h1><p className="mt-1 text-sm text-stone-600">Topik dan persoalan dari endpoint publik. Pengelolaan topik belum disediakan kontrak API admin pada MVP, sehingga halaman ini bersifat baca.</p>
    {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
    {loading ? <div className="mt-5"><LoadingState /></div> : (<>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{topics.length === 0 ? <EmptyState title="Belum ada topik" body="Topik belum tersedia dari server." /> : topics.map((t) => (<div key={t.id} className="card p-4">{t.code ? <p className="text-xs font-bold text-gold">{t.code}</p> : null}<p className="font-semibold text-emerald-deep">{topicName(t)}</p>{t.name_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-1 text-right">{t.name_ar}</p> : null}{t.description ? <p className="mt-1 text-sm text-stone-600">{t.description}</p> : null}</div>))}</div>
      <h2 className="mb-3 mt-8 text-lg font-bold text-emerald-deep">Persoalan</h2>
      <div className="space-y-2">{issues.length === 0 ? <EmptyState title="Belum ada persoalan" body="Persoalan belum tersedia dari server." /> : issues.map((i) => (<div key={i.id} className="card p-4"><p className="font-semibold text-emerald-deep">{i.title_id || i.title || i.question}</p>{i.description ? <p className="text-sm text-stone-600">{i.description}</p> : null}</div>))}</div>
    </>)}</div>);
}
