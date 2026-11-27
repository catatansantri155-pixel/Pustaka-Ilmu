import type { MaterialSummary, Topic } from "@pustaka/shared-types";
import poolData from "../public/images/topics/pool/pool.json";

/**
 * Peta topik → foto sampul (PR #3).
 *
 * ATURAN USER (25 Okt 2026): foto TIDAK BOLEH memuat makhluk bernyawa
 * (manusia — termasuk tangan/anggota tubuh — maupun hewan) dan TIDAK BOLEH
 * ada foto duplikat antar-topik. Semua foto di bawah adalah benda, air,
 * arsitektur, atau lanskap; diverifikasi visual satu per satu oleh asisten
 * sebelum tayang (berkas lokal di public/images/topics/, bukan hotlink).
 * - rehal.webp (hero), tayamum.webp, mandi.jpg dipertahankan dari set awal
 *   karena lolos aturan (mushaf di rehal; bukit pasir; kepala pancuran).
 * - 8 foto lain diganti total pada 25 Okt 2026 dari Pexels (lihat kredit).
 * Atribusi lengkap dirender di footer aplikasi (ReaderShell).
 *
 * PR #5: tiap topik kini punya POOL 8 foto — indeks 0 = sampul di atas,
 * indeks 1..7 = foto tambahan dari public/images/topics/pool/pool.json
 * (berkas <slug>-2.jpg s.d. <slug>-8.jpg, semua Pexels, teraudit dengan
 * aturan yang sama: tanpa makhluk bernyawa, tanpa duplikat). Permukaan
 * per-materi memilih foto dari pool secara deterministik (hash id materi),
 * permukaan per-topik tetap memakai sampul indeks 0.
 */
export interface TopicImage {
  src: string;
  alt: string;
  /** Kata Arab untuk sampul cadangan (fallback) dan kartu topik. */
  ar: string;
  creditName: string;
  creditUrl: string;
  creditSource: "Pexels" | "Unsplash" | "Gemini";
  /** object-position CSS agar potongan foto tetap bagus di bingkai lanskap. */
  position?: string;
}

const P = "https://www.pexels.com/photo/";
const U = "https://unsplash.com";

const GEMINI_CREDIT = {
  creditName: "Ilustrasi dihasilkan dengan Gemini (akun pemilik)",
  creditUrl: "https://gemini.google.com",
  creditSource: "Gemini" as const,
};

