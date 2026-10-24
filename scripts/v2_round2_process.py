#!/usr/bin/env python3
"""Proses Ronde Konten 2: kurasi + terjemahan agen untuk impor Bin Baz terverifikasi.

Pola sama dengan ronde 1 (process_pilot.py + v2_curate_imports.py), digabung per materi:
- judul Arab/Indonesia dirapikan (judul Indonesia HARFIAH, tanpa glos kurung tambahan),
- rights_status='CLEARED' berbasis bukti source_registry binbaz.org.sa
  (PERMITTED_WITH_ATTRIBUTION, footer resmi situs; atribusi = source_url tampil),
- arabic_texts.is_complete=true SETELAH set segmen diverifikasi utuh terhadap
  halaman asal (soal + jawaban + penutup + atribusi Majmu' Fatawa),
- tautan topik Thaharah,
- terjemahan agen Muse via services translate_material() -> AIRun tercatat
  jujur dengan AI_MODEL="claude-agent-assisted" + quality audit bawaan,
- AuditLog TRANSLATE_AGENT_ASSISTED.
Persetujuan & penerbitan TIDAK di sini — lewat endpoint admin + publication gate.

Jalankan dari root repo:  .venv/bin/python scripts/v2_round2_process.py <material_id>
"""
import os
import re
import sys

os.environ["AI_MODEL"] = "claude-agent-assisted"
# config aplikasi membaca .env relatif terhadap CWD; paksa DATABASE_URL produksi
# dari services/api/.env (pola v2_curate_imports.py) agar tidak jatuh ke SQLite.
_env_path = os.path.join(os.path.dirname(__file__), "..", "services", "api", ".env")
_m = re.search(r"^DATABASE_URL=(.+)$", open(_env_path).read(), re.M)
if _m:
    os.environ["DATABASE_URL"] = _m.group(1).strip()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "services", "api"))

from app.db import SessionLocal                      # noqa: E402
from app.models import (Material, ArabicText, TextSegment, Topic,  # noqa: E402
                        MaterialTopic, AuditLog, User)
from app.services.ai_adapter import translate_material, AI_LABEL  # noqa: E402


class StaticAgentAdapter:
    """Adapter yang mengembalikan terjemahan agen yang sudah disiapkan (bukan API)."""

    def __init__(self, translations):
        self._t = translations

    def translate_segments(self, segments):
        assert len(segments) == len(self._t), f"Jumlah segmen berubah: {len(segments)} != {len(self._t)}"
        return list(self._t)


