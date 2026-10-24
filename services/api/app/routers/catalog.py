from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..db import get_db
from ..deps import require_roles
from ..services.catalog import page

router = APIRouter(tags=["catalog"])


@router.get("/api/catalog/materials")
def materials(q: str = Query("", max_length=200), scholar_id: str | None = None,
              topic_id: str | None = None, content_type: str | None = None,
              offset: int = Query(0, ge=0), limit: int = Query(24, ge=1, le=100),
              db: Session = Depends(get_db)):
    return page(db, q=q, scholar_id=scholar_id, topic_id=topic_id,
                content_type=content_type, offset=offset, limit=limit)


@router.get("/api/admin/catalog/materials")
def admin_materials(q: str = Query("", max_length=200), scholar_id: str | None = None,
                    status: str | None = None, offset: int = Query(0, ge=0),
                    limit: int = Query(25, ge=1, le=100), db: Session = Depends(get_db),
                    user=Depends(require_roles("super_admin", "admin", "editor"))):
    return page(db, q=q, scholar_id=scholar_id, status=status, offset=offset, limit=limit, admin=True)
