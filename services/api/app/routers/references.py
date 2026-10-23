from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from ..db import get_db
from ..models import QuranVerse, HadithRecord, Work
from ..deps import require_roles, log_audit

router = APIRouter(tags=["references"])
admin_dep = require_roles("super_admin","admin","editor")

class QuranIn(BaseModel):
    surah_id: int = 0
    surah_name_ar: Optional[str] = ""
    surah_name_id: Optional[str] = ""
    ayah_number: int = 0
    text_ar: Optional[str] = ""
    source: Optional[str] = ""
    edition: Optional[str] = ""
    validation_status: Optional[str] = "UNVERIFIED"

class HadithIn(BaseModel):
    matan_ar: Optional[str] = ""
    translation_id_text: Optional[str] = ""
    narrator: Optional[str] = ""
    collection: Optional[str] = ""
    book: Optional[str] = ""
    chapter: Optional[str] = ""
    hadith_number: Optional[str] = ""
    numbering_scheme: Optional[str] = ""
    reference_url: Optional[str] = ""
    match_status: Optional[str] = "UNVERIFIED"

class WorkIn(BaseModel):
    scholar_id: Optional[str] = None
    title_id: Optional[str] = ""
    title_ar: Optional[str] = ""
    description: Optional[str] = ""

def qd(v): return {"id": v.id, "surah_id": v.surah_id, "surah_name_ar": v.surah_name_ar, "surah_name_id": v.surah_name_id, "ayah_number": v.ayah_number, "text_ar": v.text_ar, "source": v.source, "edition": v.edition, "validation_status": v.validation_status}
def hd(h): return {"id": h.id, "matan_ar": h.matan_ar, "translation_id_text": h.translation_id_text, "narrator": h.narrator, "collection": h.collection, "book": h.book, "chapter": h.chapter, "hadith_number": h.hadith_number, "numbering_scheme": h.numbering_scheme, "reference_url": h.reference_url, "match_status": h.match_status}
def wd(w): return {"id": w.id, "scholar_id": w.scholar_id, "title_id": w.title_id, "title_ar": w.title_ar, "description": w.description}

@router.get("/api/references/quran")
def pub_quran(db: Session = Depends(get_db)):
    return [qd(v) for v in db.query(QuranVerse).all()]

@router.get("/api/references/hadith")
def pub_hadith(db: Session = Depends(get_db)):
    return [hd(h) for h in db.query(HadithRecord).all()]

@router.get("/api/admin/references/quran")
def adm_quran(db: Session = Depends(get_db), user=Depends(admin_dep)):
    return [qd(v) for v in db.query(QuranVerse).all()]

@router.post("/api/admin/references/quran")
def adm_quran_create(body: QuranIn, db: Session = Depends(get_db), user=Depends(admin_dep)):
    v = QuranVerse(**body.model_dump()); db.add(v); db.commit(); db.refresh(v)
    log_audit(db, user.id, "CREATE_QURAN", "quran_verse", v.id, "")
    return qd(v)

@router.get("/api/admin/references/hadith")
def adm_hadith(db: Session = Depends(get_db), user=Depends(admin_dep)):
    return [hd(h) for h in db.query(HadithRecord).all()]

@router.post("/api/admin/references/hadith")
def adm_hadith_create(body: HadithIn, db: Session = Depends(get_db), user=Depends(admin_dep)):
    h = HadithRecord(**body.model_dump()); db.add(h); db.commit(); db.refresh(h)
    log_audit(db, user.id, "CREATE_HADITH", "hadith_record", h.id, "")
    return hd(h)

@router.get("/api/admin/references/books")
def adm_books(db: Session = Depends(get_db), user=Depends(admin_dep)):
    return [wd(w) for w in db.query(Work).all()]

@router.post("/api/admin/references/books")
def adm_books_create(body: WorkIn, db: Session = Depends(get_db), user=Depends(admin_dep)):
    w = Work(**body.model_dump()); db.add(w); db.commit(); db.refresh(w)
    log_audit(db, user.id, "CREATE_WORK", "work", w.id, "")
    return wd(w)
