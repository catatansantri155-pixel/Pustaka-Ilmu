"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Issue } from "@pustaka/shared-types";
import { api } from "@/lib/api";
import CatalogBrowser from "@/components/CatalogBrowser";
import { LoadingState } from "@/components/ui";
function Search(){
  const params=useSearchParams();const [issues,setIssues]=useState<Issue[]>([]);
  useEffect(()=>{api.issues().then(setIssues).catch(()=>{});},[]);
  return <div className="space-y-8"><h1 className="text-2xl font-extrabold text-emerald-deep">Cari Persoalan</h1>
    <CatalogBrowser initialQuery={params.get("q")||""} topicId={params.get("topic_id")||undefined}/>
    <section><h2 className="mb-3 text-lg font-bold text-emerald-deep">Daftar Persoalan</h2><div className="grid gap-3 sm:grid-cols-2">{issues.map(i=><Link className="card space-y-2 p-5" key={i.id} href={`/persoalan/${i.id}`}><span className="block text-xs text-muted">{i.code}</span><strong>{i.title_id}</strong>{i.description_id&&<p className="text-sm text-muted">{i.description_id}</p>}</Link>)}</div></section>
  </div>;
}
export default function SearchPage(){return <Suspense fallback={<LoadingState/>}><Search/></Suspense>;}
