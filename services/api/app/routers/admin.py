from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import text as sql_text
from sqlalchemy.orm import Session
from typing import Optional
from ..db import get_db
from ..models import *
from ..config import settings
from ..deps import require_roles, log_audit
from ..services.gate import evaluate_publication
from ..services.importer import import_html, import_pdf
from ..services.ai_adapter import translate_material
from ..services.references import match_references
from ..services.transcription import transcribe_source
from ..services import backup as backup_service

router = APIRouter(prefix="/api/admin", tags=["admin"])
admin_dep = require_roles("super_admin","admin","editor")
editor_admin = require_roles("super_admin","admin")

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user=Depends(admin_dep)):
    mats = db.query(Material).all()
    by_status = {}
    for m in mats: by_status[m.status] = by_status.get(m.status, 0) + 1
    recent = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()
    return {"materials_total": len(mats), "by_status": by_status, "scholars": db.query(Scholar).count(), "topics": db.query(Topic).count(), "sources": db.query(SourceRegistry).count(), "candidates": db.query(Source).filter(Source.status=="DISCOVERED").count(), "awaiting_review": by_status.get("ADMIN_REVIEW",0), "published": by_status.get("PUBLISHED_AI",0), "critical_findings": db.query(QualityFinding).filter(QualityFinding.severity=="CRITICAL").count(), "ai_cost_estimate": 0, "recent_audit": [{"id": a.id, "action": a.action, "entity": a.entity, "entity_id": a.entity_id, "detail": a.detail} for a in recent]}

class SourceIn(BaseModel):
    name: str
    domain: Optional[str] = ""
    scholar_id: Optional[str] = None
    content_type: Optional[str] = ""
    access_method: Optional[str] = "WEB"
    permission_status: Optional[str] = "UNVERIFIED"
    redistribution_policy: Optional[str] = "UNKNOWN"
    crawl_limits: Optional[str] = None
    connector_status: Optional[str] = "UNKNOWN"

def src_dict(s):
    return {"id": s.id, "name": s.name, "domain": s.domain, "scholar_id": s.scholar_id, "content_type": s.content_type, "access_method": s.access_method, "permission_status": s.permission_status, "redistribution_policy": s.redistribution_policy, "crawl_limits": s.crawl_limits, "connector_status": s.connector_status}

@router.get("/sources")
def list_sources(db: Session = Depends(get_db), user=Depends(admin_dep)):
    return [src_dict(s) for s in db.query(SourceRegistry).all()]

@router.post("/sources")
def create_source(body: SourceIn, db: Session = Depends(get_db), user=Depends(admin_dep)):
    s = SourceRegistry(**body.model_dump()); db.add(s); db.commit(); db.refresh(s)
    log_audit(db, user.id, "CREATE_SOURCE", "source_registry", s.id, body.name)
    return src_dict(s)

@router.put("/sources/{sid}")
def update_source(sid: str, body: SourceIn, db: Session = Depends(get_db), user=Depends(admin_dep)):
    s = db.query(SourceRegistry).filter(SourceRegistry.id==sid).first()
    if not s: raise HTTPException(404, "Source tidak ditemukan")
    for k, v in body.model_dump().items(): setattr(s, k, v)
    db.commit(); log_audit(db, user.id, "UPDATE_SOURCE", "source_registry", s.id, body.name)
    return src_dict(s)

@router.delete("/sources/{sid}")
def delete_source(sid: str, db: Session = Depends(get_db), user=Depends(admin_dep)):
    s = db.query(SourceRegistry).filter(SourceRegistry.id==sid).first()
    if s: db.delete(s); db.commit()
    log_audit(db, user.id, "DELETE_SOURCE", "source_registry", sid, "")
    return {"ok": True}

@router.get("/materials")
def list_admin_materials(db: Session = Depends(get_db), user=Depends(admin_dep)):
    return [{"id": m.id, "title_id": m.title_id, "title_ar": m.title_ar, "content_type": m.content_type, "status": m.status, "is_demo": m.is_demo, "rights_status": m.rights_status, "source_url": m.source_url, "scholar_id": m.scholar_id} for m in db.query(Material).all()]

