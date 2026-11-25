import { redirect } from "next/navigation";

/** Tanya AI tidak lagi berdiri sebagai halaman sendiri (keputusan user
 *  25 Nov 2026): fiturnya menyatu ke halaman Cari sebagai mode "Tanya AI".
 *  Rute lama ini dipertahankan sebagai pengalihan agar tautan lama tidak
 *  putus. */
export default function TanyaPage() {
  redirect("/cari?mode=ai");
}
