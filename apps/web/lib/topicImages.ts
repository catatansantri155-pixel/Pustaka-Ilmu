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
  creditSource: "Pexels" | "Unsplash" | "Gemini" | "ChatGPT";
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

const CHATGPT_CREDIT = {
  creditName: "Ilustrasi dihasilkan dengan ChatGPT (akun pemilik)",
  creditUrl: "https://chatgpt.com",
  creditSource: "ChatGPT" as const,
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
  "SHL-01": {
    src: "/images/topik/shl-01.webp",
    alt: "Ilustrasi hukum & Kedudukan Shalat",
    ar: "حكم الصلاة وأهميتها",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-02": {
    src: "/images/topik/shl-02.webp",
    alt: "Ilustrasi adzan & Iqamah",
    ar: "الأذان والإقامة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-03": {
    src: "/images/topik/shl-03.webp",
    alt: "Ilustrasi waktu Shalat",
    ar: "وقت الصلاة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-04": {
    src: "/images/topik/shl-04.webp",
    alt: "Ilustrasi syarat Sah: Aurat, Bacaan & Thaharah",
    ar: "شروط صحة الصلاة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-05": {
    src: "/images/topik/shl-05.webp",
    alt: "Ilustrasi rukun & Sifat Shalat",
    ar: "أركان الصلاة وصفتها",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-07": {
    src: "/images/topik/shl-07.webp",
    alt: "Ilustrasi tempat Shalat & Sutrah",
    ar: "مكان الصلاة والسترة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-08": {
    src: "/images/topik/shl-08.webp",
    alt: "Ilustrasi qunut, Lafaz & Gerakan",
    ar: "القنوت واللفظ والحركة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-09": {
    src: "/images/topik/shl-09.webp",
    alt: "Ilustrasi shalat Sunnah & Witir",
    ar: "صلاة التطوع",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-10": {
    src: "/images/topik/shl-10.webp",
    alt: "Ilustrasi berjamaah & Imamah",
    ar: "صلاة الجماعة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-06": {
    src: "/images/topik/shl-06.webp",
    alt: "Ilustrasi sujud Sahwi",
    ar: "سجود السهو",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-11": {
    src: "/images/topik/shl-11.webp",
    alt: "Ilustrasi shalat dalam Keadaan Khusus",
    ar: "صلاة المريض والخوف",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-12": {
    src: "/images/topik/shl-12.webp",
    alt: "Ilustrasi masjid & Shalat di Dalamnya",
    ar: "أحكام المساجد",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-13": {
    src: "/images/topik/shl-13.webp",
    alt: "Ilustrasi jumat",
    ar: "صلاة الجمعة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-14": {
    src: "/images/topik/shl-14.webp",
    alt: "Ilustrasi shalat Hari Raya",
    ar: "صلاة العيدين",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-15": {
    src: "/images/topik/shl-15.webp",
    alt: "Ilustrasi jamak & Qashar Musafir",
    ar: "أحكام الجمع والقصر للمسافر",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-16": {
    src: "/images/topik/shl-16.webp",
    alt: "Ilustrasi lain-lain Shalat",
    ar: "مسائل متفرقة في الصلاة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-17": {
    src: "/images/topik/shl-17.webp",
    alt: "Ilustrasi thuma'ninah & Khusyuk",
    ar: "الطمأنينة والخشوع",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-18": {
    src: "/images/topik/shl-18.webp",
    alt: "Ilustrasi sutrah Orang yang Shalat",
    ar: "سترة المصلي",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "SHL-19": {
    src: "/images/topik/shl-19.webp",
    alt: "Ilustrasi witir & Qiyamul Lail",
    ar: "الوتر وقيام الليل",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-01": {
    src: "/images/topik/haj-01.webp",
    alt: "Ilustrasi keutamaan Haji & Umrah",
    ar: "فضائل الحج والعمرة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-02": {
    src: "/images/topik/haj-02.webp",
    alt: "Ilustrasi hukum Haji & Umrah",
    ar: "حكم الحج والعمرة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-03": {
    src: "/images/topik/haj-03.webp",
    alt: "Ilustrasi syarat-Syarat Haji",
    ar: "شروط الحج",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-04": {
    src: "/images/topik/haj-04.webp",
    alt: "Ilustrasi ihram",
    ar: "الإحرام",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-05": {
    src: "/images/topik/haj-05.webp",
    alt: "Ilustrasi larangan-Larangan Ihram",
    ar: "محظورات الإحرام",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-06": {
    src: "/images/topik/haj-06.webp",
    alt: "Ilustrasi fidyah & Denda Berburu",
    ar: "الفدية وجزاء الصيد",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-07": {
    src: "/images/topik/haj-07.webp",
    alt: "Ilustrasi badal Haji",
    ar: "النيابة في الحج",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-08": {
    src: "/images/topik/haj-08.webp",
    alt: "Ilustrasi mabit di Mina",
    ar: "المبيت بمنى",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-09": {
    src: "/images/topik/haj-09.webp",
    alt: "Ilustrasi wukuf di Arafah",
    ar: "الوقوف بعرفة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-10": {
    src: "/images/topik/haj-10.webp",
    alt: "Ilustrasi mabit di Muzdalifah",
    ar: "المبيت بمزدلفة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-11": {
    src: "/images/topik/haj-11.webp",
    alt: "Ilustrasi tawaf",
    ar: "الطواف بالبيت",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-12": {
    src: "/images/topik/haj-12.webp",
    alt: "Ilustrasi sa'i",
    ar: "السعي",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-13": {
    src: "/images/topik/haj-13.webp",
    alt: "Ilustrasi melempar Jumrah",
    ar: "رمي الجمار",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-14": {
    src: "/images/topik/haj-14.webp",
    alt: "Ilustrasi ihshar",
    ar: "الإحصار",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-15": {
    src: "/images/topik/haj-15.webp",
    alt: "Ilustrasi hadyu & Hewan Kurban",
    ar: "الهدي والأضاحي",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-16": {
    src: "/images/topik/haj-16.webp",
    alt: "Ilustrasi masalah Lain-Lain Haji & Umrah",
    ar: "مسائل متفرقة في الحج والعمرة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-17": {
    src: "/images/topik/haj-17.webp",
    alt: "Ilustrasi miqat",
    ar: "المواقيت",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAJ-18": {
    src: "/images/topik/haj-18.webp",
    alt: "Ilustrasi tahallul",
    ar: "التحلل",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-01": {
    src: "/images/topik/nik-01.webp",
    alt: "Ilustrasi hukum & Keutamaan Nikah",
    ar: "حكم الزواج وأهميته",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-02": {
    src: "/images/topik/nik-02.webp",
    alt: "Ilustrasi syarat & Rukun Nikah",
    ar: "شروط وأركان الزواج",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-03": {
    src: "/images/topik/nik-03.webp",
    alt: "Ilustrasi khithbah & Memilih Pasangan",
    ar: "الخِطْبَة والاختيار",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-04": {
    src: "/images/topik/nik-04.webp",
    alt: "Ilustrasi nikah yang Diharamkan",
    ar: "الأنكحة المحرمة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-05": {
    src: "/images/topik/nik-05.webp",
    alt: "Ilustrasi wanita yang Haram Dinikahi",
    ar: "المحرمات من النساء",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-06": {
    src: "/images/topik/nik-06.webp",
    alt: "Ilustrasi syarat & Cacat dalam Nikah",
    ar: "الشروط والعيوب في النكاح",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-07": {
    src: "/images/topik/nik-07.webp",
    alt: "Ilustrasi nikah dengan Non-Muslim",
    ar: "نكاح الكفار",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-08": {
    src: "/images/topik/nik-08.webp",
    alt: "Ilustrasi mahar",
    ar: "الصداق",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-09": {
    src: "/images/topik/nik-09.webp",
    alt: "Ilustrasi walimah & Pesta Pernikahan",
    ar: "الزفاف ووليمة العرس",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-10": {
    src: "/images/topik/nik-10.webp",
    alt: "Ilustrasi hak & Kewajiban Suami Istri",
    ar: "الحقوق الزوجية",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-11": {
    src: "/images/topik/nik-11.webp",
    alt: "Ilustrasi masalah Lain-Lain seputar Nikah",
    ar: "مسائل متفرقة في النكاح",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-12": {
    src: "/images/topik/nik-12.webp",
    alt: "Ilustrasi memandang, Khalwat & Ikhtilat",
    ar: "النظر والخلوة والاختلاط",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-13": {
    src: "/images/topik/nik-13.webp",
    alt: "Ilustrasi persusuan & Mahram",
    ar: "الرضاع",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-14": {
    src: "/images/topik/nik-14.webp",
    alt: "Ilustrasi hukum Bayi Baru Lahir",
    ar: "أحكام المولود",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-15": {
    src: "/images/topik/nik-15.webp",
    alt: "Ilustrasi poligami",
    ar: "تعدد الزوجات",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-16": {
    src: "/images/topik/nik-16.webp",
    alt: "Ilustrasi kB & Pencegahan Kehamilan",
    ar: "تنظيم الحمل وموانعه",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-17": {
    src: "/images/topik/nik-17.webp",
    alt: "Ilustrasi pembatalan Nikah & Fasakh",
    ar: "مبطلات النكاح",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "NIK-18": {
    src: "/images/topik/nik-18.webp",
    alt: "Ilustrasi suami Hilang atau Menghilang",
    ar: "غياب وفقدان الزوج",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-01": {
    src: "/images/topik/mua-01.webp",
    alt: "Ilustrasi riba & Penukaran Uang",
    ar: "الربا والصرف",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-02": {
    src: "/images/topik/mua-02.webp",
    alt: "Ilustrasi jual Beli",
    ar: "البيوع",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-03": {
    src: "/images/topik/mua-03.webp",
    alt: "Ilustrasi lomba & Kompetisi",
    ar: "السبق والمسابقات",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-04": {
    src: "/images/topik/mua-04.webp",
    alt: "Ilustrasi utang & Pinjaman",
    ar: "السلف والقرض",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-05": {
    src: "/images/topik/mua-05.webp",
    alt: "Ilustrasi gadai",
    ar: "الرهن",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-06": {
    src: "/images/topik/mua-06.webp",
    alt: "Ilustrasi kepailitan & Pengampuan",
    ar: "الإفلاس والحجر",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-07": {
    src: "/images/topik/mua-07.webp",
    alt: "Ilustrasi perdamaian",
    ar: "الصلح",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-08": {
    src: "/images/topik/mua-08.webp",
    alt: "Ilustrasi hawalah (Pemindahan Utang)",
    ar: "الحوالة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-09": {
    src: "/images/topik/mua-09.webp",
    alt: "Ilustrasi jaminan & Kafalah",
    ar: "الضمان والكفالة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-10": {
    src: "/images/topik/mua-10.webp",
    alt: "Ilustrasi persekutuan & Perusahaan",
    ar: "الشركة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-11": {
    src: "/images/topik/mua-11.webp",
    alt: "Ilustrasi perwakilan",
    ar: "الوكالة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-12": {
    src: "/images/topik/mua-12.webp",
    alt: "Ilustrasi pinjam Pakai",
    ar: "العارية",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-13": {
    src: "/images/topik/mua-13.webp",
    alt: "Ilustrasi perampasan",
    ar: "الغصب",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-14": {
    src: "/images/topik/mua-14.webp",
    alt: "Ilustrasi syuf'ah",
    ar: "الشفعة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-15": {
    src: "/images/topik/mua-15.webp",
    alt: "Ilustrasi bagi Hasil Pertanian",
    ar: "المساقاة والمزارعة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-16": {
    src: "/images/topik/mua-16.webp",
    alt: "Ilustrasi sewa & Upah",
    ar: "الإجارة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-17": {
    src: "/images/topik/mua-17.webp",
    alt: "Ilustrasi menghidupkan Lahan Mati",
    ar: "إحياء الموات",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-18": {
    src: "/images/topik/mua-18.webp",
    alt: "Ilustrasi wakaf",
    ar: "الوقف",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-19": {
    src: "/images/topik/mua-19.webp",
    alt: "Ilustrasi hibah & Pemberian",
    ar: "الهبة والعطية",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-20": {
    src: "/images/topik/mua-20.webp",
    alt: "Ilustrasi barang Temuan",
    ar: "اللقطة واللقيط",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-21": {
    src: "/images/topik/mua-21.webp",
    alt: "Ilustrasi wasiat",
    ar: "الوصايا",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-22": {
    src: "/images/topik/mua-22.webp",
    alt: "Ilustrasi waris",
    ar: "الفرائض",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-23": {
    src: "/images/topik/mua-23.webp",
    alt: "Ilustrasi titipan",
    ar: "الوديعة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MUA-24": {
    src: "/images/topik/mua-24.webp",
    alt: "Ilustrasi penghasilan Haram",
    ar: "الكسب المحرم",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-01": {
    src: "/images/topik/akd-01.webp",
    alt: "Ilustrasi islam & Iman",
    ar: "الإسلام والإيمان",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-02": {
    src: "/images/topik/akd-02.webp",
    alt: "Ilustrasi asma & Sifat Allah",
    ar: "الأسماء والصفات",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-03": {
    src: "/images/topik/akd-03.webp",
    alt: "Ilustrasi rububiyah & Uluhiyah",
    ar: "الربوبية والألوهية",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-04": {
    src: "/images/topik/akd-04.webp",
    alt: "Ilustrasi pembatal Islam",
    ar: "نواقض الإسلام",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-05": {
    src: "/images/topik/akd-05.webp",
    alt: "Ilustrasi masalah Akidah Mutafarriqah",
    ar: "مسائل متفرقة في العقيدة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-06": {
    src: "/images/topik/akd-06.webp",
    alt: "Ilustrasi tawassul & Syafaat",
    ar: "التوسل والشفاعة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-07": {
    src: "/images/topik/akd-07.webp",
    alt: "Ilustrasi sihir & Perdukunan",
    ar: "السحر والكهانة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-08": {
    src: "/images/topik/akd-08.webp",
    alt: "Ilustrasi tanda-Tanda Kiamat",
    ar: "علامات الساعة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-09": {
    src: "/images/topik/akd-09.webp",
    alt: "Ilustrasi azab & Nikmat Kubur",
    ar: "عذاب القبر ونعيمه",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-10": {
    src: "/images/topik/akd-10.webp",
    alt: "Ilustrasi hari Akhir",
    ar: "اليوم الآخر",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-11": {
    src: "/images/topik/akd-11.webp",
    alt: "Ilustrasi kaidah-Kaidah Takfir",
    ar: "ضوابط التكفير",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-12": {
    src: "/images/topik/akd-12.webp",
    alt: "Ilustrasi qadha & Qadar",
    ar: "القضاء والقدر",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-13": {
    src: "/images/topik/akd-13.webp",
    alt: "Ilustrasi tabarruk & Jenis-Jenisnya",
    ar: "التبرك وأنواعه",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-14": {
    src: "/images/topik/akd-14.webp",
    alt: "Ilustrasi tathayyur & Merasa Sial",
    ar: "التشاؤم والتطير",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-15": {
    src: "/images/topik/akd-15.webp",
    alt: "Ilustrasi bersumpah dengan Selain Allah",
    ar: "الحلف بغير الله",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-16": {
    src: "/images/topik/akd-16.webp",
    alt: "Ilustrasi ruqyah & Jimat",
    ar: "الرقى والتمائم",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "AKD-17": {
    src: "/images/topik/akd-17.webp",
    alt: "Ilustrasi riya & Sum'ah",
    ar: "الرياء والسمعة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "PUA-01": {
    src: "/images/topik/pua-01.webp",
    alt: "Ilustrasi keutamaan Ramadan",
    ar: "فضائل رمضان",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "PUA-02": {
    src: "/images/topik/pua-02.webp",
    alt: "Ilustrasi hal yang Tidak Membatalkan Puasa",
    ar: "ما لا يفسد الصيام",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "PUA-03": {
    src: "/images/topik/pua-03.webp",
    alt: "Ilustrasi ru'yah Hilal",
    ar: "رؤيا الهلال",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "PUA-04": {
    src: "/images/topik/pua-04.webp",
    alt: "Ilustrasi siapa yang Wajib Berpuasa",
    ar: "من يجب عليه الصوم",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "PUA-05": {
    src: "/images/topik/pua-05.webp",
    alt: "Ilustrasi uzur yang Membolehkan Berbuka",
    ar: "الأعذار المبيحة للفطر",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "PUA-06": {
    src: "/images/topik/pua-06.webp",
    alt: "Ilustrasi niat Puasa",
    ar: "النية في الصيام",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "PUA-07": {
    src: "/images/topik/pua-07.webp",
    alt: "Ilustrasi pembatal Puasa",
    ar: "مفسدات الصيام",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "PUA-08": {
    src: "/images/topik/pua-08.webp",
    alt: "Ilustrasi jima' di Siang Ramadan",
    ar: "الجماع في نهار رمضان",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "PUA-09": {
    src: "/images/topik/pua-09.webp",
    alt: "Ilustrasi sunnah-Sunnah Puasa",
    ar: "مستحبات الصيام",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "PUA-10": {
    src: "/images/topik/pua-10.webp",
    alt: "Ilustrasi qadha Puasa",
    ar: "قضاء الصيام",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "PUA-11": {
    src: "/images/topik/pua-11.webp",
    alt: "Ilustrasi puasa Sunnah",
    ar: "صيام التطوع",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "PUA-12": {
    src: "/images/topik/pua-12.webp",
    alt: "Ilustrasi iktikaf & Lailatul Qadar",
    ar: "الاعتكاف وليلة القدر",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "PUA-13": {
    src: "/images/topik/pua-13.webp",
    alt: "Ilustrasi masalah Lain-Lain Puasa",
    ar: "مسائل متفرقة في الصيام",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "JNZ-01": {
    src: "/images/topik/jnz-01.webp",
    alt: "Ilustrasi memandikan & Mempersiapkan Jenazah",
    ar: "غسل الميت وتجهيزه",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "JNZ-02": {
    src: "/images/topik/jnz-02.webp",
    alt: "Ilustrasi shalat Jenazah",
    ar: "الصلاة على الميت",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "JNZ-03": {
    src: "/images/topik/jnz-03.webp",
    alt: "Ilustrasi membawa & Memakamkan Jenazah",
    ar: "حمل الميت ودفنه",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "JNZ-04": {
    src: "/images/topik/jnz-04.webp",
    alt: "Ilustrasi ziarah Kubur",
    ar: "زيارة القبور",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "JNZ-05": {
    src: "/images/topik/jnz-05.webp",
    alt: "Ilustrasi menghadiahkan Pahala untuk Mayit",
    ar: "إهداء القرب للميت",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "JNZ-06": {
    src: "/images/topik/jnz-06.webp",
    alt: "Ilustrasi kehormatan Orang yang Telah Wafat",
    ar: "حرمة الأموات",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "JNZ-07": {
    src: "/images/topik/jnz-07.webp",
    alt: "Ilustrasi takziah",
    ar: "أحكام التعزية",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "JNZ-08": {
    src: "/images/topik/jnz-08.webp",
    alt: "Ilustrasi masalah Lain-Lain Jenazah",
    ar: "مسائل متفرقة في الجنائز",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "JNZ-09": {
    src: "/images/topik/jnz-09.webp",
    alt: "Ilustrasi sakaratul Maut & Talqin Mayit",
    ar: "الاحتضار وتلقين الميت",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "JNZ-10": {
    src: "/images/topik/jnz-10.webp",
    alt: "Ilustrasi hukum-Hukum Pekuburan",
    ar: "أحكام المقابر",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "JNZ-11": {
    src: "/images/topik/jnz-11.webp",
    alt: "Ilustrasi meratapi Mayit",
    ar: "النياحة على الميت",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "TAL-01": {
    src: "/images/topik/tal-01.webp",
    alt: "Ilustrasi khulu'",
    ar: "الخلع",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "TAL-02": {
    src: "/images/topik/tal-02.webp",
    alt: "Ilustrasi talak",
    ar: "الطلاق",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "TAL-03": {
    src: "/images/topik/tal-03.webp",
    alt: "Ilustrasi rujuk",
    ar: "الرجعة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "TAL-04": {
    src: "/images/topik/tal-04.webp",
    alt: "Ilustrasi ila'",
    ar: "الإيلاء",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "TAL-05": {
    src: "/images/topik/tal-05.webp",
    alt: "Ilustrasi zhihar",
    ar: "الظهار",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "TAL-06": {
    src: "/images/topik/tal-06.webp",
    alt: "Ilustrasi iddah",
    ar: "العِدَد",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "TAL-07": {
    src: "/images/topik/tal-07.webp",
    alt: "Ilustrasi nafkah Keluarga",
    ar: "النفقات",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "TAL-08": {
    src: "/images/topik/tal-08.webp",
    alt: "Ilustrasi kuasa Asuh",
    ar: "الحضانة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "TAL-09": {
    src: "/images/topik/tal-09.webp",
    alt: "Ilustrasi keluarga Umum & Hubungan Orang Tua-Anak",
    ar: "",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "ZKT-01": {
    src: "/images/topik/zkt-01.webp",
    alt: "Ilustrasi kewajiban & Kedudukan Zakat",
    ar: "وجوب الزكاة وأهميتها",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "ZKT-02": {
    src: "/images/topik/zkt-02.webp",
    alt: "Ilustrasi zakat Hewan Ternak",
    ar: "زكاة بهيمة الأنعام",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "ZKT-03": {
    src: "/images/topik/zkt-03.webp",
    alt: "Ilustrasi zakat Hasil Bumi & Buah-buahan",
    ar: "زكاة الحبوب والثمار",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "ZKT-04": {
    src: "/images/topik/zkt-04.webp",
    alt: "Ilustrasi zakat Emas, Perak & Uang",
    ar: "زكاة النقدين",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "ZKT-05": {
    src: "/images/topik/zkt-05.webp",
    alt: "Ilustrasi zakat Barang Dagangan",
    ar: "زكاة عروض التجارة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "ZKT-06": {
    src: "/images/topik/zkt-06.webp",
    alt: "Ilustrasi zakat Fitrah",
    ar: "زكاة الفطر",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "ZKT-07": {
    src: "/images/topik/zkt-07.webp",
    alt: "Ilustrasi penyaluran Zakat & Golongan Penerima",
    ar: "إخراج الزكاة وأهلها",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "ZKT-08": {
    src: "/images/topik/zkt-08.webp",
    alt: "Ilustrasi sedekah Sunnah",
    ar: "صدقة التطوع",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "ZKT-09": {
    src: "/images/topik/zkt-09.webp",
    alt: "Ilustrasi masalah Lain-Lain Zakat",
    ar: "مسائل متفرقة في الزكاة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "ADB-01": {
    src: "/images/topik/adb-01.webp",
    alt: "Ilustrasi adab & Akhlak Terpuji",
    ar: "الآداب والأخلاق المحمودة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "ADB-02": {
    src: "/images/topik/adb-02.webp",
    alt: "Ilustrasi akhlak Tercela",
    ar: "الأخلاق المذمومة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "ADB-03": {
    src: "/images/topik/adb-03.webp",
    alt: "Ilustrasi adab & Akhlak (Umum)",
    ar: "الآداب والأخلاق",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "FAD-01": {
    src: "/images/topik/fad-01.webp",
    alt: "Ilustrasi keutamaan Amal",
    ar: "فضائل الأعمال",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "FAD-02": {
    src: "/images/topik/fad-02.webp",
    alt: "Ilustrasi keutamaan Waktu & Tempat",
    ar: "فضائل الأزمنة والأمكنة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "FAD-03": {
    src: "/images/topik/fad-03.webp",
    alt: "Ilustrasi keutamaan Lain-Lain",
    ar: "فضائل متنوعة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAD-01": {
    src: "/images/topik/had-01.webp",
    alt: "Ilustrasi musthalah Hadis",
    ar: "مصطلح الحديث",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAD-02": {
    src: "/images/topik/had-02.webp",
    alt: "Ilustrasi syarah Hadis",
    ar: "شروح الحديث",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAD-03": {
    src: "/images/topik/had-03.webp",
    alt: "Ilustrasi hukum atas Hadis",
    ar: "الحكم على الأحاديث",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "HAD-04": {
    src: "/images/topik/had-04.webp",
    alt: "Ilustrasi hadis & Ulumul Hadis (Umum)",
    ar: "الحديث وعلومه",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MAK-01": {
    src: "/images/topik/mak-01.webp",
    alt: "Ilustrasi makanan & Minuman",
    ar: "الأطعمة والأشربة",
    ...GEMINI_CREDIT,
    position: "50% 50%",
  },
  "MAK-02": {
    src: "/images/topik/mak-02.webp",
    alt: "Ilustrasi penyembelihan & Perburuan",
    ar: "الذكاة والصيد",
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

/** Gambar khusus per materi (satu materi satu gambar; kunci = id materi). */
// MATERIAL_IMAGES:START
export const MATERIAL_IMAGES: Record<string, TopicImage> = {
  "805ac243-13a7-4bf9-8ace-8f827e74ff17": {
    src: "/images/materi/805ac243-13a7-4bf9-8ace-8f827e74ff17.webp",
    alt: "Ilustrasi Apa Hukum Air Limbah yang Didaur Ulang?",
    ar: "ما حكم مياه المجاري المكررة؟",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "a8642189-b88e-40aa-a92f-c053a4008242": {
    src: "/images/materi/a8642189-b88e-40aa-a92f-c053a4008242.webp",
    alt: "Ilustrasi Apa Hukum Kesucian Air Limbah yang Telah Dimurnikan?",
    ar: "ما الحكم في طهارة مياه المجاري المُنقاة؟",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "d82e5050-bd2e-461e-baf8-5a4599a5d831": {
    src: "/images/materi/d82e5050-bd2e-461e-baf8-5a4599a5d831.webp",
    alt: "Ilustrasi Apakah Bersuci Sah dengan Air Hasil Rampasan (Ghashab)?",
    ar: "هل تصح الطهارة بالماء المغصوب؟",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "3cd40e22-cf23-4c7f-96ff-2a1931e6e6f0": {
    src: "/images/materi/3cd40e22-cf23-4c7f-96ff-2a1931e6e6f0.webp",
    alt: "Ilustrasi Berwudu dari Air yang Keruh karena Lumpur dan Rerumputan",
    ar: "الوضوء من الماء المكدر بالطين والأعشاب",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "ae2811cd-aa18-461c-b9c5-9efc58c94f99": {
    src: "/images/materi/ae2811cd-aa18-461c-b9c5-9efc58c94f99.webp",
    alt: "Ilustrasi Hukum Air Jika Berubah oleh Sesuatu yang Bukan Najis",
    ar: "حكم الماء إذا تغير بما ليس بنجس",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "e2c49548-061e-4798-90d0-9991e6a19290": {
    src: "/images/materi/e2c49548-061e-4798-90d0-9991e6a19290.webp",
    alt: "Ilustrasi Hukum Air Najis Jika Dijernihkan dengan Cara-Cara Ilmiah",
    ar: "حكم الماء النجس إذا صفي بطرق علمية",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "5796f303-a476-49eb-bb43-19431c00175a": {
    src: "/images/materi/5796f303-a476-49eb-bb43-19431c00175a.webp",
    alt: "Ilustrasi Hukum Air yang Bercipratan Saat Mencuci Pakaian Najis",
    ar: "حكم الماء المتطاير أثناء غسل ثوب نجس",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "85df0ed3-12fb-43e2-a470-b47da2ee7ec8": {
    src: "/images/materi/85df0ed3-12fb-43e2-a470-b47da2ee7ec8.webp",
    alt: "Ilustrasi Hukum Air yang Bertemu dengan Najis",
    ar: "حكم الماء الملاقي للنجاسة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "e373d469-60ef-4218-af25-d3ce37454abf": {
    src: "/images/materi/e373d469-60ef-4218-af25-d3ce37454abf.webp",
    alt: "Ilustrasi Hukum Air yang Diciduk oleh Orang yang Berwudu Darinya",
    ar: "حكم الماء الذي يغترف منه المتوضئ",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "9a937d72-6a2a-4666-954c-f9366c97e0fa": {
    src: "/images/materi/9a937d72-6a2a-4666-954c-f9366c97e0fa.webp",
    alt: "Ilustrasi Hukum Air yang Dijemur di Matahari dan Buang Air Kecil di Air yang Tergenang",
    ar: "حكم الماء المشمّس والبول في الماء الراكد",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "0552f4e7-3466-46d0-8c38-e6ffbbab4aab": {
    src: "/images/materi/0552f4e7-3466-46d0-8c38-e6ffbbab4aab.webp",
    alt: "Ilustrasi Hukum Berwudu dari Air yang Dijilat Hewan",
    ar: "حكم الوضوء من الماء الذي ولغ فيه الحيوان",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "0db5c20e-2d35-43b4-a18d-64eaa4e68a14": {
    src: "/images/materi/0db5c20e-2d35-43b4-a18d-64eaa4e68a14.webp",
    alt: "Ilustrasi Hukum Berwudu dari Air yang Tidak Layak untuk Diminum",
    ar: "حكم الوضوء من ماء لا يصلح للشرب",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "df4310fd-1cd4-46c9-b17d-546ca1173bd8": {
    src: "/images/materi/df4310fd-1cd4-46c9-b17d-546ca1173bd8.webp",
    alt: "Ilustrasi Hukum Berwudu dengan Air Laut",
    ar: "حكم الوضوء بماء البحر",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "a30155a8-c1c3-4c75-a498-baa7bca0ac6a": {
    src: "/images/materi/a30155a8-c1c3-4c75-a498-baa7bca0ac6a.webp",
    alt: "Ilustrasi Hukum Berwudu dengan Air yang Berbau Gas atau Lainnya",
    ar: "حكم الوضوء بماء فيه رائحة الغاز أو غيره",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "32b05b63-5a00-4d43-b394-ff0684b70581": {
    src: "/images/materi/32b05b63-5a00-4d43-b394-ff0684b70581.webp",
    alt: "Ilustrasi Hukum Berwudu dengan Air yang Bercampur Klorin",
    ar: "حكم الوضوء بالماء المخلوط بالكلور",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "1f4e89dc-d64c-44ee-ab18-762227b5e71f": {
    src: "/images/materi/1f4e89dc-d64c-44ee-ab18-762227b5e71f.webp",
    alt: "Ilustrasi Hukum Berwudu dengan Air yang Berubah Baunya",
    ar: "حكم الوضوء بماء متغير الرائحة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "73d4f60e-1572-42e7-aeab-b14cfa011bcb": {
    src: "/images/materi/73d4f60e-1572-42e7-aeab-b14cfa011bcb.webp",
    alt: "Ilustrasi Hukum Berwudu dengan Air yang Berubah Salah Satu Sifatnya",
    ar: "حكم الوضوء بماء تغيرت أحد أوصافه",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "591f6c43-8fc1-4936-9038-ef8b61a2443f": {
    src: "/images/materi/591f6c43-8fc1-4936-9038-ef8b61a2443f.webp",
    alt: "Ilustrasi Hukum Berwudu dengan Minyak Bumi (Bensin)",
    ar: "حكم الوضوء بالبترول",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "cd912dce-c5ee-4c19-8b47-d5a79b1a119f": {
    src: "/images/materi/cd912dce-c5ee-4c19-8b47-d5a79b1a119f.webp",
    alt: "Ilustrasi Hukum Kesucian Air yang Kurang dari Dua Qullah apabila Bercampur Najis",
    ar: "حكم طهارة الماء دون القلتين إذا خالطته نجاسة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "202dc43a-c1c0-40e6-a43e-411c3381f1f4": {
    src: "/images/materi/202dc43a-c1c0-40e6-a43e-411c3381f1f4.webp",
    alt: "Ilustrasi Hukum Menggunakan Air Zamzam untuk Mandi dan Istinja",
    ar: "حكم استعمال ماء زمزم في الاغتسال والاستنجاء",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "ca22657f-d2b6-48f0-b7b3-e1bfb02760d1": {
    src: "/images/materi/ca22657f-d2b6-48f0-b7b3-e1bfb02760d1.webp",
    alt: "Ilustrasi Hukum Menggunakan Air yang Berubah karena Bahan Obat",
    ar: "حكم استعمال الماء المعالج بالمواد الدوائية",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "adfe93a3-3177-4227-86c1-3b15d6eb6093": {
    src: "/images/materi/adfe93a3-3177-4227-86c1-3b15d6eb6093.webp",
    alt: "Ilustrasi Hukum Najisnya Air apabila Kurang dari Dua Qullah",
    ar: "حكم نجاسة الماء إذا كان أقلّ من قُلَّتين",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "d8eb23b9-817d-4cb8-b5ad-0a8189791335": {
    src: "/images/materi/d8eb23b9-817d-4cb8-b5ad-0a8189791335.webp",
    alt: "Ilustrasi Hukum Wudu dan Istinja di Air yang Mengalir dan Air yang Diam",
    ar: "حكم الوضوء والاستنجاء في الماء الجاري والراكد",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "d2e24f66-44cb-4415-ad28-4079142a9596": {
    src: "/images/materi/d2e24f66-44cb-4415-ad28-4079142a9596.webp",
    alt: "Ilustrasi Hukum Wudu dari Air Sumur yang Berubah",
    ar: "حكم الوضوء من مياه الآبار المتغيرة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "9a2d6147-e33f-4b95-a118-819d06b9d49a": {
    src: "/images/materi/9a2d6147-e33f-4b95-a118-819d06b9d49a.webp",
    alt: "Ilustrasi Hukum Wudu di Kolam Jika Warna dan Rasanya Telah Berubah",
    ar: "حكم الوضوء في البرك إذا تغير لونها وطعمها",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "0e98f1ad-91c9-40fa-9344-b1bbc98c67c5": {
    src: "/images/materi/0e98f1ad-91c9-40fa-9344-b1bbc98c67c5.webp",
    alt: "Ilustrasi Hukum air limbah yang telah diolah",
    ar: "ما حكم مياه المجاري المكرَّرة؟",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "918df792-8213-43ae-857f-8460905995cc": {
    src: "/images/materi/918df792-8213-43ae-857f-8460905995cc.webp",
    alt: "Ilustrasi Kapan Air yang Tergenang Menjadi Najis?",
    ar: "متى يكون الماء الراكد نَجِسًا؟",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "6f79fd60-cbb6-4779-b18b-6c717e7faa1c": {
    src: "/images/materi/6f79fd60-cbb6-4779-b18b-6c717e7faa1c.webp",
    alt: "Ilustrasi Mandi, istinja, dan wudu di kolam air yang menggenang",
    ar: "حكم الاغتسال والاستنجاء والوضوء في برك الماء الدائمة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "ea4710e1-0048-4b72-a64b-4a1b5f5afed7": {
    src: "/images/materi/ea4710e1-0048-4b72-a64b-4a1b5f5afed7.webp",
    alt: "Ilustrasi Pembagian Air dan Hukum Masing-Masingnya",
    ar: "أقسام المياه وحكم كل منها",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "60b07150-d1a8-44a4-a7d2-8a28cefc9e93": {
    src: "/images/materi/60b07150-d1a8-44a4-a7d2-8a28cefc9e93.webp",
    alt: "Ilustrasi Wudu dari Air yang Terkumpul dalam Bejana di Bawah Keran",
    ar: "الوضوء من الماء المجتمع في الإناء تحت الصنبور",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "e967c65d-2152-4419-95b6-eb61f1edbc4b": {
    src: "/images/materi/e967c65d-2152-4419-95b6-eb61f1edbc4b.webp",
    alt: "Ilustrasi 'Illah (Sebab) Diharamkannya Bejana Emas dan Perak",
    ar: "علة تحريم أواني الذهب والفضة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "52c21d93-19e1-4a35-bd02-0bbda7079c27": {
    src: "/images/materi/52c21d93-19e1-4a35-bd02-0bbda7079c27.webp",
    alt: "Ilustrasi Apa Hukum Menggunakan Bejana Emas dan Perak?",
    ar: "ما حكم استعمال آنية الذهب والفضة؟",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "20ae5b75-3927-4c72-b274-37c12df716dd": {
    src: "/images/materi/20ae5b75-3927-4c72-b274-37c12df716dd.webp",
    alt: "Ilustrasi Apa yang Mencukupi dalam Menutupi Bejana sebagai Bentuk Mengikuti Sunnah?",
    ar: "ما الذي يجزئ في تغطية الإناء اتباعًا للسُّنة؟",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "50585505-dfce-4ec4-a084-6520ade665a9": {
    src: "/images/materi/50585505-dfce-4ec4-a084-6520ade665a9.webp",
    alt: "Ilustrasi Apakah Boleh Meminum Sisa Minuman Orang Kafir?",
    ar: "هل يجوز شرب سؤر الكافر؟",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "87e0a11c-47f1-4b1c-b8f2-ddbf4fef0420": {
    src: "/images/materi/87e0a11c-47f1-4b1c-b8f2-ddbf4fef0420.webp",
    alt: "Ilustrasi Apakah Disunahkan Menutup Bejana Walaupun Kosong?",
    ar: "هل يُسنُّ تغطية الإناء ولو كان فارغا؟",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "05507d7f-3575-47e1-8af0-eb0a6ee9943d": {
    src: "/images/materi/05507d7f-3575-47e1-8af0-eb0a6ee9943d.webp",
    alt: "Ilustrasi Apakah Menutupi Bejana-Bejana Mencakup yang Kosong dan yang Penuh (Berisi)?",
    ar: "هل تغطية الأواني  يشمل الفارغة والملآنة؟",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "997defaa-69f8-482c-8a31-c2eda70728f4": {
    src: "/images/materi/997defaa-69f8-482c-8a31-c2eda70728f4.webp",
    alt: "Ilustrasi Bejana berlapis emas",
    ar: "آنية الذهب",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "ce98a964-8334-44fe-a7f5-a00379bac772": {
    src: "/images/materi/ce98a964-8334-44fe-a7f5-a00379bac772.webp",
    alt: "Ilustrasi Hikmah Diharamkannya Memakai Bejana Emas dan Perak",
    ar: "الحكمة من تحريم استعمال أواني الذهب والفضة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "8e080055-843f-4f5b-9e03-872d88596a97": {
    src: "/images/materi/8e080055-843f-4f5b-9e03-872d88596a97.webp",
    alt: "Ilustrasi Hukum Bejana yang Dilapisi Air Emas karena Takut Karat",
    ar: "حكم الأواني المطلية بماء الذهب خوفًا من الصدأ",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "119953fc-0689-4b8e-908b-c2f6b3b48f9d": {
    src: "/images/materi/119953fc-0689-4b8e-908b-c2f6b3b48f9d.webp",
    alt: "Ilustrasi Hukum Bejana yang Terbuat dari Berlian dan Semisalnya",
    ar: "حكم الأواني المصنوعة من الألماس ونحوه",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "f1642b87-065a-4e22-8510-784d8abf1375": {
    src: "/images/materi/f1642b87-065a-4e22-8510-784d8abf1375.webp",
    alt: "Ilustrasi Hukum Bejana-Bejana dari Selain Emas akan tetapi Ia Lebih Mahal",
    ar: "حكم الأواني من غير الذهب لكنها أغلى",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "05874139-3336-4201-ad22-cf9cb833f139": {
    src: "/images/materi/05874139-3336-4201-ad22-cf9cb833f139.webp",
    alt: "Ilustrasi Hukum Bejana-Bejana yang Padanya Terdapat Sebagian Emas atau Perak",
    ar: "حكم الأواني التي بها بعض الذهب أو الفضة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "9c246bce-e643-457a-bfed-c52798ef4e28": {
    src: "/images/materi/9c246bce-e643-457a-bfed-c52798ef4e28.webp",
    alt: "Ilustrasi Hukum Bulu Domba dan Bulu Unta yang Ada pada Kulit",
    ar: "حكم صوف الغنم ووبر الإبل الذي على الجلد",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "9cb6077e-4c3a-4e7b-8b48-51521e364ae0": {
    src: "/images/materi/9cb6077e-4c3a-4e7b-8b48-51521e364ae0.webp",
    alt: "Ilustrasi Hukum Dot (Empeng) Anak-Anak dari Perak atau Emas",
    ar: "حكم مصاصات الأطفال من الفضة أو الذهب",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "43c6f37d-c6be-40ae-8a90-06a7175726e3": {
    src: "/images/materi/43c6f37d-c6be-40ae-8a90-06a7175726e3.webp",
    alt: "Ilustrasi Hukum Kesucian Bejana Apabila Binatang Buas Minum Darinya",
    ar: "حكم طهارة الإناء إذا شربت منه السِّباع",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "e600e6fb-9f31-42cc-89ec-31eb99f8f750": {
    src: "/images/materi/e600e6fb-9f31-42cc-89ec-31eb99f8f750.webp",
    alt: "Ilustrasi Hukum Makan dalam Bejana yang di Dalamnya Ada Gambar-Gambar",
    ar: "حكم الأكل في الأواني التي فيها صور",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "dfdc5788-a9a6-4839-ad8b-938aa24578ef": {
    src: "/images/materi/dfdc5788-a9a6-4839-ad8b-938aa24578ef.webp",
    alt: "Ilustrasi Hukum Makan dalam Bejana-Bejana yang Meragukan",
    ar: "حكم الأكل في الأواني المشبوهة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "f0f0697d-2956-46b4-96f2-7bd43dbae68a": {
    src: "/images/materi/f0f0697d-2956-46b4-96f2-7bd43dbae68a.webp",
    alt: "Ilustrasi Hukum Memakai Bejana Emas dan Perak dan Berdagang pada Keduanya",
    ar: "حكم استعمال آنية الذهب والفضة والتجارة فيهما",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "e597f762-e911-416b-82bd-31b66c57f56a": {
    src: "/images/materi/e597f762-e911-416b-82bd-31b66c57f56a.webp",
    alt: "Ilustrasi Hukum Memakai Bejana yang Dilapisi Emas atau Perak",
    ar: "حكم استعمال الأواني المطلية بالذهب أو الفضة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "28829afd-3d0b-4b4b-bdae-06c96c29a5ac": {
    src: "/images/materi/28829afd-3d0b-4b4b-bdae-06c96c29a5ac.webp",
    alt: "Ilustrasi Hukum Memakai Bejana yang Dilapisi Emas dan Perak",
    ar: "حكم استعمال الأواني المطلية بالذهب والفضة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "ed69259f-22ec-4803-89d4-e4e5130e0a7c": {
    src: "/images/materi/ed69259f-22ec-4803-89d4-e4e5130e0a7c.webp",
    alt: "Ilustrasi Hukum Memakai Bejana yang Dilapisi Perak",
    ar: "حكم استعمال الأواني المطلية بالفضة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "35cad0f1-8d7b-46bf-9b32-749d76ce6a07": {
    src: "/images/materi/35cad0f1-8d7b-46bf-9b32-749d76ce6a07.webp",
    alt: "Ilustrasi Hukum Memakan Sembelihan Orang-Orang Kafir dan Memakai Bejana-Bejana Mereka",
    ar: "حكم أكل ذبائح الكفار واستعمال أوانيهم",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "4a8e7697-6e37-4786-a9a4-9d6baaa92bd4": {
    src: "/images/materi/4a8e7697-6e37-4786-a9a4-9d6baaa92bd4.webp",
    alt: "Ilustrasi Hukum Memiliki atau Memakai Bejana yang Dilapisi Emas atau Perak",
    ar: "حكم اقتناء أو استعمال الأواني المطلية بالذهب أو الفضة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "fad7f7ac-1301-48a2-ba88-2c7a5e1eb7a0": {
    src: "/images/materi/fad7f7ac-1301-48a2-ba88-2c7a5e1eb7a0.webp",
    alt: "Ilustrasi Hukum Menggunakan Bejana Emas dan Perak",
    ar: "حكم استعمال آنية الذهب والفضة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "229cbafd-b929-4276-8597-4c39a259782d": {
    src: "/images/materi/229cbafd-b929-4276-8597-4c39a259782d.webp",
    alt: "Ilustrasi Hukum Menggunakan Emas dan Perak pada Pintu-Pintu dan Dinding-Dinding",
    ar: "حكم استعمال الذهب والفضة  في الأبواب والجدران",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "c601fe98-8831-4446-9262-ac0177acf623": {
    src: "/images/materi/c601fe98-8831-4446-9262-ac0177acf623.webp",
    alt: "Ilustrasi Hukum Menggunakan Sesuatu yang Disepuh Emas atau Perak",
    ar: "حكم استعمال ما كان مموهًا بذهب أو فضة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "88ecc299-c0ef-4d46-a0e3-511c43c32421": {
    src: "/images/materi/88ecc299-c0ef-4d46-a0e3-511c43c32421.webp",
    alt: "Ilustrasi Hukum Menjadikan Bejana Emas dan Perak sebagai Hiasan",
    ar: "حكم اتخاذ أواني الذهب والفضة للزينة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "d9bc52b9-9797-47aa-9fdc-aa13ca6afff2": {
    src: "/images/materi/d9bc52b9-9797-47aa-9fdc-aa13ca6afff2.webp",
    alt: "Ilustrasi Keharaman Bejana Emas dan Perak",
    ar: "تحريم آنية الذهب والفضة",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "8675ea65-68f1-4b9c-a7d3-5fd5e8451da0": {
    src: "/images/materi/8675ea65-68f1-4b9c-a7d3-5fd5e8451da0.webp",
    alt: "Ilustrasi Makan dan Minum dalam Bejana yang Dilapisi Emas",
    ar: "الأكل والشرب في الإناء المطلي بالذهب",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "4e46e73a-1c02-40a1-a616-623ba0916518": {
    src: "/images/materi/4e46e73a-1c02-40a1-a616-623ba0916518.webp",
    alt: "Ilustrasi Memakan sembelihan non-Muslim dan menggunakan bejana mereka",
    ar: "أكل ذبائح الكفار واستعمال أوانيهم",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
  "5b1a6b53-d7ae-41c8-a6f7-ba39a4924867": {
    src: "/images/materi/5b1a6b53-d7ae-41c8-a6f7-ba39a4924867.webp",
    alt: "Ilustrasi Menggunakan keran dan bejana berlapis emas",
    ar: "استخدام الصنابير والأواني المطلية بماء الذهب",
    ...CHATGPT_CREDIT,
    position: "50% 50%",
  },
};
// MATERIAL_IMAGES:END

/**
 * Foto materi: dipilih deterministik dari pool topiknya berdasarkan hash
 * id materi (materi sama → foto sama di semua permukaan). Topik tak dikenal
 * → sampul umum.
 */
export function imageForMaterial(m?: MaterialSummary | null): TopicImage {
  if (!m) return DEFAULT_IMAGE;
  if (m.id && MATERIAL_IMAGES[m.id]) return MATERIAL_IMAGES[m.id];
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
