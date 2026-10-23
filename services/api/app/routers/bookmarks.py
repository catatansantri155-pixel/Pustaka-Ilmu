from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Bookmark, ReadingHistory, User
from ..deps import get_current_user

router = APIRouter(prefix="/api", tags=["bookmarks"])
class BMIn(BaseModel):
    material_id: str

@router.post("/bookmarks")
def add_bookmark(body: BMIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ex = db.query(Bookmark).filter(Bookmark.user_id==user.id, Bookmark.material_id==body.material_id).first()
    if ex: return {"id": ex.id, "material_id": ex.material_id}
    b = Bookmark(user_id=user.id, material_id=body.material_id); db.add(b); db.commit(); db.refresh(b)
    return {"id": b.id, "material_id": b.material_id}

@router.get("/bookmarks")
def list_bookmarks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [{"id": b.id, "material_id": b.material_id} for b in db.query(Bookmark).filter(Bookmark.user_id==user.id).all()]

@router.delete("/bookmarks/{material_id}")
def del_bookmark(material_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    b = db.query(Bookmark).filter(Bookmark.user_id==user.id, Bookmark.material_id==material_id).first()
    if b: db.delete(b); db.commit()
    return {"ok": True}

@router.post("/reading-history")
def add_history(body: BMIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    h = ReadingHistory(user_id=user.id, material_id=body.material_id); db.add(h); db.commit(); db.refresh(h)
    return {"id": h.id, "material_id": h.material_id}

@router.get("/reading-history")
def list_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [{"id": h.id, "material_id": h.material_id} for h in db.query(ReadingHistory).filter(ReadingHistory.user_id==user.id).all()]
