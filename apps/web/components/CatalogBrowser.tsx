"use client";
import { useCallback, useEffect, useState, useRef, type ReactNode } from "react";
import type { MaterialSummary, Scholar, Topic } from "@pustaka/shared-types";
import { api, apiFetch, scholarName } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, MaterialCard } from "@/components/ui";
import { IconChevronDown, IconClock, IconFilter, IconSearch, IconX } from "@/components/icons";
export type CatalogPage={items:MaterialSummary[];total:number;offset:number;limit:number;has_more:boolean};
export default function CatalogBrowser({initialQuery="",scholarId,contentType,topicId,onSearch,beforeResults,searchPage=false}:{initialQuery?:string;scholarId?:string;contentType?:string;topicId?:string;onSearch?:(q:string)=>void;beforeResults?:ReactNode;searchPage?:boolean}){
  const [draft,setDraft]=useState(initialQuery),[query,setQuery]=useState(initialQuery),[offset,setOffset]=useState(0);
  const [selectedScholar,setSelectedScholar]=useState(scholarId||""),[selectedTopic,setSelectedTopic]=useState(topicId||"");
  const [scholars,setScholars]=useState<Scholar[]>([]),[topics,setTopics]=useState<Topic[]>([]);
  const [page,setPage]=useState<CatalogPage|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const [history,setHistory]=useState<string[]>([]);
  useEffect(()=>{setQuery(initialQuery);setDraft(initialQuery);setOffset(0);},[initialQuery]);
  useEffect(()=>{setSelectedTopic(topicId||"");setOffset(0);},[topicId]);
  useEffect(()=>{
    if(!searchPage)return;
    try {
      const raw:unknown=JSON.parse(localStorage.getItem("pustaka:search-history")||"[]");
      const previous=Array.isArray(raw)?raw.filter((v):v is string=>typeof v==="string"):[];
      const q=initialQuery.trim();
      const next=(q?[q,...previous.filter(v=>v.toLowerCase()!==q.toLowerCase())]:previous).slice(0,5);
      setHistory(next);
      if(q)localStorage.setItem("pustaka:search-history",JSON.stringify(next));
    } catch {}
  },[searchPage,initialQuery]);
  function submit(value:string){
    const q=value.trim();
    setDraft(q);setQuery(q);setOffset(0);onSearch?.(q);
    if(searchPage&&q){
      const next=[q,...history.filter(v=>v.toLowerCase()!==q.toLowerCase())].slice(0,5);
      setHistory(next);
      try {localStorage.setItem("pustaka:search-history",JSON.stringify(next));} catch {}
    }
  }
  function clearHistory(){
    setHistory([]);
    try {localStorage.removeItem("pustaka:search-history");} catch {}
  }
  useEffect(()=>{api.scholars().then(setScholars).catch(()=>{});api.topics().then(setTopics).catch(()=>{});},[]);
  const requestId = useRef(0);
  const load=useCallback(async()=>{
    const request = ++requestId.current;
    setLoading(true);setError("");const qs=new URLSearchParams({q:query,offset:String(offset),limit:"24"});
    if(scholarId||selectedScholar)qs.set("scholar_id",scholarId||selectedScholar);
    if(selectedTopic)qs.set("topic_id",selectedTopic);if(contentType)qs.set("content_type",contentType);
    try{const result=await apiFetch<CatalogPage>(`/api/catalog/materials?${qs}`,{auth:false});if(request===requestId.current)setPage(result);}catch(e){if(request===requestId.current)setError(e instanceof Error?e.message:"Gagal memuat katalog");}finally{if(request===requestId.current)setLoading(false);}
  },[query,offset,scholarId,selectedScholar,selectedTopic,contentType]);
  useEffect(()=>{load();},[load]);
  return <section className="space-y-5">
    <div className={searchPage?"card space-y-3 p-3.5 sm:p-5":"space-y-4"}>
      <form role="search" className="flex gap-2" onSubmit={e=>{e.preventDefault();submit(draft);}}>
        <div className="relative min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/>
          <input type="search" className="input input-search input-compact min-w-0" aria-label="Cari materi atau pertanyaan" placeholder="Cari materi atau pertanyaan…" value={draft} onChange={e=>setDraft(e.target.value)}/>
        </div>
        <button className="btn-primary btn-compact shrink-0" type="submit" aria-label="Cari"><IconSearch className="h-4 w-4 sm:hidden"/><span className="hidden sm:inline">Cari</span></button>
      </form>
      {searchPage&&history.length>0&&<div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted"><IconClock className="h-4 w-4"/> Riwayat di perangkat ini</span>
          <button type="button" className="chip border-line bg-white text-muted" onClick={clearHistory}>Hapus</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">{history.map(term=><button type="button" key={term} onClick={()=>submit(term)} className="chip max-w-full whitespace-normal break-words border-line bg-white text-emerald-deep">{term}</button>)}</div>
      </div>}
      <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-muted">Saran:</span>{["wudhu","shalat jamak","pembatal puasa","haid","qadha puasa"].map(term=><button key={term} type="button" onClick={()=>submit(term)} className={`chip ${query===term?"border-emerald bg-secondary font-semibold text-emerald":"border-line bg-white text-emerald-deep"}`}>{term}</button>)}</div>
      {searchPage&&<div className="flex items-center justify-between gap-2 border-t border-line pt-3">
        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-deep"><IconFilter className="h-4 w-4"/> Filter materi</span>
        {(selectedScholar||selectedTopic)&&<button type="button" onClick={()=>{setSelectedScholar(scholarId||"");setSelectedTopic("");setOffset(0);}} className="chip border-line bg-white text-emerald"><IconX className="h-3.5 w-3.5"/> Reset</button>}
      </div>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{!scholarId&&<label className="min-w-0 text-xs font-semibold">Ulama<select className="input input-compact mt-1" value={selectedScholar} onChange={e=>{setSelectedScholar(e.target.value);setOffset(0);}}><option value="">Semua Ulama</option>{scholars.map(s=><option key={s.id} value={s.id}>{scholarName(s)}</option>)}</select></label>}
        <label className="min-w-0 text-xs font-semibold">Topik<select className="input input-compact mt-1" value={selectedTopic} onChange={e=>{setSelectedTopic(e.target.value);setOffset(0);}}><option value="">Semua Topik</option>{topics.map(t=><option key={t.id} value={t.id}>{t.name_id||t.code}</option>)}</select></label>
      </div>
      {searchPage&&<p className="text-xs text-muted">Filter berlaku untuk katalog materi. Ringkasan AI menggunakan pencarian berdasarkan pertanyaan.</p>}
    </div>
    {beforeResults}
    {searchPage&&<h2 className="section-heading">Hasil katalog</h2>}
    {error?<ErrorState message={error} onRetry={load}/>:loading?<LoadingState label="Memuat katalog…"/>:page&&<><p className="text-sm text-muted" role="status">{page.total} materi ditemukan{query?` untuk “${query}”`:""}</p>
      {page.items.length===0?<EmptyState title="Belum ada materi yang sesuai" body="Coba kata kunci atau filter lain. Hanya materi yang sudah diterbitkan yang ditampilkan."/>:<div className="grid grid-cols-1 gap-4 md:grid-cols-2">{page.items.map(m=><MaterialCard key={m.id} m={m}/>)}</div>}
      <nav aria-label="Halaman katalog" className="flex flex-wrap items-center justify-between gap-2 sm:gap-3"><button className="btn-outline" disabled={offset===0} onClick={()=>setOffset(o=>Math.max(0,o-24))}><IconChevronDown className="h-4 w-4 rotate-90"/>Sebelumnya</button><span className="order-first w-full text-center text-sm text-muted sm:order-none sm:w-auto sm:text-left">Halaman {Math.floor(offset/24)+1} / {Math.max(1,Math.ceil(page.total/24))}</span><button className="btn-outline" disabled={!page.has_more} onClick={()=>setOffset(o=>o+24)}>Berikutnya<IconChevronDown className="h-4 w-4 -rotate-90"/></button></nav></>}
  </section>;
}
