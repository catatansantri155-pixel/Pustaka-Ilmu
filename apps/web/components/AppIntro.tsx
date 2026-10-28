"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import TopicCover from "@/components/TopicCover";
import { IconArrowRight, IconX } from "@/components/icons";
import type { TopicImage } from "@/lib/topicImages";

/**
 * Lapisan pembuka aplikasi (PR splash+onboarding, permintaan user 28 Okt
 * 2026 — referensi aplikasi mobile "Laundrify" dari user): dua lapisan yang
 * SENGAJA dibedakan pemicunya, persis seperti kata user:
 *
 * 1) SPLASH — muncul SETIAP kali aplikasi dibuka (setiap pemuatan awal
 *    dokumen, BUKAN setiap perpindahan halaman internal: komponen ini
 *    dipasang sekali di layout akar dan state-nya hidup selama sesi dokumen).
 *    Layar penuh gradasi navy merek dengan logo + nama + tagline, tampil
 *    ±1,15 detik lalu memudar ±0,45 detik dan DIUNMOUNT TOTAL — tidak ada
 *    sisa lapisan yang bisa menghalangi klik (kelas bug lama aplikasi ini).
 *    prefers-reduced-motion: tanpa animasi, durasi dipersingkat (±0,4 detik).
 *    Pengaman ekstra: kelas .splash-failsafe di globals.css memudarkan
 *    lapisan ini lewat animasi CSS murni pada 3 detik, jadi andaikata JS
 *    gagal jalan pun pengguna tidak pernah terjebak di layar splash.
 *
 * 2) ONBOARDING — muncul SEKALI saja pada kunjungan pertama, diingat di
 *    perangkat lewat localStorage `pustaka:onboarded:v1`. Tampil SETELAH
 *    splash dan HANYA bila pengguna MENDARAT di beranda `/` pada pemuatan
 *    awal. Pilihan perilaku untuk tautan dalam (mis. langsung ke /materi/…):
 *    onboarding DILEWATI sesi itu dan TIDAK ditandai selesai — pengguna
 *    tidak dijebak lapisan perkenalan saat ia datang untuk membaca satu
 *    materi; onboarding baru tampil pada kunjungan berikutnya yang memang
 *    mendarat di beranda. Ditandai selesai HANYA saat benar-benar tampil
 *    lalu ditutup lewat "Lewati", "Mulai Membaca", tombol ×, atau Esc.
 *    Di rute /admin kedua lapisan tidak tampil sama sekali (konsol admin
 *    adalah permukaan terpisah).
 *
 * Gambar slide onboarding dari pool foto yang sudah teraudit aturan user
 * (tanpa makhluk bernyawa): kubah emas interior masjid, deretan lengkung
 * Masjid Cordoba, permukaan air beriak — TIDAK ada yang sama dengan empat
 * foto slideshow hero beranda (rehal, masjid senja, air jernih, bukit
 * pasir) maupun duplikat antar-slide. Kredit ketiga fotografernya sudah
 * termasuk dalam daftar kredit foto aplikasi (PHOTO_CREDITS memuat
 * seluruh pool).
 */

const ONBOARD_KEY = "pustaka:onboarded:v1";

const IMG_DOME: TopicImage = {
  src: "/images/topics/pool/haid-3.jpg",
  alt: "Foto kubah emas interior masjid dilihat dari bawah",
  ar: "الفتاوى",
  creditName: "Mohamed Abdelnaby",
  creditUrl: "https://www.pexels.com/photo/stunning-interior-dome-of-historic-mosque-39654235/",
  creditSource: "Pexels",
  position: "50% 50%",
};
const IMG_ARCHES: TopicImage = {
  src: "/images/topics/pool/haid-4.jpg",
  alt: "Foto deretan lengkung Masjid Cordoba yang kosong",
  ar: "الأبواب",
  creditName: "Mike van Schoonderwalt",
  creditUrl: "https://www.pexels.com/photo/colonnade-with-arches-5504013/",
  creditSource: "Pexels",
  position: "50% 50%",
};
const IMG_WATER: TopicImage = {
  src: "/images/topics/pool/air-5.jpg",
  alt: "Foto permukaan air beriak dari dekat",
  ar: "القراءة",
  creditName: "Spencer Gurley Films",
  creditUrl: "https://www.pexels.com/photo/macro-photo-of-water-flow-1472692/",
  creditSource: "Pexels",
  position: "50% 50%",
};

const SLIDES: Array<{ title: string; text: string; image: TopicImage }> = [
  {
    title: "Selamat Datang di Maktabah Al-'Ilmiyyah",
    text: "Perpustakaan fatwa digital di genggaman Anda. Setiap materi memuat teks Arab asli, terjemahan Bahasa Indonesia, dan catatan sumbernya — agar Anda dapat membaca langsung rujukan para ulama.",
    image: IMG_DOME,
  },
  {
    title: "Jelajahi per Bab dan Persoalan",
    text: "Telusuri fatwa berdasarkan bab — Thaharah, Shalat, Jenazah, dan bab-bab lainnya — atau lewat Daftar Persoalan yang menghimpun jawaban atas pertanyaan-pertanyaan fikih yang sering diajukan.",
    image: IMG_ARCHES,
  },
  {
    title: "Simpan dan Lanjutkan Membaca",
    text: "Ketuk ikon penanda untuk menyimpan materi favorit di perangkat Anda, dan temukan kembali bacaan terakhir lewat bagian \u201CLanjutkan membaca\u201D di beranda.",
    image: IMG_WATER,
  },
];

function lockScroll(lock: boolean) {
  if (typeof document === "undefined") return;
  const v = lock ? "hidden" : "";
  document.documentElement.style.overflow = v;
  document.body.style.overflow = v;
}

