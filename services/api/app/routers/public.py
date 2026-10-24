from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..db import get_db
from ..models import Scholar, Topic, Issue, IssueMaterial, Material, ArabicText, TextSegment, Translation, TranslationSegment, QualityFinding, ReferenceMatch, MaterialTopic, GlossaryTerm, CorrectionReport
from ..deps import get_optional_user, role_name
from ..services.search import expand_query, normalize_text
from ..services.ai_adapter import AI_LABEL

router = APIRouter(prefix="/api", tags=["public"])

def scholar_brief(db, s):
    if not s: return None
    return {"id": s.id, "name_id": s.name_id, "name_ar": s.name_ar}

def material_brief(db, m):
    sch = db.query(Scholar).filter(Scholar.id == m.scholar_id).first() if m.scholar_id else None
    topics = []
    for mt in db.query(MaterialTopic).filter(MaterialTopic.material_id == m.id).all():
        t = db.query(Topic).filter(Topic.id == mt.topic_id).first()
        if t: topics.append(t.code)
    return {"id": m.id, "title_id": m.title_id, "title_ar": m.title_ar, "scholar": scholar_brief(db, sch), "content_type": m.content_type, "status": m.status, "topics": topics, "is_demo": m.is_demo}

@router.get("/scholars")
def list_scholars(db: Session = Depends(get_db)):
    return [{"id": s.id, "name_id": s.name_id, "name_ar": s.name_ar, "birth_year_h": s.birth_year_h, "death_year_h": s.death_year_h, "death_year_m": s.death_year_m, "bio_id": s.bio_id} for s in db.query(Scholar).all()]

@router.get("/topics")
def list_topics(db: Session = Depends(get_db)):
    return [{"id": t.id, "code": t.code, "name_id": t.name_id, "name_ar": t.name_ar, "parent_id": t.parent_id, "description_id": t.description_id} for t in db.query(Topic).order_by(Topic.code).all()]

@router.get("/issues")
def list_issues(db: Session = Depends(get_db)):
    return [{"id": i.id, "code": i.code, "title_id": i.title_id, "description_id": i.description_id, "topic_id": i.topic_id} for i in db.query(Issue).all()]

@router.get("/issues/{issue_id}")
def get_issue(issue_id: str, db: Session = Depends(get_db)):
    i = db.query(Issue).filter(Issue.id == issue_id).first()
    if not i: raise HTTPException(404, "Persoalan tidak ditemukan")
    topic = None
    if i.topic_id:
        t = db.query(Topic).filter(Topic.id == i.topic_id).first()
        if t: topic = {"id": t.id, "code": t.code, "name_id": t.name_id, "name_ar": t.name_ar}
    mats = []
    for im in db.query(IssueMaterial).filter(IssueMaterial.issue_id == i.id).all():
        m = db.query(Material).filter(Material.id == im.material_id, Material.status == "PUBLISHED_AI").first()
        if m: mats.append(material_brief(db, m))
    return {
        "id": i.id, "code": i.code, "title_id": i.title_id, "description_id": i.description_id,
        "topic_id": i.topic_id, "topic": topic, "materials": mats,
        "materials_status": "TERTAUT" if mats else "MENUNGGU_MATERI_SUMBER: belum ada materi terbit yang benar-benar membahas persoalan ini dan lolos gerbang publikasi.",
    }

@router.get("/glossary")
def list_glossary(db: Session = Depends(get_db)):
    return [{"id": g.id, "term_ar": g.term_ar, "term_id": g.term_id, "context": g.context} for g in db.query(GlossaryTerm).order_by(GlossaryTerm.term_id).all()]

@router.get("/glossary/{term}")
def get_glossary_term(term: str, db: Session = Depends(get_db)):
    g = db.query(GlossaryTerm).filter(GlossaryTerm.id == term).first()
    if not g:
        g = db.query(GlossaryTerm).filter(or_(GlossaryTerm.term_id.ilike(term), GlossaryTerm.term_ar == term)).first()
    if not g: raise HTTPException(404, "Istilah tidak ditemukan")
    return {"id": g.id, "term_ar": g.term_ar, "term_id": g.term_id, "context": g.context}

class CorrectionIn(BaseModel):
    material_id: str
    segment_id: Optional[str] = None
    name: Optional[str] = ""
    message: str

@router.post("/correction-reports", status_code=201)
def create_correction_report(body: CorrectionIn, db: Session = Depends(get_db)):
    # Rate limit sederhana global /api/* sudah ditegakkan middleware di main.py.
    msg = (body.message or "").strip()
    if len(msg) < 5 or len(msg) > 2000:
        raise HTTPException(422, "Isi laporan harus 5–2000 karakter")
    m = db.query(Material).filter(Material.id == body.material_id).first()
    if not m: raise HTTPException(404, "Material tidak ditemukan")
    r = CorrectionReport(material_id=body.material_id, text_segment_id=body.segment_id or None,
                           reporter_name=(body.name or "")[:120], message=msg, status="PENDING")
    db.add(r); db.commit(); db.refresh(r)
    return {"id": r.id, "status": r.status}