@router.get("/materials/{mid}")
def get_admin_material(mid: str, db: Session = Depends(get_db), user=Depends(admin_dep)):
    m = db.query(Material).filter(Material.id==mid).first()
    if not m: raise HTTPException(404, "Material tidak ditemukan")
    findings = [{"id": f.id, "rule": f.rule, "severity": f.severity, "message": f.message} for f in db.query(QualityFinding).filter(QualityFinding.material_id==mid).all()]
    approvals = [{"id": a.id, "decision": a.decision, "notes": a.notes, "admin_id": a.admin_id} for a in db.query(PublicationApproval).filter(PublicationApproval.material_id==mid).all()]
    arabic = None
    at = db.query(ArabicText).filter(ArabicText.material_id==mid).first()
    if at:
        segs = db.query(TextSegment).filter(TextSegment.arabic_text_id==at.id).order_by(TextSegment.order_index).all()
        arabic = {"full_text": at.full_text, "segments": [{"id": s.id, "order_index": s.order_index, "text_ar": s.text_ar} for s in segs]}
    translation = None
    tr = db.query(Translation).filter(Translation.material_id==mid).order_by(Translation.created_at.desc()).first()
    if tr:
        tsegs = db.query(TranslationSegment).filter(TranslationSegment.translation_id==tr.id).all()
        translation = {"id": tr.id, "status": tr.status, "model": tr.model, "segments": [{"id": t.id, "text_segment_id": t.text_segment_id, "text_id": t.text_id, "version": t.version} for t in tsegs]}
    scholar = None
    if m.scholar_id:
        sch = db.query(Scholar).filter(Scholar.id==m.scholar_id).first()
        if sch: scholar = {"id": sch.id, "name_id": sch.name_id, "name_ar": sch.name_ar}
    return {"id": m.id, "title_id": m.title_id, "title_ar": m.title_ar, "content_type": m.content_type, "status": m.status, "is_demo": m.is_demo, "rights_status": m.rights_status, "source_url": m.source_url, "scholar_id": m.scholar_id, "findings": findings, "approvals": approvals, "arabic": arabic, "translation": translation, "scholar": scholar}

class SegmentPatchIn(BaseModel):
    text_id: str

@router.patch("/materials/{mid}/segments/{text_segment_id}")
def patch_segment(mid: str, text_segment_id: str, body: SegmentPatchIn, db: Session = Depends(get_db), user=Depends(admin_dep)):
    m = db.query(Material).filter(Material.id==mid).first()
    if not m: raise HTTPException(404, "Material tidak ditemukan")
    at = db.query(ArabicText).filter(ArabicText.material_id==mid).first()
    seg = None
    if at:
        seg = db.query(TextSegment).filter(TextSegment.id==text_segment_id, TextSegment.arabic_text_id==at.id).first()
    if not seg: raise HTTPException(404, "Segmen tidak ditemukan pada material ini")
    tr = db.query(Translation).filter(Translation.material_id==mid).order_by(Translation.created_at.desc()).first()
    if not tr:
        tr = Translation(material_id=mid, status="DRAFT", prompt_version="id-ar-v1", model="")
        db.add(tr); db.commit(); db.refresh(tr)
    tseg = db.query(TranslationSegment).filter(TranslationSegment.translation_id==tr.id, TranslationSegment.text_segment_id==text_segment_id).first()
    if tseg:
        tseg.text_id = body.text_id
        tseg.version = (tseg.version or 1) + 1
    else:
        tseg = TranslationSegment(translation_id=tr.id, text_segment_id=text_segment_id, text_id=body.text_id, version=1)
        db.add(tseg)
    db.commit(); db.refresh(tseg)
    maxv = 0
    for v in db.query(MaterialVersion).filter(MaterialVersion.material_id==mid).all():
        maxv = max(maxv, v.version or 0)
    mv = MaterialVersion(material_id=mid, version=maxv+1, notes=f"Edit segmen {text_segment_id} oleh user {user.id}")
    db.add(mv); db.commit(); db.refresh(mv)
    log_audit(db, user.id, "EDIT_SEGMENT", "material", mid, f"segment {text_segment_id} -> version {tseg.version}")
    return {"id": tseg.id, "text_segment_id": tseg.text_segment_id, "text_id": tseg.text_id, "version": tseg.version, "material_version": mv.version}

class NotesIn(BaseModel):
    notes: Optional[str] = ""

@router.post("/materials/{mid}/approve")
def approve(mid: str, body: NotesIn = NotesIn(), db: Session = Depends(get_db), user=Depends(editor_admin)):
    m = db.query(Material).filter(Material.id==mid).first()
    if not m: raise HTTPException(404, "Material tidak ditemukan")
    a = PublicationApproval(material_id=mid, admin_id=user.id, decision="APPROVED", notes=body.notes or "")
    db.add(a); db.commit(); db.refresh(a)
    log_audit(db, user.id, "APPROVE", "material", mid, body.notes or "")
    return {"id": a.id, "decision": a.decision}

