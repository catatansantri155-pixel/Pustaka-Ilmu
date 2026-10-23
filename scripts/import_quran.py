#!/usr/bin/env python3
"""Impor dataset Qur'an tervalidasi-struktur dari fawazahmed0/quran-api (jsDelivr CDN).

Validasi SEBELUM menulis apa pun:
- total ayat kedua edisi == 6236
- jumlah bab == 114
- per bab: jumlah ayat edisi == len(info.chapters[i].verses)
- himpunan (chapter, verse) Arab == Indonesia
Gagal salah satu -> print alasan, exit 1, tidak menulis apa pun.

DATABASE_URL dari env (default sqlite:///<repo>/services/api/pustaka.db).
"""
import os
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "services" / "api"))
os.environ.setdefault("DATABASE_URL", f"sqlite:///{REPO}/services/api/pustaka.db")

import httpx  # noqa: E402

INFO_URL = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/info.min.json"
AR_URL = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranuthmanihaf.min.json"
ID_URL = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ind-indonesianislam.min.json"

SOURCE = "fawazahmed0/quran-api via jsDelivr CDN"
EDITION_AR = "ara-quranuthmanihaf (Quran Uthmani Hafs, King Fahd Complex)"
TRANSLATOR_ID = "Indonesian Islamic Affairs Ministry (Kemenag) via QuranEnc — ind-indonesianislam"


def fail(msg: str):
    print(f"VALIDASI GAGAL: {msg}")
    sys.exit(1)


def download(url: str):
    # Pakai sanitasi no_proxy dari importer API: entri IPv6 berkurung siku di
    # no_proxy lingkungan ini membuat httpx gagal parse (Invalid port ':1]').
    from app.services.importer import _sanitized_proxy_env
    with _sanitized_proxy_env():
        with httpx.Client(trust_env=True, timeout=120, follow_redirects=True) as client:
            r = client.get(url)
            r.raise_for_status()
            return r.json()


def main():
    print("Mengunduh info + edisi Arab + edisi Indonesia ...")
    info = download(INFO_URL)
    ar_data = download(AR_URL)
    id_data = download(ID_URL)

    chapters = info.get("chapters") or info.get("suras") or []
    ar_verses = ar_data.get("quran") or []
    id_verses = id_data.get("quran") or []

    # --- VALIDASI (sebelum menulis apa pun) ---
    if len(ar_verses) != 6236:
        fail(f"total ayat edisi Arab {len(ar_verses)} != 6236")
    if len(id_verses) != 6236:
        fail(f"total ayat edisi Indonesia {len(id_verses)} != 6236")
    if len(chapters) != 114:
        fail(f"jumlah bab info {len(chapters)} != 114")

    def per_chapter(verses):
        counts = {}
        keys = set()
        for v in verses:
            ch, vs = int(v["chapter"]), int(v["verse"])
            counts[ch] = counts.get(ch, 0) + 1
            keys.add((ch, vs))
        return counts, keys

    ar_counts, ar_keys = per_chapter(ar_verses)
    id_counts, id_keys = per_chapter(id_verses)
    for i, ch in enumerate(chapters):
        expected = len(ch["verses"])
        num = int(ch.get("chapter", i + 1))
        if ar_counts.get(num, 0) != expected:
            fail(f"bab {num}: ayat Arab {ar_counts.get(num, 0)} != info.verses {expected}")
        if id_counts.get(num, 0) != expected:
            fail(f"bab {num}: ayat Indonesia {id_counts.get(num, 0)} != info.verses {expected}")
    if ar_keys != id_keys:
        fail("himpunan (chapter, verse) Arab != Indonesia")
    print("Validasi lolos: 6236 ayat, 114 bab, per-bab cocok, kunci Arab == Indonesia.")

    # --- TULIS (idempoten: hapus baris edisi yang sama dulu) ---
    from app.db import Base, engine, SessionLocal
    from app.models import QuranVerse, QuranTranslation
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        old_verses = db.query(QuranVerse).filter(QuranVerse.edition == EDITION_AR).all()
        old_ids = [v.id for v in old_verses]
        if old_ids:
            db.query(QuranTranslation).filter(
                QuranTranslation.verse_id.in_(old_ids),
                QuranTranslation.translator == TRANSLATOR_ID).delete(synchronize_session=False)
            db.query(QuranVerse).filter(QuranVerse.id.in_(old_ids)).delete(synchronize_session=False)
            db.commit()
        id_text_by_key = {(int(v["chapter"]), int(v["verse"])): v["text"] for v in id_verses}
        chapters_by_num = {int(ch.get("chapter", i + 1)): ch for i, ch in enumerate(chapters)}
        total_v = 0
        total_t = 0
        current_chapter = None
        for v in ar_verses:
            ch_num, vs_num = int(v["chapter"]), int(v["verse"])
            if ch_num != current_chapter:
                if current_chapter is not None:
                    db.commit()
                current_chapter = ch_num
            ch_info = chapters_by_num[ch_num]
            verse = QuranVerse(
                surah_id=ch_num,
                surah_name_ar=ch_info.get("arabicname", ""),
                surah_name_id=ch_info.get("name", ""),
                ayah_number=vs_num,
                text_ar=v["text"],
                source=SOURCE,
                edition=EDITION_AR,
                validation_status="VALIDATED_STRUCTURE",
            )
            db.add(verse); db.flush()
            db.add(QuranTranslation(verse_id=verse.id, text_id=id_text_by_key[(ch_num, vs_num)], translator=TRANSLATOR_ID))
            total_v += 1
            total_t += 1
        db.commit()
        c1 = db.query(QuranVerse).filter(QuranVerse.surah_id == 1).count()
        c114 = db.query(QuranVerse).filter(QuranVerse.surah_id == 114).count()
        total_db = db.query(QuranVerse).filter(QuranVerse.edition == EDITION_AR).count()
        total_tr_db = db.query(QuranTranslation).filter(QuranTranslation.translator == TRANSLATOR_ID).count()
        print(f"Ringkasan: total ayat tertulis {total_v} (di DB edisi ini: {total_db}), total terjemahan tertulis {total_t} (di DB: {total_tr_db})")
        print(f"Contoh hitung: bab 1 = {c1} ayat, bab 114 = {c114} ayat")
    finally:
        db.close()


if __name__ == "__main__":
    main()
