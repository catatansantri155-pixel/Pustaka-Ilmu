"""Publication checks and approval binding to an exact content snapshot."""
import hashlib
import json
import re
from sqlalchemy.orm import Session
from ..models import (Material, Source, ArabicText, TextSegment, Translation,
                      TranslationSegment, QualityFinding, PublicationApproval,
                      Citation, ReferenceMatch, MaterialTopic, IssueMaterial, QualityReview)
from .audit import audit_translation


def content_fingerprint(db: Session, material: Material) -> str:
    """Changes to text, attribution, evidence or classification invalidate approval."""
    db.flush()
    payload = {"material": [material.title_id, material.title_ar, material.scholar_id,
                           material.source_url, material.rights_status, material.is_demo,
                           material.content_type, material.ai_label]}
    specs = [
        (Source, ["url", "registry_id"], Source.material_id == material.id),
        (ArabicText, ["id", "full_text", "is_complete"], ArabicText.material_id == material.id),
        (Translation, ["id", "model", "prompt_version"], Translation.material_id == material.id),
        (Citation, ["text", "evidence", "is_displayed_as_fact"], Citation.material_id == material.id),
        (ReferenceMatch, ["matched_text", "evidence", "status", "is_displayed_as_fact"], ReferenceMatch.material_id == material.id),
        (MaterialTopic, ["topic_id"], MaterialTopic.material_id == material.id),
        (IssueMaterial, ["issue_id"], IssueMaterial.material_id == material.id),
    ]
    for model, fields, predicate in specs:
        payload[model.__tablename__] = sorted(
            [[getattr(row, key) for key in fields] for row in db.query(model).filter(predicate)],
            key=lambda row: json.dumps(row, ensure_ascii=False, default=str))
    ats = db.query(ArabicText.id).filter(ArabicText.material_id == material.id)
    trs = db.query(Translation.id).filter(Translation.material_id == material.id)
    payload["segments"] = [list(r) for r in db.query(TextSegment.id, TextSegment.order_index, TextSegment.text_ar)
                           .filter(TextSegment.arabic_text_id.in_(ats)).order_by(TextSegment.id)]
    payload["translations"] = [list(r) for r in db.query(TranslationSegment.text_segment_id,
                               TranslationSegment.text_id, TranslationSegment.version)
                               .filter(TranslationSegment.translation_id.in_(trs)).order_by(TranslationSegment.id)]
    return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def current_findings(db, material):
    at = db.query(ArabicText).filter_by(material_id=material.id).first()
    tr = db.query(Translation).filter_by(material_id=material.id).first()
    if not at or not tr:
        return []
    segs = db.query(TextSegment).filter_by(arabic_text_id=at.id).order_by(TextSegment.order_index).all()
    by_id = {t.text_segment_id: t.text_id for t in db.query(TranslationSegment).filter_by(translation_id=tr.id)}
    return audit_translation([(s.text_ar, by_id.get(s.id, "")) for s in segs], at.full_text)


def evaluate_publication(db: Session, material: Material) -> list[str]:
    blockers = []
    fingerprint = content_fingerprint(db, material)
    reviewed = {(r.rule, r.segment_ref) for r in db.query(QualityReview).filter_by(material_id=material.id, content_hash=fingerprint)}
    if material.is_demo:
        blockers.append("Materi demo tidak boleh diterbitkan")
    has_source = db.query(Source).filter(Source.material_id == material.id, Source.url != "").first()
    if not (material.source_url or "").strip() and not has_source:
        blockers.append("Tidak ada sumber: source_url kosong dan tidak ada tautan sources")
    if material.rights_status != "CLEARED":
        blockers.append(f"Hak cipta belum CLEARED (status: {material.rights_status})")
    ats = db.query(ArabicText).filter(ArabicText.material_id == material.id).all()
    at = ats[0] if len(ats) == 1 else None
    if not at or not (at.full_text or "").strip():
        blockers.append("Teks Arab tidak ada, kosong, atau memiliki versi ambigu")
    elif not at.is_complete:
        blockers.append("Teks Arab tidak lengkap (is_complete=false)")
    segs = db.query(TextSegment).filter(TextSegment.arabic_text_id == at.id).order_by(TextSegment.order_index).all() if at else []
    if not segs or any(not (s.text_ar or "").strip() for s in segs):
        blockers.append("Segmen Arab tidak ada atau kosong")
    normalize = lambda value: re.sub(r"\s+", " ", value or "").strip()
    if at and normalize(" ".join(s.text_ar for s in segs)) != normalize(at.full_text):
        blockers.append("Segmen Arab tidak mencakup keseluruhan teks sumber")
    if len({s.order_index for s in segs}) != len(segs):
        blockers.append("Urutan segmen Arab duplikat")
    trs = db.query(Translation).filter(Translation.material_id == material.id).all()
    if len(trs) != 1:
        blockers.append("Terjemahan tidak ada atau memiliki versi ambigu")
    else:
        tsegs = db.query(TranslationSegment).filter(TranslationSegment.translation_id == trs[0].id).all()
        seg_ids = {s.id for s in segs}
        covered = {t.text_segment_id for t in tsegs}
        if covered != seg_ids or len(tsegs) != len(segs):
            blockers.append("Segmen terjemahan hilang, duplikat, atau berasal dari materi lain")
        if not tsegs or any(not (t.text_id or "").strip() for t in tsegs):
            blockers.append("Ada segmen terjemahan kosong")
        by_id = {t.text_segment_id: t.text_id for t in tsegs}
        for f in audit_translation([(s.text_ar, by_id.get(s.id, "")) for s in segs], at.full_text if at else ""):
            if f["severity"] == "CRITICAL" or (f["severity"] == "HIGH" and (f["rule"], str(f.get("segment_ref") or "")) not in reviewed):
                blockers.append(f"Audit teks terkini: {f['rule']} — {f['message']}")
    crit = db.query(QualityFinding).filter(QualityFinding.material_id == material.id, QualityFinding.severity == "CRITICAL").first()
    if crit:
        blockers.append(f"Ada temuan kualitas CRITICAL: {crit.rule} - {crit.message}")
    for model in (Citation, ReferenceMatch):
        for row in db.query(model).filter(model.material_id == material.id):
            if row.is_displayed_as_fact and not (row.evidence or "").strip():
                blockers.append("Kutipan/referensi ditampilkan sebagai fakta tanpa bukti")
    latest = db.query(PublicationApproval).filter(PublicationApproval.material_id == material.id).order_by(
        PublicationApproval.created_at.desc(), PublicationApproval.id.desc()).first()
    if not latest or latest.decision != "APPROVED":
        blockers.append("Belum ada persetujuan publikasi terbaru (PublicationApproval APPROVED)")
    elif not latest.content_hash or latest.content_hash != content_fingerprint(db, material):
        blockers.append("Persetujuan kedaluwarsa: setujui ulang versi materi terkini")
    return list(dict.fromkeys(blockers))