@router.post("/materials/{mid}/publish")
def publish(mid: str, db: Session = Depends(get_db), user=Depends(editor_admin)):
    m = db.query(Material).filter(Material.id==mid).first()
    if not m: raise HTTPException(404, "Material tidak ditemukan")
    blockers = evaluate_publication(db, m)
    if blockers:
        return JSONResponse(status_code=422, content={"detail": "Publication gate menolak", "blockers": blockers})
    m.status = "PUBLISHED_AI"; db.commit()
    log_audit(db, user.id, "PUBLISH", "material", mid, "")
    return {"id": m.id, "status": m.status}

@router.post("/materials/{mid}/unpublish")
def unpublish(mid: str, db: Session = Depends(get_db), user=Depends(editor_admin)):
    m = db.query(Material).filter(Material.id==mid).first()
    if not m: raise HTTPException(404, "Material tidak ditemukan")
    m.status = "ADMIN_REVIEW"; db.commit()
    log_audit(db, user.id, "UNPUBLISH", "material", mid, "")
    return {"id": m.id, "status": m.status}

@router.post("/materials/{mid}/reject")
def reject(mid: str, body: NotesIn = NotesIn(), db: Session = Depends(get_db), user=Depends(editor_admin)):
    m = db.query(Material).filter(Material.id==mid).first()
    if not m: raise HTTPException(404, "Material tidak ditemukan")
    m.status = "REJECTED"
    db.add(PublicationApproval(material_id=mid, admin_id=user.id, decision="REJECTED", notes=body.notes or ""))
    db.commit(); log_audit(db, user.id, "REJECT", "material", mid, body.notes or "")
    return {"id": m.id, "status": m.status}

class ImportIn(BaseModel):
    url: str
    scholar_id: Optional[str] = None
    registry_id: Optional[str] = None

@router.post("/acquisition/import")
def do_import(body: ImportIn, db: Session = Depends(get_db), user=Depends(admin_dep)):
    result = import_html(db, body.url, scholar_id=body.scholar_id, registry_id=body.registry_id)
    job = result["job"]
    log_audit(db, user.id, "IMPORT", "material", job.material_id, body.url)
    mat = result.get("material")
    return {"job": {"id": job.id, "url": job.url, "status": job.status, "error": job.error}, "material": ({"id": mat.id, "status": mat.status} if mat else None), "status": result["status"]}

@router.post("/materials/{mid}/translate")
def do_translate(mid: str, db: Session = Depends(get_db), user=Depends(admin_dep)):
    m = db.query(Material).filter(Material.id==mid).first()
    if not m: raise HTTPException(404, "Material tidak ditemukan")
    run = translate_material(db, m)
    log_audit(db, user.id, "TRANSLATE", "material", mid, run.status)
    return {"ai_run": {"id": run.id, "status": run.status, "error": run.error, "model": run.model}}

@router.post("/materials/{mid}/match-references")
def do_match(mid: str, db: Session = Depends(get_db), user=Depends(admin_dep)):
    m = db.query(Material).filter(Material.id==mid).first()
    if not m: raise HTTPException(404, "Material tidak ditemukan")
    created = match_references(db, m)
    log_audit(db, user.id, "MATCH_REFERENCES", "material", mid, str(len(created)))
    return {"matched": len(created), "matches": [{"id": c.id, "matched_text": c.matched_text, "status": c.status} for c in created]}

@router.get("/findings")
def findings(material_id: Optional[str] = None, db: Session = Depends(get_db), user=Depends(admin_dep)):
    q = db.query(QualityFinding)
    if material_id: q = q.filter(QualityFinding.material_id==material_id)
    return [{"id": f.id, "material_id": f.material_id, "rule": f.rule, "severity": f.severity, "message": f.message, "segment_ref": f.segment_ref} for f in q.all()]

@router.get("/audit-logs")
def audit_logs(db: Session = Depends(get_db), user=Depends(admin_dep)):
    return [{"id": a.id, "user_id": a.user_id, "action": a.action, "entity": a.entity, "entity_id": a.entity_id, "detail": a.detail} for a in db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()]

def _iso(dt):
    return dt.isoformat() if dt else None