function readOnboarded(): boolean {
  try {
    return window.localStorage.getItem(ONBOARD_KEY) === "1";
  } catch {
    return true; // penyimpanan tak tersedia (mode privat dsb.) → jangan jebak pengguna
  }
}

function markOnboarded() {
  try {
    window.localStorage.setItem(ONBOARD_KEY, "1");
  } catch {
    /* abaikan — lapisan tetap tertutup untuk sesi ini */
  }
}

export default function AppIntro() {
  const pathname = usePathname();
  const initialPathRef = useRef<string | null>(pathname);
  const startedRef = useRef(false);
  const [splash, setSplash] = useState<"show" | "fade" | "gone">("show");
  const [onboarding, setOnboarding] = useState(false);
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  /* Mesin status pembuka: berjalan SEKALI pada pemuatan awal dokumen. */
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const initialPath = initialPathRef.current || "/";
    if (initialPath.startsWith("/admin")) {
      setSplash("gone");
      return;
    }
    const eligible = initialPath === "/" && !readOnboarded();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    lockScroll(true);
    const showMs = reduced ? 400 : 1150;
    const fadeMs = reduced ? 60 : 450;
    let t2: ReturnType<typeof setTimeout> | undefined;
    const t1 = setTimeout(() => {
      if (eligible) setOnboarding(true); // dirender di balik splash, terungkap saat memudar
      setSplash("fade");
      t2 = setTimeout(() => {
        setSplash("gone");
        if (!eligible) lockScroll(false);
      }, fadeMs);
    }, showMs);
    return () => {
      clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishOnboarding = () => {
    markOnboarded();
    setOnboarding(false);
    lockScroll(false);
  };

  /* Esc menutup onboarding (diperlakukan seperti "Lewati"). */
  useEffect(() => {
    if (!onboarding) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finishOnboarding();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboarding]);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduced ? "auto" : "smooth" });
  };

  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  };

  return (
    <>
      {splash !== "gone" && (
        <div
          aria-hidden="true"
          data-app-splash=""
          className={`splash-failsafe fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden bg-emerald-deep px-6 text-center transition-opacity duration-500 ${splash === "fade" ? "pointer-events-none opacity-0" : "opacity-100"}`}
          style={{ backgroundImage: "linear-gradient(180deg, #14386E 0%, #0A1F44 72%)" }}
        >
          <div className="pattern-islamic pointer-events-none absolute inset-0 opacity-30" />
          <div
            className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(201,162,39,0.22), transparent)" }}
          />
          <div className="relative flex flex-col items-center">
            <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/50 bg-white shadow-lift">
              <img src="/images/logo-maktabah.png" alt="" width={96} height={96} decoding="async" className="h-full w-full object-contain p-1.5" />
            </span>
            <p className="mt-5 text-2xl font-extrabold tracking-tight text-white">Maktabah Al-'Ilmiyyah</p>
            <p dir="rtl" lang="ar" className="font-arabic mt-1 text-lg leading-snug text-gold">المكتبة العلمية</p>
            <span className="mt-3 h-px w-16 bg-gold/70" />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
              Perpustakaan Fatwa &amp; Khazanah
            </p>
            <span className="mt-8 flex items-center gap-1.5" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full bg-gold/90 motion-safe:animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-gold/60 motion-safe:animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-gold/35 motion-safe:animate-pulse" />
            </span>
          </div>
        </div>
      )}

      {onboarding && (
        <div
          className="fixed inset-0 z-[110] flex items-stretch justify-center bg-emerald-deep/60 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Perkenalan aplikasi Maktabah Al-'Ilmiyyah"
          data-app-onboarding=""
        >
          <div className="relative flex w-full max-w-md flex-col overflow-hidden bg-ivory shadow-lift sm:rounded-[2rem]">
            <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
              <button
                type="button"
                onClick={finishOnboarding}
                className="inline-flex min-h-11 items-center rounded-full bg-white/85 px-4 text-sm font-semibold text-emerald-deep shadow-soft backdrop-blur-md transition hover:bg-white"
              >
                Lewati
              </button>
              <button
                type="button"
                onClick={finishOnboarding}
                aria-label="Tutup perkenalan"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/85 text-emerald-deep shadow-soft backdrop-blur-md transition hover:bg-white"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <div
              ref={trackRef}
              onScroll={onTrackScroll}
              className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {SLIDES.map((s) => (
                <section key={s.title} className="flex min-w-full flex-col snap-center">
                  <div className="h-60 w-full shrink-0 overflow-hidden sm:h-72">
                    <TopicCover image={s.image} eager className="h-full w-full" />
                  </div>
                  <div className="px-6 pb-2 pt-5">
                    <h2 className="text-xl font-extrabold leading-snug tracking-tight text-emerald-deep">{s.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 px-6 pb-7 pt-3">
              <div className="flex items-center" role="tablist" aria-label="Pilih slide perkenalan">
                {SLIDES.map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    aria-label={`Slide ${i + 1}: ${s.title}`}
                    onClick={() => goTo(i)}
                    className="flex min-h-11 min-w-11 items-center justify-center"
                  >
                    <span className={`h-2 rounded-full transition-all ${i === active ? "w-7 bg-gold" : "w-2 bg-emerald-deep/25"}`} />
                  </button>
                ))}
              </div>
              {active < SLIDES.length - 1 ? (
                <button type="button" onClick={() => goTo(active + 1)} className="btn-primary">
                  Lanjut
                  <IconArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" onClick={finishOnboarding} className="btn-gold">
                  Mulai Membaca
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
