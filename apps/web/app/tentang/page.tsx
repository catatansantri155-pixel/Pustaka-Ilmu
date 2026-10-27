import { IconExternal, IconInfo } from "@/components/icons";

/**
 * Halaman Tentang (koreksi PR #13, keputusan user 27 Okt 2026 09:19 WIB):
 * isi Tentang TIDAK lagi tampil sebagai popup/dialog — di ponsel user
 * panel dialog tampil rusak (tergulir ke tengah, harus scroll di kotak
 * sempit). Tentang kini halaman terpisah /tentang yang mengalir dengan
 * scroll halaman biasa; tombol ikon "i" di pojok kanan atas header adalah
 * tautan ke halaman ini. Isi halaman adalah fakta aplikasi — jangan diubah
 * tanpa keputusan user.
 */
export default function TentangPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2.5 text-xl font-extrabold text-emerald-deep">
          <IconInfo className="h-6 w-6 text-emerald" /> Tentang Maktabah Al-&apos;Ilmiyyah
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Sekilas tentang aplikasi ini, alasan dibangunnya, dan siapa yang mengelolanya.
        </p>
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

          <p className="border-t border-line pt-4 text-xs text-muted">
            Koleksi saat ini: lebih dari 1.800 materi dan terus bertambah.
          </p>
        </div>
      </div>
    </div>
  );
}
