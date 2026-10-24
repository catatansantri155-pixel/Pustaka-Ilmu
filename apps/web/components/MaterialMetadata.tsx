"use client";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
type Option={id:string;name_id?:string;title_id?:string};
type Metadata={title_id:string;title_ar:string;scholar_id:string|null;topic_ids:string[];issue_ids:string[]};
export default function MaterialMetadata({id,onSaved}:{id:string;onSaved:()=>void}){
  const [value,setValue]=useState<Metadata|null>(null),[scholars,setScholars]=useState<Option[]>([]),[topics,setTopics]=useState<Option[]>([]),[issues,setIssues]=useState<Option[]>([]);
  const [message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  const load=useCallback(async()=>{try{const [m,s,t,i]=await Promise.all([apiFetch<Metadata>(`/api/admin/materials/${id}/metadata`),apiFetch<Option[]>("/api/admin/scholars"),apiFetch<Option[]>("/api/admin/topics"),apiFetch<Option[]>("/api/admin/issues")]);setValue(m);setScholars(s);setTopics(t);setIssues(i);}catch(e){setMessage(String(e));}},[id]);
  useEffect(()=>{load();},[load]);
  async function save(){setBusy(true);try{await apiFetch(`/api/admin/materials/${id}/metadata`,{method:"PUT",body:JSON.stringify(value)});setMessage("Metadata tersimpan. Materi kembali ke antrean peninjauan dan perlu persetujuan ulang.");onSaved();}catch(e){setMessage(String(e));}finally{setBusy(false);}}
  return <details className="card p-5"><summary className="cursor-pointer font-bold text-emerald-deep">Judul, Ulama, Topik, dan Persoalan</summary>{message&&<p role="status" className="my-3">{message}</p>}{!value?<button className="btn-outline mt-3" onClick={load}>Muat Metadata</button>:<div className="mt-4 space-y-4">
    <label className="block">Judul Indonesia<input className="input mt-1 w-full" value={value.title_id} onChange={e=>setValue({...value,title_id:e.target.value})}/></label>
    <label className="block">Judul Arab<input dir="rtl" className="input mt-1 w-full" value={value.title_ar} onChange={e=>setValue({...value,title_ar:e.target.value})}/></label>
    <label className="block">Ulama<select className="input mt-1 w-full" value={value.scholar_id||""} onChange={e=>setValue({...value,scholar_id:e.target.value||null})}><option value="">Tanpa Pilihan</option>{scholars.map(s=><option value={s.id} key={s.id}>{s.name_id}</option>)}</select></label>
    {([['topic_ids',topics,'Topik'],['issue_ids',issues,'Persoalan']] as const).map(([key,options,title])=><fieldset key={key}><legend className="font-semibold">{title}</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{options.map(o=><label key={o.id} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={value[key].includes(o.id)} onChange={e=>setValue({...value,[key]:e.target.checked?[...value[key],o.id]:value[key].filter(v=>v!==o.id)})}/>{o.name_id||o.title_id}</label>)}</div></fieldset>)}
    <button className="btn-primary" disabled={busy||!value.title_id.trim()} onClick={save}>{busy?"Menyimpan…":"Simpan Metadata"}</button>
  </div>}</details>;
}
