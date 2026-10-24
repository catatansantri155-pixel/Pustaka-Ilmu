"use client";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
type Finding={rule:string;severity:string;message:string;segment_ref?:string};
export default function MaterialVerification({id,onSaved}:{id:string;onSaved:()=>void}){
 const [complete,setComplete]=useState(false),[evidence,setEvidence]=useState(""),[notes,setNotes]=useState("");
 const [findings,setFindings]=useState<Finding[]>([]),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const [reviews,setReviews]=useState<Record<string,string>>({});
 const load=useCallback(async()=>{try{const r=await apiFetch<{current_findings:Finding[]}>(`/api/admin/materials/${id}`);setFindings(r.current_findings||[]);}catch(e){setMessage(String(e));}},[id]);
 useEffect(()=>{load();},[load]);
 async function verify(){setBusy(true);try{await apiFetch(`/api/admin/materials/${id}/verification`,{method:"POST",body:JSON.stringify({arabic_complete:complete,rights_evidence:evidence,notes})});setMessage("Verifikasi tersimpan. Persetujuan publikasi dilakukan setelah pemeriksaan selesai.");onSaved();}catch(e){setMessage(String(e));}finally{setBusy(false);}}
 async function review(f:Finding,key:string){setBusy(true);try{await apiFetch(`/api/admin/materials/${id}/quality-review`,{method:"POST",body:JSON.stringify({rule:f.rule,segment_ref:f.segment_ref||"",notes:reviews[key]||""})});setMessage("Hasil telaah tercatat untuk versi teks ini. Perubahan teks akan membatalkan telaah tersebut.");onSaved();}catch(e){setMessage(String(e));}finally{setBusy(false);}}
 return <details className="card p-5"><summary className="cursor-pointer font-bold text-emerald-deep">Verifikasi Sumber dan Temuan Kualitas</summary><div className="mt-4 space-y-4">
 <p className="text-sm text-muted">Tersedia untuk admin. Pemeriksaan ini bersifat operasional; label terjemahan AI tetap ditampilkan.</p>
 {message&&<p role="status">{message}</p>}
 <label className="flex items-start gap-2"><input type="checkbox" checked={complete} onChange={e=>setComplete(e.target.checked)}/>Saya telah mencocokkan kelengkapan teks Arab dan seluruh segmennya dengan sumber asli.</label>
 <label className="block">Bukti izin penyalinan dan atribusi<textarea className="input mt-1 w-full" value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="Tautan ketentuan sumber dan ketentuan izin yang diperiksa"/></label>
 <label className="block">Catatan pemeriksaan<textarea className="input mt-1 w-full" value={notes} onChange={e=>setNotes(e.target.value)}/></label>
 <button className="btn-primary" disabled={busy||!complete||evidence.trim().length<10||notes.trim().length<10} onClick={verify}>Simpan Verifikasi</button>
 <h3 className="font-bold">Temuan pada Teks Terkini</h3>{findings.length===0?<p className="text-sm">Tidak ada temuan dari pemeriksaan otomatis dasar. Ketepatan makna dan referensi tetap perlu diperiksa.</p>:findings.map((f,i)=>{const key=`${f.rule}-${f.segment_ref}-${i}`;return <div key={key} className="space-y-2 rounded-xl border border-line p-4"><p className="font-semibold">{f.severity} · {f.rule}</p><p>{f.message}</p>{f.severity!=="CRITICAL"&&<><label className="block text-sm">Alasan hasil pemeriksaan perlu dikecualikan pada versi ini<textarea className="input mt-1 w-full" value={reviews[key]||""} onChange={e=>setReviews({...reviews,[key]:e.target.value})}/></label><button className="btn-outline" disabled={busy||(reviews[key]||"").trim().length<10} onClick={()=>review(f,key)}>Catat Hasil Telaah</button></>}</div>;})}
 </div></details>;
}
