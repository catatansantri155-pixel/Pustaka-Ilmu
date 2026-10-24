"""Editorial management; all mutations are audited and require editorial roles."""
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from ..db import get_db
from ..deps import require_roles, log_audit
from ..models import (Scholar, Topic, Issue, Material, MaterialTopic, IssueMaterial,
                      CorrectionReport, PublicationApproval)

router = APIRouter(prefix="/api/admin", tags=["editorial"])
read = require_roles("super_admin", "admin", "editor")
write = require_roles("super_admin", "admin", "editor")


class EditorialIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ScholarIn(EditorialIn):
    name_id: str = Field(min_length=1, max_length=200)
    name_ar: str = Field(default="", max_length=300)
    birth_year_h: str | None = None
    death_year_h: str | None = None
    death_year_m: str | None = None
    bio_id: str = Field(default="", max_length=20000)


class TopicIn(EditorialIn):
    code: str = Field(min_length=1, max_length=80)
    name_id: str = Field(min_length=1, max_length=300)
    name_ar: str = Field(default="", max_length=300)
    parent_id: str | None = None
    description_id: str = Field(default="", max_length=20000)


class IssueIn(EditorialIn):
    code: str = Field(min_length=1, max_length=80)
    title_id: str = Field(min_length=1, max_length=500)
    description_id: str = Field(default="", max_length=20000)
    topic_id: str | None = None


SCHEMAS = {"scholars": ScholarIn, "topics": TopicIn, "issues": IssueIn}
MODELS = {"scholars": Scholar, "topics": Topic, "issues": Issue}


def serialize(row):
    return {column.name: getattr(row, column.name) for column in row.__table__.columns}


def commit(db):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Kode sudah dipakai atau relasi data tidak valid")


def validate_relations(db, kind, data, row_id=None):
    if kind == "topics":
        parent = data.get("parent_id")
        seen = {row_id} if row_id else set()
        while parent:
            if parent in seen:
                raise HTTPException(422, "Hierarki topik tidak boleh membentuk siklus")
            seen.add(parent)
            row = db.get(Topic, parent)
            if not row:
                raise HTTPException(422, "Topik induk tidak ditemukan")
            parent = row.parent_id
    if kind == "issues" and data.get("topic_id") and not db.get(Topic, data["topic_id"]):
        raise HTTPException(422, "Topik tidak ditemukan")


# Explicit typed routes keep OpenAPI and request validation usable by clients.
def add_resource_routes(kind, schema, model):
    def listing(db: Session = Depends(get_db), user=Depends(read)):
        return [serialize(row) for row in db.query(model).order_by(model.created_at, model.id).all()]

    def create(body, db: Session = Depends(get_db), user=Depends(write)):
        data = body.model_dump()
        validate_relations(db, kind, data)
        row = model(**data)
        db.add(row); commit(db); db.refresh(row)
        log_audit(db, user.id, "CREATE", kind, row.id)
        return serialize(row)

    def update(row_id: str, body, db: Session = Depends(get_db), user=Depends(write)):
        row = db.get(model, row_id)
        if not row:
            raise HTTPException(404, "Data tidak ditemukan")
        data = body.model_dump()
        validate_relations(db, kind, data, row_id)
        for key, value in data.items():
            setattr(row, key, value)
        commit(db)
        # Scholar/topic names participate in the search document.
        from ..services.catalog import rebuild_for_classification
        rebuild_for_classification(db, kind, row_id)
        log_audit(db, user.id, "UPDATE", kind, row.id)
        return serialize(row)

    create.__annotations__["body"] = schema
    update.__annotations__["body"] = schema
    router.add_api_route(f"/{kind}", listing, methods=["GET"], name=f"list_{kind}")
    router.add_api_route(f"/{kind}", create, methods=["POST"], status_code=201, name=f"create_{kind}")
    router.add_api_route(f"/{kind}/{{row_id}}", update, methods=["PUT"], name=f"update_{kind}")


for kind, model in MODELS.items():
    add_resource_routes(kind, SCHEMAS[kind], model)


class MetadataIn(EditorialIn):
    title_id: str = Field(min_length=1, max_length=500)
    title_ar: str = Field(default="", max_length=1000)
    scholar_id: str | None = None
    topic_ids: list[str] = Field(default_factory=list, max_length=30)
    issue_ids: list[str] = Field(default_factory=list, max_length=50)


@router.get("/materials/{mid}/metadata")
def metadata(mid: str, db: Session = Depends(get_db), user=Depends(read)):
    row = db.get(Material, mid)
    if not row:
        raise HTTPException(404, "Materi tidak ditemukan")
    return {"title_id": row.title_id, "title_ar": row.title_ar, "scholar_id": row.scholar_id,
            "topic_ids": [r.topic_id for r in db.query(MaterialTopic).filter_by(material_id=mid)],
            "issue_ids": [r.issue_id for r in db.query(IssueMaterial).filter_by(material_id=mid)]}


