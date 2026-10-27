"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import type { MaterialSummary, Scholar, Topic } from "@pustaka/shared-types";
import { api, apiFetch, scholarName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, MaterialCard } from "@/components/ui";
import { IconChevronDown, IconSearch } from "@/components/icons";
export type CatalogPage={items:MaterialSummary[];total:number;offset:number;limit:number;has_more:boolean};
export default function CatalogBrowser({initialQuery="",scholarId,contentType,topicId}:{initialQuery?:string;scholarId?:string;contentType?:string;topicId?:string}){
  const [draft,setDraft]=useState(initialQuery),[query,setQuery]=useState(initialQuery),[offset,setOffset]=useState(0);
  const [selectedScholar,setSelectedScholar]=useState(scholarId||""),[selectedTopic,setSelectedTopic]=useState(topicId||"");
  const [scholars,setScholars]=useState<Scholar[]>([]),[topics,setTopics]=useState<Topic[]>([]);
  const [page,setPage]=useState<CatalogPage|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
  useEffect(()=>{setQuery(initialQuery);setDraft(initialQuery);setOffset(0);},[initialQuery]);
  useEffect(()=>{Promise.all([api.scholars(),api.topics()]).then(([s,t])=>{setScholars(s);setTopics(t);}).catch(()=>{});},[]);
  const requestId = useRef(0);
  const load=useCallback(async()=>{
    const request = ++requestId.current;
    setLoading(true);setError("");const qs=new URLSearchParams({q:query,offset:String(offset),limit:"24"});
    if(scholarId||selectedScholar)qs.set("scholar_id",scholarId||selectedScholar);
    if(selectedTopic)qs.set("topic_id",selectedTopic);if(contentType)qs.set("content_type",contentType);
    try{const result=await apiFetch<CatalogPage>(`/api/catalog/materials?${qs}`,{auth:false});if(request===requestId.current)setPage(result);}catch(e){if(request===requestId.current)setError(e instanceof Error?e.message:"Gagal memuat katalog");}finally{if(request===requestId.current)setLoading(false);}
  },[query,offset,scholarId,selectedScholar,selectedTopic,contentType]);
  useEffect(()=>{load();},[load]);
  return <section className="space-y-4"><form className="flex gap-2" onSubmit={e=>{e.preventDefault();setQuery(draft);setOffset(0);}}>
    <div className="relative min-w-0 flex-1"><IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/><input className="input input-search input-compact min-w-0" aria-label="Cari materi" placeholder="Cari hukum, istilah, atau judul materi…" value={draft} onChange={e=>setDraft(e.target.value)}/></div><button className="btn-primary btn-compact shrink-0" type="submit"><IconSearch className="h-4 w-4 sm:hidden"/><span className="hidden sm:inline">Cari</span></button></form>
    <div className="grid gap-3 sm:grid-cols-2">{!scholarId&&<label className="min-w-0 text-xs font-semibold">Ulama<select className="input input-compact mt-1.5" value={selectedScholar} onChange={e=>{setSelectedScholar(e.target.value);setOffset(0);}}><option value="">Semua Ulama</option>{scholars.map(s=><option key={s.id} value={s.id}>{scholarName(s)}</option>)}</select></label>}
    <label className="min-w-0 text-xs font-semibold">Topik<select className="input input-compact mt-1.5" value={selectedTopic} onChange={e=>{setSelectedTopic(e.target.value);setOffset(0);}}><option value="">Semua Topik</option>{topics.map(t=><option key={t.id} value={t.id}>{t.name_id||t.code}</option>)}</select></label></div>
    {error?<ErrorState message={error} onRetry={load}/>:loading?<LoadingState label="Memuat katalog…"/>:page&&<><p className="text-xs text-muted">{page.total} materi ditemukan{query?` untuk “${query}”`:""}</p>
      {page.items.length===0?<EmptyState title="Belum ada materi yang sesuai" body="Coba kata kunci atau filter lain. Hanya materi yang sudah diterbitkan yang ditampilkan."/>:<div className="grid grid-cols-1 gap-4 md:grid-cols-2">{page.items.map(m=><MaterialCard key={m.id} m={m}/>)}</div>}
      <nav aria-label="Halaman katalog" className="flex flex-wrap items-center justify-between gap-2 sm:gap-3"><button className="btn-outline" disabled={offset===0} onClick={()=>setOffset(o=>Math.max(0,o-24))}><IconChevronDown className="h-4 w-4 rotate-90"/>Sebelumnya</button><span className="order-first w-full text-center text-sm text-muted sm:order-none sm:w-auto sm:text-left">Halaman {Math.floor(offset/24)+1} / {Math.max(1,Math.ceil(page.total/24))}</span><button className="btn-outline" disabled={!page.has_more} onClick={()=>setOffset(o=>o+24)}>Berikutnya<IconChevronDown className="h-4 w-4 -rotate-90"/></button></nav></>}
  </section>;
}
