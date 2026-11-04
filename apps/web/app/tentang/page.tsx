import { IconChat, IconExternal, IconMail } from "@/components/icons";

/**
 * Kontak resmi untuk menu Saran, Ucapan, dan Dukungan (keputusan user
 * 4 Nov 2026). Email resmi Catatan Santri:
 */
const EMAIL_RESMI = "catatansantri155@gmail.com";
/**
 * NOMOR WHATSAPP ADMIN — diberikan user 4 Nov 2026 (+62 878 86589395)
 * untuk kontak dukungan di aplikasi. Format internasional tanpa tanda
 * "+"; tombol WhatsApp Admin menaut ke wa.me/<nomor> ini.
 */
const NOMOR_WHATSAPP_ADMIN = "6287886589395";
const TAUTAN_WHATSAPP_ADMIN = NOMOR_WHATSAPP_ADMIN ? `https://wa.me/${NOMOR_WHATSAPP_ADMIN}` : "#saran-dukungan";

/**
 * Halaman Tentang (koreksi PR #13, keputusan user 27 Okt 2026 09:19 WIB):
 * isi Tentang TIDAK lagi tampil sebagai popup/dialog — di ponsel user
 * panel dialog tampil rusak (tergulir ke tengah, harus scroll di kotak
 * sempit). Tentang kini halaman terpisah /tentang yang mengalir dengan
 * scroll halaman biasa. Pintu masuknya sejak port Lovable (4 Nov 2026)
 * adalah tombol utama mengambang di pojok kanan bawah (ReaderShell);
 * pojok kanan atas header kini hanya tombol Pengaturan. Isi halaman
 * adalah fakta aplikasi — jangan diubah tanpa keputusan user.
 */
export default function TentangPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Pita hero ala prototipe Lovable: gradasi teal, logo, nama aplikasi. */}
      <header className="bg-hero-grad relative overflow-hidden rounded-[2rem] px-6 py-8 text-center text-white shadow-lift">
        <div className="pattern-islamic pointer-events-none absolute inset-0 opacity-25" style={{ backgroundColor: "transparent" }} aria-hidden />
        <div className="relative flex flex-col items-center">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-soft">
            <img src="/images/logo-maktabah.png" alt="" aria-hidden width={64} height={64} decoding="async" className="h-full w-full object-contain p-1" />
          </span>
          <h1 className="font-read mt-3 text-xl font-semibold">Tentang Maktabah Al-&apos;Ilmiyyah</h1>
          <p dir="rtl" lang="ar" className="font-arabic mt-1 text-lg leading-tight text-gold">المكتبة العلمية</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/85">
            Sekilas tentang aplikasi ini, alasan dibangunnya, dan siapa yang mengelolanya.
          </p>
        </div>
      </header>

      <div className="card p-6 sm:p-7">
        <div className="space-y-6 text-[15px] leading-relaxed text-stone-600">
          <section>
            <h2 className="text-base font-bold text-emerald-deep">Tentang aplikasi</h2>
            <p className="mt-1.5">
              Maktabah Al-&apos;Ilmiyyah adalah perpustakaan fatwa digital berbahasa Indonesia.
              Setiap materi memuat teks Arab asli, terjemahan Indonesia, dan catatan sumbernya,
              supaya pembaca bisa memeriksa langsung ke sumbernya.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-emerald-deep">Mengapa aplikasi ini dibangun</h2>
            <p className="mt-1.5">
              Banyak fatwa para ulama tersebar di berbagai situs berbahasa Arab dan sulit
              dijangkau pembaca Indonesia. Aplikasi ini dibangun untuk menghadirkannya dalam
              satu tempat yang rapi dan mudah dibaca di ponsel — sebagai sarana belajar dan
              muhasabah, bukan pengganti bertanya kepada ulama setempat.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-emerald-deep">Sumber dan terjemahan</h2>
            <p className="mt-1.5">
              Materi bersumber dari situs resmi Syaikh Abdul Aziz bin Baz (binbaz.org.sa) yang
              mengizinkan penyalinan dengan menyebut sumber. Terjemahan Indonesia dibantu AI
              dan diberi label sebagai terjemahan AI yang belum ditelaah manusia — pembaca
              dianjurkan memeriksa teks Arab dan sumber aslinya untuk memastikan makna.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-emerald-deep">Dibuat oleh</h2>
            <p className="mt-1.5">Aplikasi ini dibuat dan dikelola oleh Catatan Santri.</p>
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
                href="https://t.me/Catatansantriii"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-emerald underline-offset-4 hover:underline"
              >
                Kanal Telegram Catatan Santri <IconExternal className="h-4 w-4" />
              </a>
            </p>
          </section>

          <section id="saran-dukungan" className="scroll-mt-24">
            <h2 className="text-base font-bold text-emerald-deep">Saran, Ucapan, dan Dukungan</h2>
            <p className="mt-1.5">
              Saran perbaikan, ucapan, maupun dukungan untuk pengembangan aplikasi ini sangat
              kami hargai. Sampaikan melalui email resmi Catatan Santri atau WhatsApp Admin.
            </p>
            <p className="mt-3 flex flex-col gap-2 sm:flex-row">
              <a
                href={`mailto:${EMAIL_RESMI}?subject=${encodeURIComponent("Saran untuk Maktabah Al-'Ilmiyyah")}`}
                className="btn-primary flex-1"
              >
                <IconMail className="h-4 w-4" /> Kirim Email
              </a>
              <a
                href={TAUTAN_WHATSAPP_ADMIN}
                {...(NOMOR_WHATSAPP_ADMIN ? { target: "_blank", rel: "noreferrer" } : {})}
                className="btn-outline flex-1"
              >
                <IconChat className="h-4 w-4" /> WhatsApp Admin
              </a>
            </p>
            <p className="mt-2 text-xs text-muted">Email resmi: {EMAIL_RESMI}</p>
          </section>

          <p className="border-t border-line pt-4 text-xs text-muted">
            Koleksi saat ini: lebih dari 1.800 materi dan terus bertambah.
          </p>
        </div>
      </div>
    </div>
  );
}
