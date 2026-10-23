from sqlalchemy.orm import Session
from ..models import Material, Source, ArabicText, TextSegment, Translation, TranslationSegment, QualityFinding, PublicationApproval, Citation, ReferenceMatch

def evaluate_publication(db: Session, material: Material) -> list[str]:
    blockers = []
    has_source_link = db.query(Source).filter(Source.material_id == material.id).first() is not None
    if not (material.source_url and material.source_url.strip()) and not has_source_link:
        blockers.append("Tidak ada sumber: source_url kosong dan tidak ada tautan sources")
    if material.rights_status != "CLEARED":
        blockers.append(f"Hak cipta belum CLEARED (status: {material.rights_status})")
    at = db.query(ArabicText).filter(ArabicText.material_id == material.id).first()
    if not at or not (at.full_text or "").strip():
        blockers.append("Teks Arab tidak ada atau kosong")
    elif not at.is_complete:
        blockers.append("Teks Arab tidak lengkap (is_complete=false)")
    segs = []
    if at:
        segs = db.query(TextSegment).filter(TextSegment.arabic_text_id == at.id).all()
    tr = db.query(Translation).filter(Translation.material_id == material.id).first()
    if not tr:
        blockers.append("Terjemahan tidak ada")
    else:
        tsegs = db.query(TranslationSegment).filter(TranslationSegment.translation_id == tr.id).all()
        if segs and len(tsegs) < len(segs):
            blockers.append(f"Segmen terjemahan hilang: {len(tsegs)}/{len(segs)} segmen")
        seg_ids = {s.id for s in segs}
        covered = {t.text_segment_id for t in tsegs}
        if seg_ids - covered:
            blockers.append("Ada segmen Arab tanpa pasangan terjemahan")
    crit = db.query(QualityFinding).filter(QualityFinding.material_id == material.id, QualityFinding.severity == "CRITICAL").first()
    if crit:
        blockers.append(f"Ada temuan kualitas CRITICAL: {crit.rule} - {crit.message}")
    for c in db.query(Citation).filter(Citation.material_id == material.id).all():
        if c.is_displayed_as_fact and not (c.evidence or "").strip():
            blockers.append("Kutipan ditampilkan sebagai fakta tanpa bukti (evidence kosong)")
    for r in db.query(ReferenceMatch).filter(ReferenceMatch.material_id == material.id).all():
        if r.is_displayed_as_fact and not (r.evidence or "").strip():
            blockers.append("Referensi kandidat ditampilkan sebagai fakta tanpa bukti")
    appr = db.query(PublicationApproval).filter(PublicationApproval.material_id == material.id, PublicationApproval.decision == "APPROVED").first()
    if not appr:
        blockers.append("Belum ada persetujuan publikasi (PublicationApproval APPROVED)")
    return blockers
