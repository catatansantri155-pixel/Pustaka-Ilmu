#!/usr/bin/env python3
"""Proses pilot 1 materi: terjemahan agen + metadata + bukti dalil.

Terjemahan di bawah ini dibuat OLEH AGEN Muse (bukan API eksternal) untuk materi
pilot Bin Baz dari https://binbaz.org.sa/fatwas/3785 (kanonis: /fatwas/977/...).
Jalur data yang dipakai adalah jalur aplikasi sendiri: services translate_material()
membuat AIRun + Translation + TranslationSegment dan menjalankan quality audit.
Model dicatat jujur lewat env AI_MODEL="claude-agent-assisted-claude-sonnet"
(agen Muse yang beroperasi di dalam Muse, bukan penyedia API eksternal).

Jalankan dari services/api:  ../../.venv/bin/python ../../scripts/process_pilot.py <material_id>
"""
import os
import sys

os.environ.setdefault("AI_MODEL", "claude-agent-assisted-claude-sonnet")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "services", "api"))

from app.db import SessionLocal                      # noqa: E402
from app.models import (Material, ArabicText, TextSegment, EvidenceMention,  # noqa: E402
                        AuditLog, User)
from app.services.ai_adapter import translate_material, AI_LABEL  # noqa: E402

# Terjemahan setia per segmen (urutan = order_index segmen hasil impor).
# Prinsip: lengkap, tanpa ringkasan, tanpa tambahan hukum/dalil, negasi & syarat dipertahankan.
TRANSLATIONS = [
    # seg 0 — judul + pertanyaan (bagian 1)
    "Penilaian atas hadis: 'Sesungguhnya Allah kagum kepada seorang pemuda yang tidak memiliki shabwah'.\n"
    "Pertanyaan:\n"
    "Sejauh mana kesahihan hadis yang berbunyi:\n"
    "Sesungguhnya Allah kagum kepada seorang pemuda yang tidak memiliki shabwah\n"
    "?",
    # seg 1 — pertanyaan (bagian 2)
    "Saya juga memohon penjelasan tentang perkiraan usia dimulainya masa muda, dan berakhirnya masa itu?",
    # seg 2 — jawaban (bagian 1)
    "Jawaban:\n"
    "Hadis ini masyhur, dan saya tidak mengetahui keadaan sanadnya sekarang. Sesungguhnya Allah kagum kepada "
    "seorang pemuda yang tidak memiliki shabwah, yakni ia tidak memiliki apa yang dilakukan oleh anak-anak, "
    "apa yang dilakukan oleh para pemuda berupa terjerumus ke dalam kemaksiatan dan dosa-dosa pada awal usia "
    "mereka, maka ia sejak tumbuh berada dalam ibadah kepada Allah dan ketaatan kepada Allah; ia tidak memiliki "
    "shabwah, ia tidak memiliki masa-masa ketika ia menyimpang dari petunjuk disebabkan masa muda, maka ia "
    "adalah tempat kekaguman dari Allah.",
    # seg 3 — jawaban (bagian 2)
    "Akan tetapi saya tidak mengetahui sekarang keadaan hadis ini, apakah sanadnya baik atau tidak?",
    # seg 4 — jawaban (bagian 3)
    "Hadis itu masyhur dan dikenal; akan tetapi sekarang saya tidak mengetahui keadaan sanadnya, dan semoga "
    "saya memperhatikannya -insya Allah- dan akan saya jelaskan pada Jumat berikutnya, insya Allah.",
    # seg 5 — pertanyaan kedua
    "Pertanyaan:\n"
    "Kapan masa muda dimulai dan kapan berakhir?",
    # seg 6 — jawaban kedua
    "Jawaban:\n"
    "Yang tampak, maksud dari hal itu adalah awal masa muda, yaitu masa remaja, kemudian setelahnya adalah "
    "masa balig, yakni tahun-tahun pertama dari usianya pada masa remaja, dan setelahnya.",
]

TITLE_AR = "الحكم على حديث: «إن الله يعجب لشاب ليس له صبوة»"
TITLE_ID = "Penilaian Hadis: Sesungguhnya Allah Kagum kepada Pemuda yang Tidak Memiliki Shabwah"


class StaticAgentAdapter:
    """Adapter yang mengembalikan terjemahan agen yang sudah disiapkan (bukan API)."""

    def __init__(self, translations):
        self._t = translations

    def translate_segments(self, segments):
        assert len(segments) == len(self._t), f"Jumlah segmen berubah: {len(segments)} != {len(self._t)}"
        return list(self._t)


def main():
    material_id = sys.argv[1]
    db = SessionLocal()
    try:
        m = db.query(Material).filter(Material.id == material_id).first()
        assert m, "Material tidak ditemukan"
        at = db.query(ArabicText).filter(ArabicText.material_id == m.id).first()
        segs = db.query(TextSegment).filter(TextSegment.arabic_text_id == at.id).order_by(TextSegment.order_index).all()
        assert len(segs) == len(TRANSLATIONS), f"Segmen={len(segs)}, terjemahan={len(TRANSLATIONS)}"

        # Metadata jujur sesuai isi halaman sumber.
        m.title_ar = TITLE_AR
        m.title_id = TITLE_ID
        # Hak: footer resmi binbaz.org.sa membolehkan penyalinan dengan atribusi;
        # atribusi diterapkan lewat source_url yang tampil di detail publik.
        m.rights_status = "CLEARED"
        db.commit()

        run = translate_material(db, m, adapter=StaticAgentAdapter(TRANSLATIONS))
        db.refresh(m)
        print(f"ai_run: status={run.status} model={run.model} error={run.error}")
        print(f"material: status={m.status} ai_label={'ADA' if m.ai_label == AI_LABEL else 'TIDAK'}")

        # Bukti yang disebut DI DALAM fatwa itu sendiri (bukan dalil tambahan dari luar).
        hadith_text = "إن الله يعجب لشاب ليس له صبوة"
        exists = db.query(EvidenceMention).filter(EvidenceMention.material_id == m.id,
                                                  EvidenceMention.mention_text == hadith_text).first()
        if not exists:
            db.add(EvidenceMention(material_id=m.id, mention_text=hadith_text,
                                    evidence_type="HADITH", is_displayed_as_fact=False))
        admin = db.query(User).filter(User.email == "admin@pustaka.local").first()
        db.add(AuditLog(user_id=admin.id if admin else None, action="TRANSLATE_AGENT_ASSISTED",
                        entity="material", entity_id=m.id,
                        detail="Terjemahan lengkap oleh agen Muse (model tercatat di ai_runs); "
                               "bukan API eksternal. Hak sumber CLEARED berdasarkan izin footer binbaz.org.sa."))
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