@router.get("/processing")
def processing(db: Session = Depends(get_db), user=Depends(admin_dep)):
    acq = db.query(AcquisitionJob).order_by(AcquisitionJob.created_at.desc()).limit(200).all()
    proc = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).limit(200).all()
    return {
        "acquisition_jobs": [{"id": j.id, "url": j.url, "status": j.status, "error": j.error, "material_id": j.material_id, "registry_id": j.registry_id, "created_at": _iso(j.created_at)} for j in acq],
        "processing_jobs": [{"id": j.id, "material_id": j.material_id, "job_type": j.job_type, "status": j.status, "error": j.error, "detail": j.detail, "created_at": _iso(j.created_at)} for j in proc],
    }

@router.get("/ai-runs")
def ai_runs(db: Session = Depends(get_db), user=Depends(admin_dep)):
    runs = db.query(AIRun).order_by(AIRun.created_at.desc()).limit(200).all()
    by_status = {}
    for r in runs: by_status[r.status] = by_status.get(r.status, 0) + 1
    # totals dihitung dari seluruh run, bukan hanya halaman 200 terakhir
    all_runs = db.query(AIRun).all()
    by_status_all = {}
    for r in all_runs: by_status_all[r.status] = by_status_all.get(r.status, 0) + 1
    return {
        "runs": [{"id": r.id, "material_id": r.material_id, "model": r.model, "prompt_version": r.prompt_version, "status": r.status, "error": r.error, "cost_estimate": r.cost_estimate, "tokens_input": r.tokens_input or 0, "tokens_output": r.tokens_output or 0, "created_at": _iso(r.created_at)} for r in runs],
        "totals": {"runs": len(all_runs), "cost_estimate": sum((r.cost_estimate or 0) for r in all_runs), "tokens_input": sum((r.tokens_input or 0) for r in all_runs), "tokens_output": sum((r.tokens_output or 0) for r in all_runs), "by_status": by_status_all},
    }

@router.get("/publication")
def publication(db: Session = Depends(get_db), user=Depends(admin_dep)):
    items = []
    for m in db.query(Material).all():
        approvals = [{"id": a.id, "decision": a.decision, "admin_id": a.admin_id, "notes": a.notes, "created_at": _iso(a.created_at)} for a in db.query(PublicationApproval).filter(PublicationApproval.material_id==m.id).all()]
        if m.status == "PUBLISHED_AI":
            items.append({"material_id": m.id, "title_id": m.title_id, "status": m.status, "rights_status": m.rights_status, "is_demo": m.is_demo, "blockers": [], "published": True, "approvals": approvals})
        else:
            items.append({"material_id": m.id, "title_id": m.title_id, "status": m.status, "rights_status": m.rights_status, "is_demo": m.is_demo, "blockers": evaluate_publication(db, m), "approvals": approvals})
    return {"items": items}

@router.get("/reports/summary")
def reports_summary(db: Session = Depends(get_db), user=Depends(admin_dep)):
    materials_by_status = {}
    materials_by_scholar = {}
    for m in db.query(Material).all():
        materials_by_status[m.status] = materials_by_status.get(m.status, 0) + 1
        if m.scholar_id:
            sch = db.query(Scholar).filter(Scholar.id==m.scholar_id).first()
            name = sch.name_id if sch else m.scholar_id
            materials_by_scholar[name] = materials_by_scholar.get(name, 0) + 1
    materials_by_topic = {}
    for mt in db.query(MaterialTopic).all():
        t = db.query(Topic).filter(Topic.id==mt.topic_id).first()
        if t: materials_by_topic[t.code] = materials_by_topic.get(t.code, 0) + 1
    findings_by_severity = {}
    for f in db.query(QualityFinding).all():
        findings_by_severity[f.severity] = findings_by_severity.get(f.severity, 0) + 1
    all_runs = db.query(AIRun).all()
    acq_by = {}
    for j in db.query(AcquisitionJob).all(): acq_by[j.status] = acq_by.get(j.status, 0) + 1
    proc_by = {}
    for j in db.query(ProcessingJob).all(): proc_by[j.status] = proc_by.get(j.status, 0) + 1
    return {
        "materials_by_status": materials_by_status,
        "materials_by_scholar": materials_by_scholar,
        "materials_by_topic": materials_by_topic,
        "findings_by_severity": findings_by_severity,
        "ai": {"runs": len(all_runs), "cost_estimate": sum((r.cost_estimate or 0) for r in all_runs), "tokens_input": sum((r.tokens_input or 0) for r in all_runs), "tokens_output": sum((r.tokens_output or 0) for r in all_runs)},
        "jobs": {"acquisition_by_status": acq_by, "processing_by_status": proc_by},
    }

