"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconDownload, IconShare, IconX } from "@/components/icons";

/* Fitur "Unduh Aplikasi" (PWA install) — perintah user 28 Nov 2026:
   setiap kali aplikasi dibuka lewat peramban, tombol unduh tampil dan
   TERUS tampil pada setiap kunjungan SAMPAI aplikasi terpasang di HP;
   setelah terpasang tombol tidak pernah muncul lagi.

   Aturan mainnya:
   - Mode standalone/terpasang (matchMedia display-mode, navigator.standalone
     iOS, event 'appinstalled', atau penanda localStorage) → tombol sembunyi
     total dan tidak pernah dirender.
   - Tombol × hanya menutup untuk SESI itu (sessionStorage); kunjungan
     berikutnya tombol wajib muncul lagi selama belum terpasang. Penolakan
     TIDAK PERNAH disimpan permanen.
   - Android/Chrome: event 'beforeinstallprompt' ditangkap dan disimpan;
     ketuk tombol memanggil prompt() bawaannya.
   - iOS Safari tidak punya beforeinstallprompt → ketuk tombol membuka
     lembar petunjuk "Bagikan → Tambah ke Layar Utama".
   Komponen ini juga mendaftarkan service worker minimal (/sw.js,
   passthrough tanpa cache) yang menjadi syarat kriteria pemasangan. */

const LS_INSTALLED = "maktabah:app-installed";
const SS_DISMISSED = "maktabah:install-dismissed";

// Event beforeinstallprompt belum ada di lib DOM standar TypeScript.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallApp() {
  const pathname = usePathname() || "/";
  const [visible, setVisible] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    // Daftarkan service worker (syarat instal PWA). Passthrough total —
    // kegagalan registrasi tidak boleh mengganggu aplikasi.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (isStandalone()) return;
    try {
      if (window.localStorage.getItem(LS_INSTALLED) === "1") return;
      if (window.sessionStorage.getItem(SS_DISMISSED) === "1") return;
    } catch {
      /* penyimpanan tidak tersedia — tombol tetap ditampilkan */
    }
    setIos(isIos());
    setVisible(true);

    const onBeforeInstall = (event: Event) => {
      // Cegah mini-infobar bawaan Chrome; prompt resmi dipanggil dari
      // tombol kita sendiri saat diketuk.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      try {
        window.localStorage.setItem(LS_INSTALLED, "1");
      } catch {
        /* abaikan */
      }
      setVisible(false);
      setSheetOpen(false);
      setDeferred(null);
    };
    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayMode = (event: MediaQueryListEvent) => {
      if (event.matches) onInstalled();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener?.("change", onDisplayMode);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener?.("change", onDisplayMode);
    };
  }, []);

  // Area admin tidak perlu tombol instal publik.
  if (pathname.startsWith("/admin")) return null;
  if (!visible) return null;

  const dismissForSession = () => {
    try {
      window.sessionStorage.setItem(SS_DISMISSED, "1");
    } catch {
      /* abaikan */
    }
    setVisible(false);
    setSheetOpen(false);
  };

  const handleInstallClick = async () => {
    if (!deferred) {
      // iOS Safari & peramban tanpa prompt bawaan → lembar petunjuk manual.
      setSheetOpen(true);
      return;
    }
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        try {
          window.localStorage.setItem(LS_INSTALLED, "1");
        } catch {
          /* abaikan */
        }
        setVisible(false);
        setDeferred(null);
      } else {
        // Ditolak lewat dialog bawaan: tutup untuk sesi ini saja, sesuai
        // aturan — kunjungan berikutnya tombol muncul lagi.
        dismissForSession();
      }
    } catch {
      setSheetOpen(true);
    }
  };

  return (
    <>
      {/* Pil mengambang di TENGAH BAWAH, tepat di ATAS navigasi bawah.
          Pilihan posisi (dari struktur layout yang ada): pojok kanan bawah
          dipakai tombol Tentang mengambang di beranda, kiri bawah menabrak
          pil navigasi bawah (lebarnya hampir sepenuh layar), jadi satu-
          satunya tempat aman adalah tengah bawah di atas nav. Di layar
          besar (nav bawah sembunyi) pil turun ke bottom-8. z-40: di bawah
          nav (z-50) dan jauh di bawah splash/onboarding (z-110/120). */}
      <div className="fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 lg:bottom-8">
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-deep py-2.5 pl-4 pr-5 text-sm font-bold text-white shadow-pill transition hover:bg-emerald"
        >
          <IconDownload className="h-5 w-5 text-gold" />
          Unduh Aplikasi
        </button>
        <button
          type="button"
          onClick={dismissForSession}
          aria-label="Tutup tombol unduh untuk sesi ini"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/85 text-emerald-deep shadow-soft backdrop-blur-md transition hover:bg-white"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>

      {/* Lembar petunjuk pemasangan manual (iOS Safari / tanpa prompt). */}
      {sheetOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-emerald-deep/60 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="judul-pasang-aplikasi"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-paper p-6 shadow-lift sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="judul-pasang-aplikasi" className="text-base font-extrabold text-emerald-deep">
                Pasang Maktabah Al-&rsquo;Ilmiyyah
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Tutup petunjuk pemasangan"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-emerald-deep transition hover:bg-surface"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
            {ios ? (
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink">
                <li>
                  Ketuk tombol <strong>Bagikan</strong>{" "}
                  <IconShare className="inline h-4 w-4 align-[-2px] text-emerald" />{" "}
                  di bilah Safari.
                </li>
                <li>
                  Pilih <strong>Tambah ke Layar Utama</strong>.
                </li>
                <li>
                  Ketuk <strong>Tambah</strong> — ikon Maktabah akan muncul di
                  layar utama HP.
                </li>
              </ol>
            ) : (
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink">
                <li>
                  Buka menu peramban (ikon titik tiga atau garis tiga).
                </li>
                <li>
                  Pilih <strong>Instal aplikasi</strong> atau{" "}
                  <strong>Tambah ke layar utama</strong>.
                </li>
                <li>
                  Ikuti langkahnya sampai selesai — ikon Maktabah akan muncul
                  di layar utama HP.
                </li>
              </ol>
            )}
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-emerald px-5 text-sm font-bold text-white shadow-soft transition hover:bg-emerald-deep"
            >
              Mengerti
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