DATA = {
    # ---- binbaz.org.sa/fatwas/3576 — أقسام المياه وحكم كل منها (Majmu' Fatawa 10/14)
    "ea4710e1-0048-4b72-a64b-4a1b5f5afed7": {
        "title_ar": "أقسام المياه وحكم كل منها",
        "title_id": "Pembagian Air dan Hukum Masing-Masingnya",
        "topic": "THA-01",
        "translations": [
            # seg 0 — judul + pertanyaan
            "Pembagian Air dan Hukum Masing-Masingnya\n"
            "Pertanyaan:\n"
            "Terjadi perdebatan tentang pembagian air: sebagian berpendapat air terbagi menjadi dua macam, "
            "yaitu thahir (suci) dan najis; sebagian lain berpendapat air terbagi menjadi tiga macam, yaitu "
            "thahur (suci dan menyucikan), thahir (suci), dan najis. Pertanyaannya: apakah yang benar itu "
            "bersama kelompok pertama ataukah kelompok kedua?",
            # seg 1 — lanjutan pertanyaan
            "Saya mohon kepada Samahah beliau untuk menjelaskan persoalan tersebut.",
            # seg 2 — jawaban bagian 1 + dalil
            "Jawaban: Yang benar adalah bahwa air mutlak terbagi menjadi dua macam: thahur dan najis. "
            "Allah Ta'ala berfirman:\n"
            "\"Dan Kami turunkan dari langit air yang suci (thahur)\" [Al-Furqan: 48]. Dan Allah Ta'ala berfirman:\n"
            "\"(Ingatlah) ketika Allah membuat kamu mengantuk sebagai penenteram dari-Nya, dan Allah menurunkan "
            "air dari langit kepadamu untuk menyucikanmu dengannya dan menghilangkan gangguan setan darimu\" "
            "ayat [Al-Anfal: 11]. Dan Nabi ﷺ bersabda:\n"
            "\"Sesungguhnya air itu thahur, tidak ada sesuatu pun yang menajiskannya.\" Diriwayatkan oleh "
            "Imam Ahmad, Abu Dawud, At-Tirmidzi, dan An-Nasa'i dengan sanad yang sahih, dari Abu Sa'id "
            "Al-Khudri radhiyallahu 'anhu.",
            # seg 3 — jawaban bagian 2
            "Dan maksud beliau ﷺ adalah: kecuali air yang berubah rasanya, baunya, atau warnanya oleh sesuatu "
            "dari najis-najis, maka ia menjadi najis berdasarkan ijma' para ulama. Adapun sesuatu yang jatuh ke "
            "dalam air, seperti minuman, dedaunan pohon, atau yang semisalnya, maka hal itu tidak menajiskannya "
            "dan tidak menghilangkan sifat thahur-nya selama nama \"air\" masih tetap padanya.",
            # seg 4 — jawaban bagian 3
            "Adapun jika nama air berubah karena sesuatu yang mencampurinya menjadi nama lain, seperti susu, "
            "kopi, teh, dan yang semisalnya, maka dengan itu ia keluar dari nama air dan tidak lagi disebut air; "
            "akan tetapi zatnya sendiri suci dengan campuran tersebut dan tidak menjadi najis karenanya.",
            # seg 5 — jawaban bagian 4 (air muqayyad)
            "Adapun air muqayyad (air yang terikat pada nama tertentu), seperti air mawar, air anggur, dan air "
            "delima, maka ia disebut thahir (suci), tidak disebut thahur, dan bersuci dari hadas dan najis tidak "
            "dapat dilakukan dengannya; karena ia adalah air muqayyad, bukan air mutlak, sehingga dalil-dalil "
            "syariat yang menunjukkan pensucian dengan air tidak mencakupnya. Syariat hanya menyifati air mutlak "
            "dengan sifat menyucikan, seperti air hujan, air laut, sungai-sungai, dan mata air.",
            # seg 6 — penutup
            "Dan Allah-lah Pemberi taufik [1].",
            # seg 7 — atribusi sumber (bagian 1)
            "Pertanyaan yang diajukan oleh 'A.",
            # seg 8 — atribusi sumber (bagian 2)
            "S. dari Riyadh dalam majelis Samahah beliau, (Majmu' Fatawa dan Artikel Syaikh Ibnu Baz 10/14).",
        ],
    },
    # ---- binbaz.org.sa/fatwas/3577 — حكم طهارة الماء دون القلتين إذا خالطته نجاسة (Majmu' Fatawa 10/15)
    "cd912dce-c5ee-4c19-8b47-d5a79b1a119f": {
        "title_ar": "حكم طهارة الماء دون القلتين إذا خالطته نجاسة",
        "title_id": "Hukum Kesucian Air yang Kurang dari Dua Qullah apabila Bercampur Najis",
        "topic": "THA-01",
        "translations": [
            # seg 0 — judul + pertanyaan
            "Hukum Kesucian Air yang Kurang dari Dua Qullah apabila Bercampur Najis\n"
            "Pertanyaan:\n"
            "Air apabila kurang dari dua qullah dan bercampur dengan najis berupa air kencing atau kotoran, "
            "apakah sifat thahur-nya hilang karena hal itu?",
            # seg 1 — jawaban: pendapat pertama
            "Jawaban:\n"
            "Para ulama berbeda pendapat dalam hal itu:\n"
            "Sebagian mereka berpendapat: bahwa air apabila kurang dari dua qullah dan terkena najis, maka ia "
            "menjadi najis karenanya, meskipun tidak berubah warnanya, rasanya, atau baunya; berdasarkan sabda "
            "Nabi ﷺ:\n"
            "\"Apabila air mencapai dua qullah, maka ia tidak mengandung kotoran.\" Dan dalam satu lafaz:\n"
            "\"Ia tidak menjadi najis.\" Diriwayatkan oleh Imam Ahmad dan para penyusun kitab Sunan yang empat, "
            "serta disahihkan oleh Ibnu Khuzaimah, Ibnu Hibban, dan Al-Hakim. Mereka berkata: mafhum (makna "
            "tersirat) hadis ini adalah bahwa air yang kurang dari dua qullah menjadi najis karena najis yang "
            "jatuh ke dalamnya, meskipun ia tidak berubah.",
            # seg 2 — pendapat kedua
            "Dan sebagian ulama lain dari kalangan ahli ilmu berkata: (Penunjukan mafhum itu lemah).",
            # seg 3 — pendapat yang benar
            "Dan yang benar: bahwa air yang kurang dari dua qullah tidak menjadi najis kecuali dengan adanya "
            "perubahan, sama seperti air yang mencapai dua qullah; berdasarkan sabda Nabi ﷺ:\n"
            "\"Sesungguhnya air itu thahur, tidak ada sesuatu pun yang menajiskannya.\" Diriwayatkan oleh Imam "
            "Ahmad, Abu Dawud, At-Tirmidzi, dan An-Nasa'i dengan sanad yang sahih, dari hadis Abu Sa'id Al-Khudri "
            "radhiyallahu 'anhu. Dan Nabi ﷺ menyebutkan dua qullah hanyalah untuk menunjukkan bahwa air yang "
            "kurang dari keduanya memerlukan kepastian, penelaahan, dan perhatian; bukan bahwa ia menjadi najis "
            "secara mutlak; berdasarkan hadis Abu Sa'id yang telah disebutkan.",
            # seg 4 — faedah + hadis anjing
            "Dan dari hal itu dapat diambil faedah: bahwa air yang sangat sedikit pada umumnya terpengaruh oleh "
            "najis, maka hendaknya ia dibuang dan dijauhi; oleh karena itu telah sahih dari beliau ﷺ bahwa beliau "
            "bersabda:\n"
            "\"Apabila seekor anjing menjilat bejana salah seorang di antara kalian, maka buanglah isinya, "
            "kemudian cucilah bejana itu tujuh kali.\" Diriwayatkan oleh Muslim dalam Sahih-nya.",
            # seg 5 — penjelasan + penutup
            "Hal itu tidak lain karena bejana-bejana yang dipakai manusia pada umumnya kecil, terpengaruh oleh "
            "jilatan anjing dan oleh najis-najis meskipun sedikit, maka wajib membuang apa yang ada di dalamnya "
            "apabila ada najis yang jatuh ke dalamnya; sebagai bentuk kehati-hatian dan untuk menolak syubhat; "
            "berdasarkan sabda beliau ﷺ:\n"
            "\"Tinggalkanlah apa yang meragukanmu menuju apa yang tidak meragukanmu.\" Dan sabda beliau ﷺ:\n"
            "\"Barang siapa menjauhi syubhat-syubhat, maka ia telah membersihkan agama dan kehormatannya.\" "
            "Dan Allah-lah Pemberi taufik [1].",
            # seg 6 — atribusi (bagian 1)
            "Pertanyaan yang diajukan oleh 'A.",
            # seg 7 — atribusi (bagian 2)
            "S. dari Riyadh dalam majelis Samahah beliau, (Majmu' Fatawa dan Artikel Syaikh Ibnu Baz 10/15).",
        ],
    },
    # ---- binbaz.org.sa/fatwas/3581 — حكم الوضوء بالماء المخلوط بالكلور (Majmu' Fatawa 10/19)
    "32b05b63-5a00-4d43-b394-ff0684b70581": {
        "title_ar": "حكم الوضوء بالماء المخلوط بالكلور",
        "title_id": "Hukum Berwudu dengan Air yang Bercampur Klorin",
        "topic": "THA-01",
        "translations": [
            # seg 0 — judul + pertanyaan
            "Hukum Berwudu dengan Air yang Bercampur Klorin\n"
            "Pertanyaan:\n"
            "Seorang wanita penanya berkata: Di negeri kami, air minum sering kali bercampur dengan zat klorin "
            "yang membersihkan, yaitu zat yang mengubah warna dan rasa air; apakah hal ini berpengaruh pada "
            "kemampuan air itu menyucikan orang yang berwudu?",
            # seg 1 — lanjutan pertanyaan
            "Berilah kami faedah, semoga Allah memberikan faedah kepada kalian.",
            # seg 2 — jawaban bagian 1
            "Jawaban:\n"
            "Berubahnya air karena zat-zat yang suci dan obat-obatan yang dimasukkan ke dalamnya untuk mencegah "
            "apa yang dapat membahayakan manusia, dengan tetapnya nama air sebagaimana keadaannya, maka hal ini "
            "tidak merusaknya, meskipun terjadi sebagian perubahan karenanya; sebagaimana jika ia berubah karena "
            "lumut yang tumbuh di dalamnya, dedaunan pohon, tanah yang mengenainya, dan yang semisal dengan itu.",
            # seg 3 — jawaban bagian 2
            "Semua ini tidak merusaknya; ia tetap thahur sebagaimana keadaannya. Ia tidak rusak kecuali apabila "
            "berubah oleh sesuatu yang mengeluarkannya dari nama air, hingga menjadikannya sesuatu yang lain, "
            "seperti susu yang dituangkan ke dalam air hingga mengubahnya dan ia menjadi susu, atau menjadi teh, "
            "atau menjadi kuah yang telah keluar dari nama air; maka yang seperti ini tidak sah berwudu dengannya, "
            "karena ia telah keluar dari nama air kepada nama yang lain.",
            # seg 4 — jawaban bagian 3
            "Adapun selama nama air masih tetap dan yang jatuh ke dalamnya hanyalah sesuatu dari zat-zat yang "
            "suci, seperti tanah, jerami, atau selainnya yang tidak menghilangkan nama air darinya, maka hal itu "
            "tidak merusaknya. Adapun najis-najis, maka ia merusaknya apabila berubah rasanya, warnanya, atau "
            "baunya; atau air itu sedikit yang terpengaruh oleh najis meskipun pengaruhnya tidak tampak padanya, "
            "maka ia rusak karenanya dan tidak boleh digunakan [1].",
            # seg 5 — atribusi sumber
            "Program Nur 'ala ad-Darb, kaset nomor 109, (Majmu' Fatawa dan Artikel Syaikh Ibnu Baz 10/19).",
        ],
    },
}