export const TOPIC_IMAGES: Record<string, TopicImage> = {
  "THA-01": {
    src: "/images/topik/tha-01.webp",
    alt: "Ilustrasi air dan Hukum Bersuci",
    ar: "الماء",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "THA-02": {
    src: "/images/topik/tha-02.webp",
    alt: "Ilustrasi bejana dan Peralatan",
    ar: "الآنية",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "THA-03": {
    src: "/images/topik/tha-03.webp",
    alt: "Ilustrasi istinja dan Adab Buang Hajat",
    ar: "الاستنجاء",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "THA-04": {
    src: "/images/topik/tha-04.webp",
    alt: "Ilustrasi wudu",
    ar: "الوضوء",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "THA-05": {
    src: "/images/topik/tha-05.webp",
    alt: "Ilustrasi pembatal Wudu",
    ar: "نواقض الوضوء",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "THA-06": {
    src: "/images/topik/tha-06.webp",
    alt: "Ilustrasi mengusap Khuf, Kaus Kaki, dan Perban",
    ar: "المسح على الخفين",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "THA-07": {
    src: "/images/topik/tha-07.webp",
    alt: "Ilustrasi mandi Wajib",
    ar: "الغسل",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "THA-08": {
    src: "/images/topik/tha-08.webp",
    alt: "Ilustrasi tayamum",
    ar: "التيمم",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "THA-09": {
    src: "/images/topik/tha-09.webp",
    alt: "Ilustrasi najis dan Cara Menyucikannya",
    ar: "النجاسة وإزالتها",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "THA-10": {
    src: "/images/topik/tha-10.webp",
    alt: "Ilustrasi haid, Nifas, dan Istihadhah",
    ar: "الحيض والنفاس",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "BID-01": {
    src: "/images/bab/bid.webp",
    alt: "Ilustrasi bid'ah & Perkara Baru",
    ar: "البدع والمحدثات",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "BIR-01": {
    src: "/images/bab/bir.webp",
    alt: "Ilustrasi birrul Walidain",
    ar: "بر الوالدين",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "DKW-01": {
    src: "/images/bab/dkw.webp",
    alt: "Ilustrasi dakwah & Para Dai",
    ar: "الدعوة والدعاة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "DOA-01": {
    src: "/images/bab/doa.webp",
    alt: "Ilustrasi doa & Zikir",
    ar: "الأدعية والأذكار",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "FRQ-01": {
    src: "/images/bab/frq.webp",
    alt: "Ilustrasi firqah & Madzhab",
    ar: "الفرق والمذاهب",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HJR-01": {
    src: "/images/bab/hjr.webp",
    alt: "Ilustrasi hijrah & Belajar ke Luar Negeri",
    ar: "الهجرة والابتعاث",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HYW-01": {
    src: "/images/bab/hyw.webp",
    alt: "Ilustrasi hukum-Hukum Hewan",
    ar: "أحكام الحيوان",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "ILM-01": {
    src: "/images/bab/ilm.webp",
    alt: "Ilustrasi ulama & Penuntut Ilmu",
    ar: "العالم والمتعلم",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "JHD-01": {
    src: "/images/bab/jhd.webp",
    alt: "Ilustrasi jihad & Siyar",
    ar: "الجهاد والسير",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "JIN-01": {
    src: "/images/bab/jin.webp",
    alt: "Ilustrasi jinayat & Hudud",
    ar: "الجنايات والحدود",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "LGH-01": {
    src: "/images/bab/lgh.webp",
    alt: "Ilustrasi bahasa Arab",
    ar: "اللغة العربية",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "LIB-01": {
    src: "/images/bab/lib.webp",
    alt: "Ilustrasi pakaian & Perhiasan",
    ar: "اللباس والزينة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MAR-01": {
    src: "/images/bab/mar.webp",
    alt: "Ilustrasi isu-Isu Perempuan",
    ar: "قضايا المرأة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MNM-01": {
    src: "/images/bab/mnm.webp",
    alt: "Ilustrasi ru'ya & Mimpi",
    ar: "الرؤى والمنامات",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MSR-01": {
    src: "/images/bab/msr.webp",
    alt: "Ilustrasi isu-Isu Kontemporer",
    ar: "قضايا معاصرة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MTF-01": {
    src: "/images/bab/mtf.webp",
    alt: "Ilustrasi masalah Fikih Mutafarriqah",
    ar: "مسائل فقهية متفرقة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MTN-01": {
    src: "/images/bab/mtn.webp",
    alt: "Ilustrasi fatwa Mutanawwiah",
    ar: "فتاوى متنوعة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NSH-01": {
    src: "/images/bab/nsh.webp",
    alt: "Ilustrasi nasihat & Arahan",
    ar: "نصائح وتوجيهات",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NWZ-01": {
    src: "/images/bab/nwz.webp",
    alt: "Ilustrasi nawazil Kontemporer",
    ar: "نوازل معاصرة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "PGW-01": {
    src: "/images/bab/pgw.webp",
    alt: "Ilustrasi hukum-Hukum Pegawai",
    ar: "أحكام الموظفين",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "QDH-01": {
    src: "/images/bab/qdh.webp",
    alt: "Ilustrasi qadha & Syahadat",
    ar: "القضاء والشهادات",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "QUR-01": {
    src: "/images/bab/qur.webp",
    alt: "Ilustrasi al-Qur'an & Ulumul Qur'an",
    ar: "القرآن وعلومه",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "RAQ-01": {
    src: "/images/bab/raq.webp",
    alt: "Ilustrasi raqaiq & Pelembut Hati",
    ar: "الرقائق",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "RDD-01": {
    src: "/images/bab/rdd.webp",
    alt: "Ilustrasi bantahan & Tanggapan",
    ar: "ردود وتعقيبات",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SIR-01": {
    src: "/images/bab/sir.webp",
    alt: "Ilustrasi tarikh & Sirah",
    ar: "التاريخ والسيرة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SUM-01": {
    src: "/images/bab/sum.webp",
    alt: "Ilustrasi sumpah & Nazar",
    ar: "الأيمان والنذور",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SUR-01": {
    src: "/images/bab/sur.webp",
    alt: "Ilustrasi gambar & Fotografi",
    ar: "الصور والتصوير",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SYB-01": {
    src: "/images/bab/syb.webp",
    alt: "Ilustrasi isu-Isu Pemuda",
    ar: "قضايا الشباب",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SYG-01": {
    src: "/images/bab/syg.webp",
    alt: "Ilustrasi syiir & Lagu",
    ar: "الشعر والأغاني",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SYS-01": {
    src: "/images/bab/sys.webp",
    alt: "Ilustrasi siyasah Syar'iyyah",
    ar: "السياسة الشرعية",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "TAF-01": {
    src: "/images/bab/taf.webp",
    alt: "Ilustrasi tafsir",
    ar: "التفسير",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "THA-11": {
    src: "/images/topik/tha-11.webp",
    alt: "Ilustrasi sunnah Fitrah",
    ar: "سنن الفطرة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "THA-13": {
    src: "/images/topik/tha-13.webp",
    alt: "Ilustrasi menyentuh Mushaf",
    ar: "مس المصحف",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "TIB-01": {
    src: "/images/bab/tib.webp",
    alt: "Ilustrasi pengobatan & Ruqyah",
    ar: "الطب والتداوي",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "TRB-01": {
    src: "/images/bab/trb.webp",
    alt: "Ilustrasi pendidikan Anak",
    ar: "تربية الأولاد",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "USF-01": {
    src: "/images/bab/usf.webp",
    alt: "Ilustrasi ushul Fikih",
    ar: "أصول الفقه",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "WSW-01": {
    src: "/images/bab/wsw.webp",
    alt: "Ilustrasi waswas & Jenis-Jenisnya",
    ar: "الوسواس بأنواعه",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
};

/** Sampul umum: Al-Qur'an di atas rehal (juga hero Beranda). */
export const DEFAULT_IMAGE: TopicImage = {
  src: "/images/topics/rehal.webp",
  alt: "Foto Al-Qur'an di atas rehal di interior masjid",
  ar: "الطهارة",
  creditName: "Defrino Maasy",
  creditUrl: `${P}qur-an-on-wooden-stand-in-a-mosque-interior-28823663/`,
  creditSource: "Pexels",
  position: "50% 45%",
};

export const HOME_HERO = DEFAULT_IMAGE;

/**
 * Sampul khusus per BAB untuk kartu bab di Beranda (perintah user
 * 27 Nov 2026: setiap bab gambar berbeda sesuai tema, dibuat dengan
 * Gemini Pro milik user). Aturan sama seperti foto topik: TANPA makhluk
 * bernyawa, TANPA teks di dalam gambar, TANPA duplikat antar-bab; tiap
 * gambar diverifikasi visual oleh asisten sebelum tayang. Bab yang belum
 * punya gambar khusus memakai sampul topik pertamanya seperti sebelumnya
 * (lihat imageForBab). Berkas: public/images/bab/<awalan>.webp.
 */
export const BAB_IMAGES: Record<string, TopicImage> = {
  THA: { src: "/images/bab/tha.webp", alt: "Kendi dan baskom keramik putih untuk bersuci", ar: "الطهارة", ...GEMINI_CREDIT },
  SHL: { src: "/images/bab/shl.webp", alt: "Sajadah hijau menghadap mihrab masjid yang kosong", ar: "الصلاة", ...GEMINI_CREDIT },
  JNZ: { src: "/images/bab/jnz.webp", alt: "Taman pemakaman hijau yang tenang di pagi hari", ar: "الجنائز", ...GEMINI_CREDIT },
  ZKT: { src: "/images/bab/zkt.webp", alt: "Peti koin emas, timbangan kuningan, dan karung gandum", ar: "الزكاة", ...GEMINI_CREDIT },
  PUA: { src: "/images/bab/pua.webp", alt: "Meja berbuka dengan kurma, air, dan lentera menyala", ar: "الصيام", ...GEMINI_CREDIT },
  HAJ: { src: "/images/bab/haj.webp", alt: "Ka'bah di pagi hari dengan halaman Masjidil Haram yang kosong", ar: "الحج والعمرة", ...GEMINI_CREDIT },
  MUA: { src: "/images/bab/mua.webp", alt: "Timbangan pasar kuningan dan buku besar pedagang", ar: "المعاملات", ...GEMINI_CREDIT },
  NIK: { src: "/images/bab/nik.webp", alt: "Dua cincin emas di atas buku berornamen", ar: "النكاح", ...GEMINI_CREDIT },
  TAL: { src: "/images/bab/tal.webp", alt: "Ruang keluarga hangat dengan sofa dan mainan balok kayu", ar: "الطلاق والأسرة", ...GEMINI_CREDIT },
  MAK: { src: "/images/bab/mak.webp", alt: "Madu, minyak zaitun, kurma, dan roti di meja kayu", ar: "الأطعمة والذبائح", ...GEMINI_CREDIT },
  SUM: { src: "/images/bab/sum.webp", alt: "Mushaf berornamen di atas rehal dengan lilin menyala", ar: "الأيمان والنذور", ...GEMINI_CREDIT },
  TIB: { src: "/images/bab/tib.webp", alt: "Botol minyak, habbatussauda, madu, dan lesung batu", ar: "الطب والتداوي", ...GEMINI_CREDIT },
  LIB: { src: "/images/bab/lib.webp", alt: "Lipatan kain, perhiasan emas, dan botol parfum", ar: "اللباس والزينة", ...GEMINI_CREDIT },
  SUR: { src: "/images/bab/sur.webp", alt: "Kamera film klasik dan bingkai foto lanskap", ar: "الصور والتصوير", ...GEMINI_CREDIT },
  JIN: { src: "/images/bab/jin.webp", alt: "Timbangan keadilan kuningan dan pedang bersarung di aula batu", ar: "الجنايات والحدود", ...GEMINI_CREDIT },
  JHD: { src: "/images/bab/jhd.webp", alt: "Benteng gurun kuno dengan peta gulung dan kompas kuningan", ar: "الجهاد والسير", ...GEMINI_CREDIT },
  QDH: { src: "/images/bab/qdh.webp", alt: "Ruang sidang klasik yang kosong dengan bangku hakim", ar: "القضاء والشهادات", ...GEMINI_CREDIT },
  SYS: { src: "/images/bab/sys.webp", alt: "Aula istana dengan takhta kosong dan panji polos", ar: "السياسة الشرعية", ...GEMINI_CREDIT },
  MTF: { src: "/images/bab/mtf.webp", alt: "Tumpukan kitab aneka ukuran dengan kacamata baca dan lampu", ar: "مسائل فقهية متفرقة", ...GEMINI_CREDIT },
  MTN: { src: "/images/bab/mtn.webp", alt: "Meja ulama dengan globe kayu, jam antik, dan kunci tua", ar: "فتاوى متنوعة", ...GEMINI_CREDIT },
  AKD: { src: "/images/bab/akd.webp", alt: "Kubah dan menara masjid saat fajar", ar: "العقيدة", ...GEMINI_CREDIT },
  QUR: { src: "/images/bab/qur.webp", alt: "Tiga jilid mushaf berornamen bertumpuk dengan pita sutra", ar: "القرآن وعلومه", ...GEMINI_CREDIT },
  TAF: { src: "/images/bab/taf.webp", alt: "Deretan jilid tafsir kulit besar di rak kayu gelap", ar: "التفسير", ...GEMINI_CREDIT },
  HAD: { src: "/images/bab/had.webp", alt: "Gulungan perkamen kosong, pena buluh, dan botol tinta", ar: "الحديث وعلومه", ...GEMINI_CREDIT },
  FRQ: { src: "/images/bab/frq.webp", alt: "Koridor dengan banyak pintu melengkung berbeda gaya", ar: "الفرق والمذاهب", ...GEMINI_CREDIT },
  BID: { src: "/images/bab/bid.webp", alt: "Gerbang kayu tua di samping gerbang logam baru yang mengilap", ar: "البدع والمحدثات", ...GEMINI_CREDIT },
  USF: { src: "/images/bab/usf.webp", alt: "Pohon besar berakar dalam dan bercabang lebar saat senja", ar: "أصول الفقه", ...GEMINI_CREDIT },
  ILM: { src: "/images/bab/ilm.webp", alt: "Perpustakaan tua megah dengan rak tinggi dan tangga geser", ar: "العلم والعلماء", ...GEMINI_CREDIT },
  DKW: { src: "/images/bab/dkw.webp", alt: "Mimbar kayu ukir dan mikrofon di masjid yang kosong", ar: "الدعوة والدعاة", ...GEMINI_CREDIT },
  ADB: { src: "/images/bab/adb.webp", alt: "Teko perak dan gelas teh untuk menjamu tamu", ar: "الأدب والأخلاق", ...GEMINI_CREDIT },
  FAD: { src: "/images/bab/fad.webp", alt: "Halaman masjid saat matahari terbit dengan sajadah dan tasbih", ar: "فضائل الأعمال", ...GEMINI_CREDIT },
  RAQ: { src: "/images/bab/raq.webp", alt: "Jendela berhujan dengan lilin dan buku harian tertutup", ar: "الرقائق", ...GEMINI_CREDIT },
  DOA: { src: "/images/bab/doa.webp", alt: "Tasbih amber dari dekat di atas sajadah hijau", ar: "الأدعية والأذكار", ...GEMINI_CREDIT },
  SIR: { src: "/images/bab/sir.webp", alt: "Reruntuhan batu dan kota berdinding di jalur gurun kuno", ar: "التاريخ والسيرة", ...GEMINI_CREDIT },
  MSR: { src: "/images/bab/msr.webp", alt: "Masjid kontemporer di tengah kota modern saat senja", ar: "قضايا معاصرة", ...GEMINI_CREDIT },
  MAR: { src: "/images/bab/mar.webp", alt: "Kain lembut, keranjang jahit, dan botol parfum", ar: "قضايا المرأة", ...GEMINI_CREDIT },
  LGH: { src: "/images/bab/lgh.webp", alt: "Jilid kamus tertutup dengan pena buluh dan botol tinta", ar: "اللغة العربية", ...GEMINI_CREDIT },
  SYG: { src: "/images/bab/syg.webp", alt: "Alat musik oud di atas bantal bersulam dan lentera", ar: "الشعر والأناشيد", ...GEMINI_CREDIT },
  NSH: { src: "/images/bab/nsh.webp", alt: "Papan penunjuk kayu kosong di persimpangan jalan gurun", ar: "النصائح والتوجيهات", ...GEMINI_CREDIT },
  TRB: { src: "/images/bab/trb.webp", alt: "Meja belajar anak dengan buku tertutup dan tas ransel", ar: "تربية الأبناء", ...GEMINI_CREDIT },
  HYW: { src: "/images/bab/hyw.webp", alt: "Sangkar burung kosong dan jejak kaki di pasir", ar: "أحكام الحيوان", ...GEMINI_CREDIT },
  PGW: { src: "/images/bab/pgw.webp", alt: "Tas kerja kulit, jam dinding, dan tumpukan dokumen kosong", ar: "أحكام الموظفين", ...GEMINI_CREDIT },
  BIR: { src: "/images/bab/bir.webp", alt: "Dua kursi goyang kosong dan tongkat kayu di beranda rumah", ar: "بر الوالدين", ...GEMINI_CREDIT },
  SYB: { src: "/images/bab/syb.webp", alt: "Sepatu kets, ransel kanvas, dan headphone di bangku kayu", ar: "قضايا الشباب", ...GEMINI_CREDIT },
  NWZ: { src: "/images/bab/nwz.webp", alt: "Ponsel layar gelap, kartu kosong, dan blister obat di meja modern", ar: "النوازل المعاصرة", ...GEMINI_CREDIT },
  MNM: { src: "/images/bab/mnm.webp", alt: "Bulan sabit dan bintang di atas atap kota yang tidur", ar: "الرؤى والمنامات", ...GEMINI_CREDIT },
  RDD: { src: "/images/bab/rdd.webp", alt: "Dua kitab kuno berhadapan dengan bidak catur di antaranya", ar: "الردود والمناقشات", ...GEMINI_CREDIT },
  HJR: { src: "/images/bab/hjr.webp", alt: "Koper terkemas dan paspor polos di samping jendela pesawat", ar: "الهجرة وطلب العلم في الخارج", ...GEMINI_CREDIT },
  WSW: { src: "/images/bab/wsw.webp", alt: "Gulungan benang kusut dan lilin di meja kayu gelap", ar: "الوسوسة", ...GEMINI_CREDIT },
};

/** Sampul kartu bab: gambar khusus bab bila ada, selain itu sampul topik pertama bab. */
export function imageForBab(prefix?: string | null, fallbackTopic?: Topic | null): TopicImage {
  if (prefix && BAB_IMAGES[prefix]) return BAB_IMAGES[prefix];
  return imageForTopic(fallbackTopic);
}

/* ------------------------------------------------------------------ */
/* Pool foto per topik (PR #5)                                          */
/* ------------------------------------------------------------------ */

interface PoolEntry {
  file: string;
  topic: string;
  subject: string;
  source: string;
  photographer: string;
  photoUrl: string;
}

const POOL_ENTRIES = poolData as PoolEntry[];

/** Nomor urut dari nama berkas pool, mis. "air-7.jpg" → 7. */
function poolIndexOf(file: string): number {
  const m = /-(\d+)\.[a-z]+$/i.exec(file);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Pool foto per topik: indeks 0 = sampul lama (TOPIC_IMAGES), indeks 1..7 =
 * foto pool n=2..8 dari pool.json (urut nomor berkas menaik).
 */
export const TOPIC_POOLS: Record<string, TopicImage[]> = (() => {
  const pools: Record<string, TopicImage[]> = {};
  for (const [code, cover] of Object.entries(TOPIC_IMAGES)) {
    const extras = POOL_ENTRIES.filter((e) => e.topic === code)
      .sort((a, b) => poolIndexOf(a.file) - poolIndexOf(b.file))
      .map<TopicImage>((e) => ({
        src: `/images/topics/pool/${e.file}`,
        alt: `Foto ${e.subject.charAt(0).toLowerCase()}${e.subject.slice(1)}`,
        ar: cover.ar,
        creditName: e.photographer,
        creditUrl: e.photoUrl,
        creditSource: e.source === "Unsplash" ? "Unsplash" : "Pexels",
      }));
    pools[code] = [cover, ...extras];
  }
  return pools;
})();

/** Hash FNV-1a 32-bit atas string — deterministik lintas kunjungan & platform. */
export function hashMaterialId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Foto pool untuk satu materi: indeks = hash(id materi) mod jumlah foto pool.
 * Tanpa id → sampul indeks 0. Materi yang sama selalu mendapat foto yang sama.
 */
export function poolImageForMaterial(code: string, materialId?: string | null): TopicImage {
  const pool = TOPIC_POOLS[code];
  if (!pool || pool.length === 0) return imageForTopicCode(code);
  if (!materialId) return pool[0];
  return pool[hashMaterialId(materialId) % pool.length];
}

/** Kredit unik untuk footer (satu entri per berkas foto, termasuk seluruh pool). */
export const PHOTO_CREDITS: TopicImage[] = Array.from(
  new Map(
    Object.values(TOPIC_POOLS)
      .flat()
      .concat(DEFAULT_IMAGE)
      .map((i) => [i.src, i]),
  ).values(),
);

/** Pencocokan cadangan berdasarkan kata kunci nama topik (bila kode tak dikenal). */
const KEYWORD_RULES: Array<[RegExp, string]> = [
  [/tayamum|tayammum/i, "THA-08"],
  [/pembatal|nawaqidh|nawaqid/i, "THA-05"],
  [/wudu|wudhu|ablution/i, "THA-04"],
  [/mandi|ghusl|junub|janabah/i, "THA-07"],
  [/najis|najasa/i, "THA-09"],
  [/haid|nifas|istihadhah|istihadah/i, "THA-10"],
  [/khuf|mengusap|kaus kaki|perban/i, "THA-06"],
  [/istinja|buang hajat/i, "THA-03"],
  [/bejana|peralatan|aniyah/i, "THA-02"],
  [/air|siwak|bersuci|thaharah|taharah/i, "THA-01"],
];

export function imageForTopicCode(code?: string | null): TopicImage {
  if (code && TOPIC_IMAGES[code]) return TOPIC_IMAGES[code];
  return DEFAULT_IMAGE;
}

export function imageForTopic(t?: Topic | null): TopicImage {
  if (!t) return DEFAULT_IMAGE;
  if (t.code && TOPIC_IMAGES[t.code]) return TOPIC_IMAGES[t.code];
  const name = `${t.name_id || ""} ${t.name || ""} ${t.title || ""}`;
  for (const [re, code] of KEYWORD_RULES) if (re.test(name)) return TOPIC_IMAGES[code];
  return DEFAULT_IMAGE;
}

/** Kode topik dari objek topik: kode persis dulu, lalu kata kunci nama. */
function codeForTopic(t?: Topic | null): string | null {
  if (!t) return null;
  if (t.code && TOPIC_IMAGES[t.code]) return t.code;
  const name = `${t.name_id || ""} ${t.name || ""} ${t.title || ""}`;
  for (const [re, code] of KEYWORD_RULES) if (re.test(name)) return code;
  return null;
}

/** Kode topik materi: dari topik pertamanya; tanpa topik → kata kunci judul. */
function codeForMaterial(m: MaterialSummary): string | null {
  const t = (m.topics && m.topics[0]) || m.topic || null;
  const fromTopic = codeForTopic(t);
  if (fromTopic) return fromTopic;
  const title = `${m.title_id || ""} ${m.title || ""}`;
  for (const [re, code] of KEYWORD_RULES) if (re.test(title)) return code;
  return null;
}

/**
 * Foto materi: dipilih deterministik dari pool topiknya berdasarkan hash
 * id materi (materi sama → foto sama di semua permukaan). Topik tak dikenal
 * → sampul umum.
 */
export function imageForMaterial(m?: MaterialSummary | null): TopicImage {
  if (!m) return DEFAULT_IMAGE;
  const code = codeForMaterial(m);
  if (!code) return DEFAULT_IMAGE;
  return poolImageForMaterial(code, m.id);
}

/** Kata Arab sampul untuk topik (API sering mengembalikan name_ar kosong). */
export function topicArabic(t?: Topic | null): string {
  if (t?.name_ar) return t.name_ar;
  if (t?.code && TOPIC_IMAGES[t.code]) return TOPIC_IMAGES[t.code].ar;
  return imageForTopic(t).ar;
}
