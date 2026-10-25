import CatalogBrowser from "@/components/CatalogBrowser";
import { IconHeadphones } from "@/components/icons";
export default function Audio(){return <div className="space-y-5"><h1 className="flex items-center gap-2.5 text-xl font-extrabold text-emerald-deep"><IconHeadphones className="h-6 w-6 text-emerald" /> Pustaka Audio</h1><p className="text-sm leading-relaxed text-muted">Rekaman yang telah diproses dan diterbitkan akan tampil di sini.</p><CatalogBrowser contentType="AUDIO"/></div>;}
