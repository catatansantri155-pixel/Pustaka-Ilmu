"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ErrorState, LoadingState } from "@/components/ui";
type Report={id:string; material_id:string; message:string; status:string; reporter_name:string};
export default function Corrections(){
  const [items,setItems]=useState<Report[]>([]),[total,setTotal]=useState(0),[offset,setOffset]=useState(0);
  const [error,setError]=useState(""),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [selected,setSelected]=useState(""),[notes,setNotes]=useState(""),[status,setStatus]=useState("IN_REVIEW");
  const load=useCallback(async()=>{setLoading(true);try{const r=await apiFetch<{items:Report[];total:number}>(`/api/admin/correction-reports?offset=${offset}&limit=25`);setItems(r.items);setTotal(r.total);setError("");}catch(e){setError(String(e));}finally{setLoading(false);}},[offset]);
  useEffect(()=>{load();},[load]);
  async function save(){setBusy(true);try{await apiFetch(`/api/admin/correction-reports/${selected}`,{method:"PATCH",body:JSON.stringify({status,notes})});setSelected("");setNotes("");await load();}catch(e){setError(String(e));}finally{setBusy(false);}}
  return <div className="space-y-5"><h1 className="text-2xl font-bold text-emerald-deep">Laporan Koreksi</h1>
    {error&&<ErrorState message={error} onRetry={load}/>}{loading?<LoadingState/>:items.length===0?<p>Belum ada laporan.</p>:items.map(r=><article className="card space-y-3 p-5" key={r.id}>
      <div className="flex justify-between gap-3"><Link className="font-bold text-emerald underline" href={`/admin/editor/${r.material_id}`}>Buka Materi</Link><span>{r.status}</span></div>
      <p className="whitespace-pre-wrap">{r.message}</p><p className="text-xs text-muted">{r.reporter_name||"Pembaca"}</p>
      <button className="btn-outline" onClick={()=>{setSelected(r.id);setNotes("");setStatus("IN_REVIEW");}}>Tindak Lanjuti</button>
      {selected===r.id&&<div className="space-y-3"><label className="block">Keputusan<select className="input ml-3" value={status} onChange={e=>setStatus(e.target.value)}><option value="IN_REVIEW">Dalam Pemeriksaan / Buka Kembali</option><option value="RESOLVED">Selesai Ditangani</option><option value="DISMISSED">Tidak Diterapkan</option></select></label><label className="block">Catatan Keputusan<textarea className="input mt-1 w-full" minLength={5} value={notes} onChange={e=>setNotes(e.target.value)}/></label><button className="btn-primary" disabled={busy||notes.trim().length<5} onClick={save}>Simpan Keputusan</button></div>}
    </article>)}
    <div className="flex items-center gap-4"><button className="btn-outline" disabled={offset===0||loading} onClick={()=>setOffset(o=>Math.max(0,o-25))}>Sebelumnya</button><span>{total} laporan</span><button className="btn-outline" disabled={offset+25>=total||loading} onClick={()=>setOffset(o=>o+25)}>Berikutnya</button></div>
  </div>;
}
