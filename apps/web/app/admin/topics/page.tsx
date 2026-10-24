"use client";
import { useEffect, useState } from "react";
import EditorialManager from "@/components/EditorialManager";
import { apiFetch } from "@/lib/api";
export default function Topics() {
  const [topics,setTopics]=useState<Record<string,string>[]>([]);
  const [error,setError]=useState("");
  const [version,setVersion]=useState(0);
  useEffect(()=>{apiFetch<Record<string,string>[]>("/api/admin/topics").then(setTopics).catch(e=>setError(String(e)));},[version]);
  return <div className="space-y-10">
    {error && <p role="alert">{error}</p>}
    <EditorialManager kind="topics" title="Pengelolaan Topik" fields={[
      {key:"code",label:"Kode",required:true},{key:"name_id",label:"Nama Indonesia",required:true},
      {key:"name_ar",label:"Nama Arab"},{key:"parent_id",label:"Topik Induk",options:topics},
      {key:"description_id",label:"Deskripsi",multiline:true}
    ]} />
    <button className="btn-outline" onClick={()=>setVersion(v=>v+1)}>Perbarui Pilihan Topik</button>
    <EditorialManager kind="issues" title="Pengelolaan Persoalan" fields={[
      {key:"code",label:"Kode",required:true},{key:"title_id",label:"Judul Persoalan",required:true},
      {key:"topic_id",label:"Topik",options:topics},{key:"description_id",label:"Ruang Lingkup",multiline:true}
    ]} />
  </div>;
}