@router.get("/ai-settings")
def ai_settings(db: Session = Depends(get_db), user=Depends(admin_dep)):
    return {
        "ai_api_base_configured": bool(settings.ai_api_base),
        "ai_api_key_configured": bool(settings.ai_api_key),
        "ai_model": settings.ai_model,
        "ai_cost_limit": settings.ai_cost_limit,
        "celery_eager": bool(settings.celery_task_always_eager),
        "redis_configured": bool(settings.redis_url),
    }

class GlossaryIn(BaseModel):
    term_ar: str
    term_id: str
    context: Optional[str] = ""

def _glossary_dict(g):
    return {"id": g.id, "term_ar": g.term_ar, "term_id": g.term_id, "context": g.context, "created_at": _iso(g.created_at), "updated_at": _iso(g.updated_at)}

@router.get("/glossary")
def list_glossary(db: Session = Depends(get_db), user=Depends(admin_dep)):
    return [_glossary_dict(g) for g in db.query(GlossaryTerm).order_by(GlossaryTerm.created_at).all()]

@router.post("/glossary", status_code=201)
def create_glossary(body: GlossaryIn, db: Session = Depends(get_db), user=Depends(editor_admin)):
    g = GlossaryTerm(term_ar=body.term_ar, term_id=body.term_id, context=body.context or "")
    db.add(g); db.commit(); db.refresh(g)
    log_audit(db, user.id, "CREATE_GLOSSARY", "glossary_term", g.id, body.term_ar)
    return _glossary_dict(g)

@router.put("/glossary/{gid}")
def update_glossary(gid: str, body: GlossaryIn, db: Session = Depends(get_db), user=Depends(editor_admin)):
    g = db.query(GlossaryTerm).filter(GlossaryTerm.id==gid).first()
    if not g: raise HTTPException(404, "Glossary term tidak ditemukan")
    g.term_ar = body.term_ar; g.term_id = body.term_id; g.context = body.context or ""
    db.commit(); db.refresh(g)
    log_audit(db, user.id, "UPDATE_GLOSSARY", "glossary_term", g.id, body.term_ar)
    return _glossary_dict(g)

@router.delete("/glossary/{gid}")
def delete_glossary(gid: str, db: Session = Depends(get_db), user=Depends(editor_admin)):
    g = db.query(GlossaryTerm).filter(GlossaryTerm.id==gid).first()
    if g: db.delete(g); db.commit()
    log_audit(db, user.id, "DELETE_GLOSSARY", "glossary_term", gid, "")
    return {"ok": True}

@router.get("/system")
def system_info(db: Session = Depends(get_db), user=Depends(admin_dep)):
    dialect = None
    ok = False
    try:
        dialect = db.bind.dialect.name if db.bind is not None else None
        db.execute(sql_text("SELECT 1"))
        ok = True
    except Exception:
        ok = False
    return {
        "app_version": "1.0.0",
        "database": {"dialect": dialect, "ok": ok},
        "worker_mode": "eager" if settings.celery_task_always_eager else "redis",
        "backups": backup_service.list_backups(),
    }

@router.post("/system/backup")
def system_backup(db: Session = Depends(get_db), user=Depends(editor_admin)):
    result = backup_service.create_backup()
    log_audit(db, user.id, "BACKUP_CREATED", "system", None, result["file"])
    return {"file": result["file"], "size_bytes": result["size_bytes"]}

@router.post("/acquisition/import-pdf")
async def do_import_pdf(file: UploadFile = File(...), scholar_id: Optional[str] = Form(None), registry_id: Optional[str] = Form(None), db: Session = Depends(get_db), user=Depends(admin_dep)):
    data = await file.read()
    result = import_pdf(db, data, filename=file.filename or "upload.pdf", scholar_id=scholar_id, registry_id=registry_id)
    job = result["job"]
    log_audit(db, user.id, "IMPORT_PDF", "material", job.material_id, file.filename or "")
    mat = result.get("material")
    return {"job": {"id": job.id, "url": job.url, "status": job.status, "error": job.error}, "material": ({"id": mat.id, "status": mat.status} if mat else None), "status": result["status"]}

@router.post("/acquisition/transcribe/{source_id}")
def do_transcribe(source_id: str, db: Session = Depends(get_db), user=Depends(admin_dep)):
    src = db.query(Source).filter(Source.id==source_id).first()
    if not src: raise HTTPException(404, "Source tidak ditemukan")
    job = transcribe_source(db, src)
    log_audit(db, user.id, "TRANSCRIBE", "source", source_id, job.status)
    return {"job": {"id": job.id, "material_id": job.material_id, "job_type": job.job_type, "status": job.status, "error": job.error, "detail": job.detail}, "status": job.status}
