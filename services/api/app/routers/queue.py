from typing import Literal
from urllib.parse import urlsplit, urlunsplit
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import ContentTask, Material, SourceRegistry, now
from ..deps import require_roles, log_audit
from ..services.queue import enqueue
from ..services.importer import assert_safe_url

router = APIRouter(prefix="/api/admin/queue", tags=["queue"])
admin = require_roles("super_admin", "admin", "editor")


class EnqueueIn(BaseModel):
    kind: Literal["IMPORT", "TRANSLATE"]
    url: str = Field(default="", max_length=2000)
    registry_id: str | None = None
    material_id: str | None = None


def task_dict(task):
    return {key: getattr(task, key) for key in ("id", "kind", "url", "material_id", "registry_id",
            "status", "attempts", "max_attempts", "available_at", "error", "created_at")}


@router.post("", status_code=201)
def add(body: EnqueueIn, db: Session = Depends(get_db), user=Depends(admin)):
    scholar_id = None
    url = ""
    if body.kind == "IMPORT":
        registry = db.get(SourceRegistry, body.registry_id) if body.registry_id else None
        if not registry or not registry.domain:
            raise HTTPException(422, "Pilih registry sumber yang memiliki domain")
        try:
            assert_safe_url(body.url, allowed_domains=[registry.domain])
        except ValueError as exc:
            raise HTTPException(422, str(exc))
        parsed = urlsplit(body.url)
        if parsed.username or parsed.password:
            raise HTTPException(422, "URL tidak boleh memuat kredensial")
        import httpx
        url = str(httpx.URL(urlunsplit((parsed.scheme, parsed.netloc.lower(), parsed.path.rstrip("/"), parsed.query, ""))))
        scholar_id = registry.scholar_id
    elif not body.material_id or not db.get(Material, body.material_id):
        raise HTTPException(422, "Materi tidak ditemukan")
    task = enqueue(db, kind=body.kind, url=url, material_id=body.material_id,
                   registry_id=body.registry_id if body.kind == "IMPORT" else None, scholar_id=scholar_id)
    log_audit(db, user.id, "ENQUEUE", "content_task", task.id)
    return task_dict(task)


@router.get("")
def listing(offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100),
            db: Session = Depends(get_db), user=Depends(admin)):
    q = db.query(ContentTask)
    return {"items": [task_dict(row) for row in q.order_by(ContentTask.created_at.desc(), ContentTask.id).offset(offset).limit(limit)],
            "total": q.count(), "offset": offset, "limit": limit}


@router.post("/{task_id}/retry")
def retry(task_id: str, db: Session = Depends(get_db), user=Depends(admin)):
    task = db.query(ContentTask).filter_by(id=task_id).with_for_update().first()
    if not task:
        raise HTTPException(404, "Task tidak ditemukan")
    if task.status not in ("FAILED", "BLOCKED"):
        raise HTTPException(409, "Hanya task gagal/terblokir yang dapat diulang manual")
    task.status, task.attempts, task.error, task.available_at = "PENDING", 0, "", now()
    db.commit()
    log_audit(db, user.id, "RETRY", "content_task", task.id)
    return task_dict(task)