@router.put("/materials/{mid}/metadata")
def update_metadata(mid: str, body: MetadataIn, db: Session = Depends(get_db), user=Depends(write)):
    row = db.query(Material).filter_by(id=mid).with_for_update().first()
    if not row:
        raise HTTPException(404, "Materi tidak ditemukan")
    if body.scholar_id and not db.get(Scholar, body.scholar_id):
        raise HTTPException(422, "Ulama tidak ditemukan")
    for model, ids in ((Topic, body.topic_ids), (Issue, body.issue_ids)):
        if len(set(ids)) != len(ids) or db.query(model).filter(model.id.in_(ids)).count() != len(ids):
            raise HTTPException(422, "Relasi topik/persoalan tidak ditemukan atau duplikat")
    row.title_id, row.title_ar, row.scholar_id = body.title_id, body.title_ar, body.scholar_id
    row.status = "ADMIN_REVIEW"
    for model in (MaterialTopic, IssueMaterial):
        db.query(model).filter_by(material_id=mid).delete()
    db.add_all([MaterialTopic(material_id=mid, topic_id=i) for i in body.topic_ids])
    db.add_all([IssueMaterial(material_id=mid, issue_id=i) for i in body.issue_ids])
    db.flush()
    from ..services.catalog import index_material
    index_material(db, row)
    commit(db)
    log_audit(db, user.id, "UPDATE_METADATA", "material", mid)
    return metadata(mid, db, user)


class CorrectionDecision(EditorialIn):
    status: Literal["IN_REVIEW", "RESOLVED", "DISMISSED"]
    notes: str = Field(min_length=5, max_length=2000)


@router.get("/correction-reports")
def corrections(status: str | None = None, offset: int = Query(0, ge=0),
                limit: int = Query(25, ge=1, le=100), db: Session = Depends(get_db), user=Depends(read)):
    q = db.query(CorrectionReport)
    if status:
        q = q.filter(CorrectionReport.status == status)
    total = q.count()
    rows = q.order_by(CorrectionReport.created_at.desc(), CorrectionReport.id).offset(offset).limit(limit).all()
    return {"items": [serialize(row) for row in rows], "total": total, "offset": offset, "limit": limit}


@router.patch("/correction-reports/{report_id}")
def decide_correction(report_id: str, body: CorrectionDecision,
                      db: Session = Depends(get_db), user=Depends(write)):
    row = db.get(CorrectionReport, report_id)
    if not row:
        raise HTTPException(404, "Laporan tidak ditemukan")
    if row.status in ("RESOLVED", "DISMISSED") and body.status != "IN_REVIEW":
        raise HTTPException(409, "Buka kembali laporan sebelum mengganti keputusan akhir")
    row.status = body.status
    commit(db)
    log_audit(db, user.id, "CORRECTION_DECISION", "correction_report", row.id,
              f"{body.status}: {body.notes}")
    return serialize(row)

class VerificationIn(EditorialIn):
    arabic_complete: bool
    rights_evidence: str = Field(min_length=10, max_length=2000)
    notes: str = Field(min_length=10, max_length=2000)


@router.post("/materials/{mid}/verification")
def verify_material(mid: str, body: VerificationIn, db: Session = Depends(get_db),
                    user=Depends(require_roles("super_admin", "admin"))):
    import re
    from ..models import ArabicText, TextSegment
    row = db.query(Material).filter_by(id=mid).with_for_update().first()
    if not row or row.is_demo:
        raise HTTPException(422, "Materi tidak ditemukan atau merupakan demo")
    ats = db.query(ArabicText).filter_by(material_id=mid).all()
    if len(ats) != 1:
        raise HTTPException(422, "Materi harus memiliki satu teks Arab lengkap")
    at = ats[0]
    segments = db.query(TextSegment).filter_by(arabic_text_id=at.id).order_by(TextSegment.order_index).all()
    normalize = lambda text: re.sub(r"\s+", " ", text or "").strip()
    if body.arabic_complete and (not segments or normalize(" ".join(s.text_ar for s in segments)) != normalize(at.full_text)):
        raise HTTPException(422, "Segmen belum mencakup keseluruhan teks Arab")
    at.is_complete = body.arabic_complete
    row.rights_status = "CLEARED"
    row.status = "ADMIN_REVIEW"
    commit(db)
    log_audit(db, user.id, "VERIFY_SOURCE_RIGHTS", "material", mid,
              f"arabic_complete={body.arabic_complete}; evidence={body.rights_evidence}; {body.notes}")
    return {"material_id": mid, "is_complete": at.is_complete, "rights_status": row.rights_status}


class QualityReviewIn(EditorialIn):
    rule: str = Field(min_length=1, max_length=100)
    segment_ref: str = Field(default="", max_length=100)
    notes: str = Field(min_length=10, max_length=2000)


@router.post("/materials/{mid}/quality-review")
def review_finding(mid: str, body: QualityReviewIn, db: Session = Depends(get_db),
                   user=Depends(require_roles("super_admin", "admin"))):
    from ..models import QualityReview, QualityFinding
    from ..services.gate import content_fingerprint, current_findings
    row = db.query(Material).filter_by(id=mid).with_for_update().first()
    if not row:
        raise HTTPException(404, "Materi tidak ditemukan")
    current = current_findings(db, row)
    matched = [f for f in current if f["rule"] == body.rule and str(f.get("segment_ref") or "") == body.segment_ref]
    if not matched or any(f["severity"] == "CRITICAL" for f in matched):
        raise HTTPException(422, "Hanya temuan heuristik aktif non-CRITICAL dapat ditelaah")
    review = QualityReview(material_id=mid, content_hash=content_fingerprint(db, row),
                           rule=body.rule, segment_ref=body.segment_ref, reviewer_id=user.id, notes=body.notes)
    db.add(review); commit(db)
    log_audit(db, user.id, "QUALITY_REVIEW", "material", mid, f"{body.rule}/{body.segment_ref}: {body.notes}")
    return {"id": review.id, "content_hash": review.content_hash}
