"use client";
import { useEffect, useState } from "react";
import type { ReferenceItem } from "@pustaka/shared-types";
import { api } from "@/lib/api";
import { EmptyState, LoadingState } from "@/components/ui";
export default function ReferencesPage() {
  const [quran, setQuran] = useState<ReferenceItem[] | null>(null); const [hadith, setHadith] = useState<ReferenceItem[] | null>(null); const [err, setErr] = useState<string | null>(null);
  useEffect(() => { (async () => { try { setQuran(await api.references("quran")); } catch { setQuran([]); } try { setHadith(await api.references("hadith")); } catch { setHadith([]); } })(); }, []);
  const loading = quran === null || hadith === null;
  function List({ title, items }: { title: string; items: ReferenceItem[] }) { return (<section className="mt-6"><h2 className="mb-3 text-lg font-bold text-emerald-deep">{title}</h2>{items.length === 0 ? <EmptyState title="Dataset belum diisi" body={`Dataset referensi ${title} belum diisi. Entri akan tampil di sini setelah dataset dimuat ke server.`} /> : (<div className="space-y-3">{items.map((r, i) => (<div key={r.id || i} className="card p-4">{r.reference ? <p className="font-semibold text-emerald-deep">{r.reference}</p> : null}{r.text_ar ? <p dir="rtl" lang="ar" className="font-arabic mt-1 text-right text-lg">{r.text_ar}</p> : null}{r.text_id ? <p className="mt-1 text-sm text-stone-700">{r.text_id}</p> : null}{!r.reference && !r.text_ar && !r.text_id ? <pre className="overflow-x-auto text-xs">{JSON.stringify(r, null, 2)}</pre> : null}</div>))}</div>)}</section>); }
  return (<div><h1 className="text-2xl font-bold text-emerald-deep">References</h1><p className="mt-1 text-sm text-stone-600">Dataset referensi ayat Al-Qur&apos;an dan hadis yang dipakai untuk memeriksa klaim faktual materi.</p>{err ? <p>{err}</p> : null}{loading ? <div className="mt-5"><LoadingState /></div> : (<><List title="Al-Qur'an" items={quran || []} /><List title="Hadis" items={hadith || []} /></>)}</div>);
}
