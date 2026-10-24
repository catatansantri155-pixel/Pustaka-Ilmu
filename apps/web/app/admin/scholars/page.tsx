"use client";
import EditorialManager from "@/components/EditorialManager";
export default function Scholars() {
  return <EditorialManager kind="scholars" title="Pengelolaan Ulama" fields={[
    {key:"name_id", label:"Nama Indonesia",required:true}, {key:"name_ar", label:"Nama Arab"},
    {key:"birth_year_h",label:"Tahun Lahir Hijriah"}, {key:"death_year_h",label:"Tahun Wafat Hijriah"},
    {key:"death_year_m",label:"Tahun Wafat Masehi"}, {key:"bio_id",label:"Biografi (gunakan sumber yang dapat ditelusuri)",multiline:true}
  ]} />;
}
