"use client";
import { useEffect, useRef, useState } from "react";
import { IconExternal, IconInfo, IconX } from "@/components/icons";

/**
 * Tombol "Tentang" di pojok kanan atas header + panel detail aplikasi
 * (PR #12, permintaan user 27 Okt 2026). Tombol kecil berikon "i" tampil
 * di ponsel dan desktop; panelnya modal sederhana: latar gelap translusen,
 * kartu tengah, bisa ditutup lewat tombol tutup, klik latar, atau Esc.
 * Fokus dipindah ke tombol tutup saat panel dibuka dan dikembalikan ke
 * tombol pemicu saat ditutup; gulir halaman dikunci selama panel terbuka.
 * Isi panel adalah fakta aplikasi — jangan diubah tanpa keputusan user.
 */
export default function AboutButton() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      triggerRef.current?.focus();
    };
  }, [open ]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Tentang aplikasi Maktabah Al-'Ilmiyyah"
        aria-haspopup="dialog"
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-emerald-deep transition hover:bg-surface"
      >
        <IconInfo className="h-5 w-5" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tentang-judul"
        >
          {/* Latar: klik untuk menutup. */}
          <div
            className="absolute inset-0 bg-emerald-deep/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-lift sm:p-7">
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup panel tentang"
              className="absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-full text-emerald-deep transition hover:bg-surface"
            >
              <IconX className="h-5 w-5" />
            </button>

            <h2 id="tentang-judul" className="pr-10 text-lg font-extrabold leading-snug text-emerald-deep">
              Tentang Maktabah Al-&apos;Ilmiyyah
            </h2>

            <div className="mt-4 space-y-5 text-sm leading-relaxed text-stone-600">
              <section>
                <h3 className="text-sm font-bold text-emerald-deep">Tentang aplikasi</h3>
                <p className="mt-1">
                  Maktabah Al-&apos;Ilmiyyah adalah perpustakaan fatwa digital berbahasa Indonesia.
                  Setiap materi memuat teks Arab asli, terjemahan Indonesia, dan catatan sumbernya,
                  supaya pembaca bisa memeriksa langsung ke sumbernya.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-emerald-deep">Mengapa aplikasi ini dibangun</h3>
                <p className="mt-1">
                  Banyak fatwa para ulama tersebar di berbagai situs berbahasa Arab dan sulit
                  dijangkau pembaca Indonesia. Aplikasi ini dibangun untuk menghadirkannya dalam
                  satu tempat yang rapi dan mudah dibaca di ponsel — sebagai sarana belajar dan
                  muhasabah, bukan pengganti bertanya kepada ulama setempat.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-emerald-deep">Sumber dan terjemahan</h3>
                <p className="mt-1">
                  Materi bersumber dari situs resmi Syaikh Abdul Aziz bin Baz (binbaz.org.sa) yang
                  mengizinkan penyalinan dengan menyebut sumber. Terjemahan Indonesia dibantu AI
                  dan diberi label sebagai terjemahan AI yang belum ditelaah manusia — pembaca
                  dianjurkan memeriksa teks Arab dan sumber aslinya untuk memastikan makna.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-emerald-deep">Dibuat oleh</h3>
                <p className="mt-1">Aplikasi ini dibuat dan dikelola oleh Catatan Santri.</p>
                <p className="mt-2 flex flex-col gap-1.5">
                  <a
                    href="https://www.catatansantri.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-emerald underline-offset-4 hover:underline"
                  >
                    catatansantri.com <IconExternal className="h-4 w-4" />
                  </a>
                  <a
                    href="https://www.youtube.com/@CatatanSantri-s7o"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-emerald underline-offset-4 hover:underline"
                  >
                    YouTube Catatan Santri <IconExternal className="h-4 w-4" />
                  </a>
                </p>
              </section>

              <p className="border-t border-line pt-4 text-xs text-muted">
                Koleksi saat ini: lebih dari 1.800 materi dan terus bertambah.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
