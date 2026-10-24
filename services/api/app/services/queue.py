"""Durable, deduplicated task queue. Publication always remains a separate action."""
from datetime import datetime, timezone, timedelta
import hashlib
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from ..db import SessionLocal
from ..models import ContentTask, Material, SourceRegistry


def enqueue(db, *, kind, url="", material_id=None, registry_id=None, scholar_id=None):
    identity = url if kind == "IMPORT" else material_id
    if kind == "TRANSLATE":
        from ..models import ArabicText, GlossaryTerm
        from ..config import settings
        from .ai_adapter import PROMPT_VERSION
        import json
        source = [r.full_text for r in db.query(ArabicText).filter_by(material_id=material_id).order_by(ArabicText.id)]
        glossary = [list(r) for r in db.query(GlossaryTerm.term_ar, GlossaryTerm.term_id).order_by(GlossaryTerm.id)]
        identity = json.dumps([material_id, source, glossary, settings.ai_model, PROMPT_VERSION], ensure_ascii=False)
    key = hashlib.sha256(f"{kind}:{identity}".encode()).hexdigest()
    existing = db.query(ContentTask).filter_by(dedup_key=key).first()
    if existing:
        return existing
    row = ContentTask(dedup_key=key, kind=kind, url=url, material_id=material_id,
                      registry_id=registry_id, scholar_id=scholar_id)
    db.add(row)
    try:
        db.commit(); db.refresh(row)
    except IntegrityError:
        db.rollback()
        row = db.query(ContentTask).filter_by(dedup_key=key).one()
    return row


def claim(db):
    now = datetime.now(timezone.utc)
    candidate = db.query(ContentTask).filter(ContentTask.status.in_(["PENDING", "RETRY"]),
                        ContentTask.available_at <= now).order_by(ContentTask.available_at, ContentTask.id).first()
    if not candidate:
        return None
    task_id = candidate.id
    changed = db.execute(update(ContentTask).where(ContentTask.id == task_id,
                         ContentTask.status.in_(["PENDING", "RETRY"]), ContentTask.available_at <= now)
                         .values(status="RUNNING", attempts=ContentTask.attempts + 1)
                         .execution_options(synchronize_session=False))
    db.commit()
    if changed.rowcount != 1:
        return None
    db.expire_all()
    return db.get(ContentTask, task_id)


def run_one():
    with SessionLocal() as db:
        task = claim(db)
        if not task:
            return None
        task_id = task.id
        try:
            if task.kind == "IMPORT":
                from .importer import import_html, assert_safe_url
                registry = db.get(SourceRegistry, task.registry_id)
                if not registry:
                    raise ValueError("Registry sumber tidak ditemukan")
                assert_safe_url(task.url, allowed_domains=[registry.domain])
                result = import_html(db, task.url, registry_id=task.registry_id, scholar_id=task.scholar_id)
                if result["status"] not in ("COMPLETED", "DUPLICATE"):
                    raise RuntimeError(result["job"].error or result["status"])
                task.material_id = result["job"].material_id
                task.status = "COMPLETED"
            elif task.kind == "TRANSLATE":
                from ..config import settings
                if not settings.ai_api_key:
                    task.status = "BLOCKED"
                    task.error = "AI_API_KEY belum dikonfigurasi; tidak ada terjemahan dibuat"
                    db.commit()
                    return task_id
                from .ai_adapter import translate_material
                material = db.get(Material, task.material_id)
                if not material:
                    raise ValueError("Materi tidak ditemukan")
                run = translate_material(db, material)
                if run.status != "COMPLETED":
                    raise RuntimeError(run.error or "Penerjemahan gagal")
                task.status = "COMPLETED"
            else:
                raise ValueError("Jenis task tidak dikenal")
            task.error = ""
            db.commit()
        except Exception as exc:
            db.rollback()
            task = db.get(ContentTask, task_id)
            task.error = str(exc)[:2000]
            task.status = "FAILED" if task.attempts >= task.max_attempts else "RETRY"
            task.available_at = datetime.now(timezone.utc) + timedelta(seconds=min(3600, 30 * 2 ** task.attempts))
            db.commit()
        return task_id
