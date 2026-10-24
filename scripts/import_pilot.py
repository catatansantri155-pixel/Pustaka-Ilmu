"""Load the verified 30-source snapshot as review drafts, never publish automatically.

Usage: DATABASE_URL=... python scripts/import_pilot.py [--verify-online]
Run app.migrate first. Reruns skip canonical fatwa IDs already in the DB.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services/api"))
from app.db import SessionLocal
from app.models import (Material, Scholar, SourceRegistry, Source, SourceAsset, ArabicText,
                        TextSegment, Translation, TranslationSegment, MaterialTopic, Topic,
                        AIRun, QualityFinding, Citation, AuditLog)
from app.services.ai_adapter import AI_LABEL
from app.services.audit import audit_translation
from app.services.catalog import index_material

MANIFEST = ROOT / "database/seeds/pilot/thaharah_30.json"


def load_pilot(db, manifest, verify_online=False):
    rows = manifest["materials"]
    if len(rows) != 30 or len({r["fatwa_number"] for r in rows}) != 30:
        raise ValueError("Pilot wajib berisi tepat 30 nomor fatwa yang unik")
    # Validate the entire batch before touching a single row.
    for row in rows:
        if urlsplit(row["source_url"]).hostname != "binbaz.org.sa":
            raise ValueError("Domain sumber tidak sesuai")
        if hashlib.sha256(row["text_ar"].encode()).hexdigest() != row["sha256"]:
            raise ValueError("Checksum sumber tidak cocok")
        if "\n\n".join(s["text_ar"] for s in row["segments"]) != row["text_ar"]:
            raise ValueError("Segmen Arab tidak mencakup snapshot lengkap")
        if any(not s["text_ar"].strip() or not s["text_id"].strip() for s in row["segments"]):
            raise ValueError("Segmen kosong")
        if verify_online:
            from app.services.importer import fetch_url
            from bs4 import BeautifulSoup
            html, final = fetch_url(row["source_url"], allowed_domains=["binbaz.org.sa"])
            soup = BeautifulSoup(html, "html.parser")
            article = soup.select_one("article.fatwa")
            body = article.select_one('[itemprop="articleBody"]') if article else None
            question = article.select_one('[itemprop="alternativeHeadline"]') if article else None
            if body is None:
                raise ValueError("Artikel sumber tidak ditemukan")
            text = (question.get_text(" ", strip=True) + "\n\n" if question else "") + body.get_text(" ", strip=True)
            if text != row["text_ar"]:
                raise ValueError(f"Sumber berubah; verifikasi ulang diperlukan: {row['fatwa_number']}")
            if manifest["permission_evidence"]["excerpt_ar"] not in soup.get_text(" ", strip=True):
                raise ValueError("Bukti izin penyalinan tidak lagi ditemukan")
    scholar = db.query(Scholar).filter(Scholar.name_id == "Bin Baz").first()
    if not scholar:
        raise ValueError("Jalankan seed dasar terlebih dahulu (ulama Bin Baz belum ada)")
    registry = db.query(SourceRegistry).filter(SourceRegistry.domain == "binbaz.org.sa").first()
    if not registry:
        raise ValueError("Registry Bin Baz belum tersedia")
    topics = {t.code: t for t in db.query(Topic)}
    if any(row["topic_code"] not in topics for row in rows):
        raise ValueError("Topik pilot belum lengkap")
    existing_urls = [r[0] for r in db.query(Material.source_url) if r[0]]
    existing_numbers = {u.split("/fatwas/")[1].split("/")[0] for u in existing_urls if "binbaz.org.sa/fatwas/" in u}
    imported = skipped = findings_count = 0
    for row in rows:
        if row["fatwa_number"] in existing_numbers:
            skipped += 1
            continue
        # All source verification/permission evidence retained. Final publication is separate.
        mat = Material(scholar_id=scholar.id, title_id=row["title_id"], title_ar=row["title_ar"],
                       source_url=row["source_url"], status="ADMIN_REVIEW", rights_status="UNKNOWN", ai_label=AI_LABEL)
        db.add(mat); db.flush()
        source = Source(material_id=mat.id, registry_id=registry.id, url=row["source_url"],
                        title=row["title_ar"], status="IMPORTED",
                        notes=json.dumps({"permission_evidence": manifest["permission_evidence"],
                                          "source_checked_at": row["source_checked_at"],
                                          "extraction_scope": row["extraction_scope"]}, ensure_ascii=False))
        db.add(source); db.flush()
        db.add(SourceAsset(source_id=source.id, material_id=mat.id, url=row["source_url"],
                           checksum=row["sha256"], raw_text=row["text_ar"], mime_type="text/plain"))
        at = ArabicText(material_id=mat.id, full_text=row["text_ar"], is_complete=True)
        db.add(at); db.flush()
        run = AIRun(material_id=mat.id, model="codex-agent-assisted", prompt_version="pilot-id-ar-2026-10-24",
                    status="COMPLETED")
        db.add(run); db.flush()
        tr = Translation(material_id=mat.id, model=run.model, prompt_version=run.prompt_version,
                         status="ADMIN_REVIEW", ai_run_id=run.id)
        db.add(tr); db.flush()
        for i, pair in enumerate(row["segments"]):
            seg = TextSegment(arabic_text_id=at.id, order_index=i, text_ar=pair["text_ar"])
            db.add(seg); db.flush()
            db.add(TranslationSegment(translation_id=tr.id, text_segment_id=seg.id, text_id=pair["text_id"]))
        for f in audit_translation([(s["text_ar"], s["text_id"]) for s in row["segments"]]):
            findings_count += 1
            db.add(QualityFinding(material_id=mat.id, ai_run_id=run.id, **f))
        for footnote in row["footnotes"]:
            db.add(Citation(material_id=mat.id, text=footnote, evidence=row["source_url"], is_displayed_as_fact=False))
        db.add(MaterialTopic(material_id=mat.id, topic_id=topics[row["topic_code"]].id))
        db.add(AuditLog(action="IMPORT_PILOT_DRAFT", entity="material", entity_id=mat.id,
                        detail="Source snapshot + AI-assisted translation; no human review, no approval, rights require admin confirmation"))
        index_material(db, mat)
        imported += 1
    db.commit()
    return {"imported_drafts": imported, "skipped_existing": skipped,
            "quality_findings": findings_count, "published": 0}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify-online", action="store_true")
    args = parser.parse_args()
    with SessionLocal() as db:
        print(json.dumps(load_pilot(db, json.loads(MANIFEST.read_text()), args.verify_online), ensure_ascii=False))
