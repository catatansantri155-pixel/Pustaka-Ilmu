"use client";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ErrorState } from "@/components/ui";
type Task={id:string;kind:string;url:string;material_id:string;status:string;attempts:number;max_attempts:number;error:string};
type Registry={id:string;name:string};
export default function QueueUI(){
 const [rows,setRows]=useState<Task[]>([]),[registries,setRegistries]=useState<Registry[]>([]),[registry,setRegistry]=useState("");
 const [url,setUrl]=useState(""),[material,setMaterial]=useState(""),[kind,setKind]=useState("IMPORT"),[offset,setOffset]=useState(0),[total,setTotal]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const load=useCallback(async()=>{try{const r=await apiFetch<{items:Task[];total:number}>(`/api/admin/queue?offset=${offset}&limit=25`);setRows(r.items);setTotal(r.total);setError("");}catch(e){setError(String(e));}},[offset]);
 useEffect(()=>{load();},[load]);useEffect(()=>{apiFetch<Registry[]>("/api/admin/sources").then(setRegistries).catch(e=>setError(String(e)));},[]);
 async function enqueue(){setBusy(true);try{await apiFetch("/api/admin/queue",{method:"POST",body:JSON.stringify(kind==="IMPORT"?{kind,url,registry_id:registry}:{kind,material_id:material})});setUrl("");setMaterial("");await load();}catch(e){setError(String(e));}finally{setBusy(false);}}
 async function retry(id:string){setBusy(true);try{await apiFetch(`/api/admin/queue/${id}/retry`,{method:"POST"});await load();}catch(e){setError(String(e));}finally{setBusy(false);}}
 return <section className="card my-6 space-y-4 p-5"><h2 className="text-lg font-bold text-emerald-deep">Antrean Konten</h2><p className="text-sm text-muted">Pekerjaan disimpan di database, diproses worker, dan dicoba ulang saat gagal. Penerbitan tetap melalui persetujuan admin.</p>
 {error&&<ErrorState message={error} onRetry={load}/>}
 <form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();enqueue();}}><label>Jenis<select className="input mt-1 w-full" value={kind} onChange={e=>setKind(e.target.value)}><option value="IMPORT">Impor Sumber</option><option value="TRANSLATE">Terjemahkan Materi</option></select></label>
 {kind==="IMPORT"?<><label>Sumber<select required className="input mt-1 w-full" value={registry} onChange={e=>setRegistry(e.target.value)}><option value="">Pilih Sumber</option>{registries.map(r=><option value={r.id} key={r.id}>{r.name}</option>)}</select></label><label className="sm:col-span-2">URL<input type="url" required className="input mt-1 w-full" value={url} onChange={e=>setUrl(e.target.value)}/></label></>:<label>ID Materi<input required className="input mt-1 w-full" value={material} onChange={e=>setMaterial(e.target.value)}/></label>}
 <button className="btn-primary" disabled={busy}>Tambahkan ke Antrean</button></form>
 <button className="btn-outline" onClick={load}>Perbarui Status</button>
 {rows.map(t=><article key={t.id} className="space-y-1 rounded-xl border border-line p-4 text-sm"><p className="font-bold">{t.kind} · {t.status} · Percobaan {t.attempts}/{t.max_attempts}</p><p className="break-all">{t.url||t.material_id}</p>{t.error&&<p role="status" className="text-red-700">{t.error}</p>}{["BLOCKED","FAILED"].includes(t.status)&&<button className="btn-outline mt-2" disabled={busy} onClick={()=>retry(t.id)}>Coba Lagi</button>}</article>)}
 <nav className="flex items-center gap-4"><button className="btn-outline" disabled={!offset} onClick={()=>setOffset(o=>o-25)}>Sebelumnya</button><span>{total} pekerjaan</span><button className="btn-outline" disabled={offset+25>=total} onClick={()=>setOffset(o=>o+25)}>Berikutnya</button></nav>
 </section>;
}
