#!/usr/bin/env python3
"""Kurasi data 3 materi impor Bin Baz (Fase F V2) — dijalankan sekali, tercatat.

Yang dilakukan (dan alasannya):
- title_ar/title_id dirapikan: importer V1 menaruh seluruh teks mentah sebagai judul.
- arabic_texts.is_complete = true: set segmen terverifikasi utuh (soal + jawaban +
  penutup + atribusi sumber Majmu' Fatawa Ibnu Baz jilid 10) terhadap halaman asal.
- materials.rights_status = 'CLEARED': domain binbaz.org.sa tercatat di source_registry
  sebagai PERMITTED_WITH_ATTRIBUTION dengan bukti footer resmi situs; materi wajib
  menampilkan URL sumber asli (atribusi) — gate publikasi tetap memeriksa sisanya.
- material_topics ditautkan: THA-01 (Air) untuk dua fatwa air, THA-03 (Istinja) untuk Zamzam.
Tidak menyentuh status publikasi — persetujuan & penerbitan lewat endpoint admin + gate.
"""
import re, sys
sys.path.insert(0, "services/api")
env = open("services/api/.env").read()
url = re.search(r"^DATABASE_URL=(.+)$", env, re.M).group(1).strip()
from sqlalchemy import create_engine, text

FIX = {
    "3cd40e22-cf23-4c7f-96ff-2a1931e6e6f0": ("الوضوء من الماء المكدر بالطين والأعشاب", "Berwudu dari Air yang Keruh karena Lumpur dan Rerumputan", "THA-01"),
    "591f6c43-8fc1-4936-9038-ef8b61a2443f": ("حكم الوضوء بالبترول", "Hukum Berwudu dengan Minyak Bumi (Bensin)", "THA-01"),
    "4cd30fea-99b7-454f-a26c-a29ef8ae902a": ("حكم الاستنجاء بماء زمزم", "Hukum Istinja dengan Air Zamzam", "THA-03"),
}
e = create_engine(url)
with e.begin() as c:
    for mid, (tar, tid, tcode) in FIX.items():
        c.execute(text("UPDATE materials SET title_ar=:a, title_id=:i, rights_status='CLEARED' WHERE id=:m"), {"a": tar, "i": tid, "m": mid})
        c.execute(text("UPDATE arabic_texts SET is_complete=true WHERE material_id=:m"), {"m": mid})
        c.execute(text("""INSERT INTO material_topics (id, material_id, topic_id)
                          SELECT gen_random_uuid()::text, CAST(:m AS varchar), t.id FROM topics t WHERE t.code=:tc
                          AND NOT EXISTS (SELECT 1 FROM material_topics mt WHERE mt.material_id=CAST(:m AS varchar) AND mt.topic_id=t.id)"""), {"m": mid, "tc": tcode})
        print("terkurasi:", mid, tid)
print("selesai")