def main():
    material_id = sys.argv[1]
    cfg = DATA[material_id]
    db = SessionLocal()
    try:
        m = db.query(Material).filter(Material.id == material_id).first()
        assert m, "Material tidak ditemukan"
        at = db.query(ArabicText).filter(ArabicText.material_id == m.id).first()
        segs = db.query(TextSegment).filter(TextSegment.arabic_text_id == at.id).order_by(TextSegment.order_index).all()
        assert len(segs) == len(cfg["translations"]), f"Segmen={len(segs)}, terjemahan={len(cfg['translations'])}"

        # Kurasi (patokan v2_curate_imports.py ronde 1).
        m.title_ar = cfg["title_ar"]
        m.title_id = cfg["title_id"]
        m.rights_status = "CLEARED"
        at.is_complete = True
        topic = db.query(Topic).filter(Topic.code == cfg["topic"]).first()
        assert topic, f"Topik {cfg['topic']} tidak ditemukan"
        exists = db.query(MaterialTopic).filter(MaterialTopic.material_id == m.id, MaterialTopic.topic_id == topic.id).first()
        if not exists:
            db.add(MaterialTopic(material_id=m.id, topic_id=topic.id))
        db.commit()
        print(f"kurasi OK: {m.title_id} | topik {cfg['topic']} | rights CLEARED | is_complete=true")

        run = translate_material(db, m, adapter=StaticAgentAdapter(cfg["translations"]))
        db.refresh(m)
        print(f"ai_run: status={run.status} model={run.model} error={run.error}")
        print(f"material: status={m.status} ai_label={'ADA' if m.ai_label == AI_LABEL else 'TIDAK'}")

        admin = db.query(User).filter(User.email == "admin@pustaka.local").first()
        db.add(AuditLog(user_id=admin.id if admin else None, action="TRANSLATE_AGENT_ASSISTED",
                        entity="material", entity_id=m.id,
                        detail="Terjemahan lengkap Ronde 2 oleh agen Muse (model tercatat di ai_runs); "
                               "bukan API eksternal. Hak sumber CLEARED berdasarkan izin footer binbaz.org.sa "
                               "(PERMITTED_WITH_ATTRIBUTION di source_registry)."))
        db.commit()
        from app.models import QualityFinding
        findings = db.query(QualityFinding).filter(QualityFinding.material_id == m.id).all()
        print(f"quality_findings: {len(findings)}")
        for f in findings:
            print(f" - [{f.severity}] {f.rule}: {f.message}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