@router.get("/materials")
def list_materials(db: Session = Depends(get_db)):
    mats = db.query(Material).filter(Material.status == "PUBLISHED_AI").all()
    return [material_brief(db, m) for m in mats]

@router.get("/materials/{material_id}")
def get_material(material_id: str, db: Session = Depends(get_db), user=Depends(get_optional_user)):
    m = db.query(Material).filter(Material.id == material_id).first()
    if not m: raise HTTPException(404, "Material tidak ditemukan")
    is_admin = False
    if user:
        is_admin = role_name(db, user) in ("super_admin","admin","editor")
    if m.status != "PUBLISHED_AI" and not is_admin:
        raise HTTPException(404, "Material tidak ditemukan")
    at = db.query(ArabicText).filter(ArabicText.material_id == m.id).first()
    arabic = None
    if at:
        segs = db.query(TextSegment).filter(TextSegment.arabic_text_id == at.id).order_by(TextSegment.order_index).all()
        arabic = {"full_text": at.full_text, "segments": [{"id": s.id, "order_index": s.order_index, "text_ar": s.text_ar} for s in segs]}
    tr = db.query(Translation).filter(Translation.material_id == m.id).first()
    translation = None
    if tr:
        tsegs = db.query(TranslationSegment).filter(TranslationSegment.translation_id == tr.id).all()
        translation = {"status": tr.status, "segments": [{"text_segment_id": t.text_segment_id, "text_id": t.text_id} for t in tsegs]}
    findings = [{"rule": f.rule, "severity": f.severity, "message": f.message} for f in db.query(QualityFinding).filter(QualityFinding.material_id == m.id).all()]
    refs = [{"id": r.id, "matched_text": r.matched_text, "reference_type": r.reference_type, "status": r.status} for r in db.query(ReferenceMatch).filter(ReferenceMatch.material_id == m.id).all()]
    base = material_brief(db, m)
    base.update({"arabic": arabic, "translation": translation, "ai_label": m.ai_label or AI_LABEL, "source_url": m.source_url, "findings": findings, "references": refs})
    return base

def _search_fts(db: Session, q: str):
    """Jalur FTS PostgreSQL: materials.search_vector / arabic_texts.search_vector
    dicocokkan dengan plainto_tsquery('simple', :q). Mengembalikan list Material
    atau None bila kolom FTS tidak ada (pemanggil fallback ke logika lama)."""
    from sqlalchemy import text as sql_text
    try:
        rows = db.execute(sql_text(
            "SELECT m.id FROM materials m "
            "LEFT JOIN arabic_texts a ON a.material_id = m.id "
            "WHERE m.status = 'PUBLISHED_AI' AND ("
            "m.search_vector @@ plainto_tsquery('simple', :q) "
            "OR a.search_vector @@ plainto_tsquery('simple', :q))"
        ), {"q": q}).fetchall()
    except Exception:
        db.rollback()
        return None
    ids = [r[0] for r in rows]
    if not ids:
        return []
    mats = db.query(Material).filter(Material.id.in_(ids)).all()
    by_id = {m.id: m for m in mats}
    return [by_id[i] for i in ids if i in by_id]

@router.get("/search")
def search(q: str = Query(""), db: Session = Depends(get_db)):
    if db.bind is not None and db.bind.dialect.name == "postgresql":
        fts_mats = _search_fts(db, q)
        if fts_mats:
            return {"query": q, "results": [material_brief(db, m) for m in fts_mats], "total": len(fts_mats)}
        # FTS kosong -> lanjut ke fallback sinonim/normalisasi (V2 BAGIAN 14):
        # tanpa ini, variasi ejaan (wudhu, salat) dan istilah Arab tidak pernah cocok.
    terms = expand_query(q)
    mats = db.query(Material).filter(Material.status == "PUBLISHED_AI").all()
    results = []
    for m in mats:
        at = db.query(ArabicText).filter(ArabicText.material_id == m.id).first()
        tr = db.query(Translation).filter(Translation.material_id == m.id).first()
        id_text = ""
        if tr:
            id_text = " ".join(t.text_id or "" for t in db.query(TranslationSegment).filter(TranslationSegment.translation_id == tr.id).all())
        hay = " ".join([m.title_id or "", m.title_ar or "", at.full_text if at else "", id_text])
        hay_n = normalize_text(hay); hay_l = hay.lower()
        if any(t.lower() in hay_l or normalize_text(t) in hay_n for t in terms if t):
            results.append(material_brief(db, m))
    return {"query": q, "results": results, "total": len(results)}
