import re
from ..models import ArabicText, Translation, ReferenceMatch

COLLECTIONS = ["Muslim","Bukhari","Bukhari dan Muslim","Abu Dawud","Tirmidzi","Nasa'i","Ibnu Majah","Ahmad"]
def match_references(db, material):
    at = db.query(ArabicText).filter(ArabicText.material_id==material.id).first()
    texts = []
    if at: texts.append(at.full_text or "")
    tr = db.query(Translation).filter(Translation.material_id==material.id).first()
    full_id = ""
    # gather translation text via segments not trivial; use title
    texts.append(material.title_id or "")
    combined = "\n".join(texts)
    created = []
    for m in re.finditer(r'QS\.\s*([A-Za-z\-\s]+):(\d+)', combined):
        rm = ReferenceMatch(material_id=material.id, matched_text=m.group(0), reference_type="QURAN", status="CANDIDATE")
        db.add(rm); created.append(rm)
    for m in re.finditer(r'\(HR\.\s*([^)]+)\)', combined):
        rm = ReferenceMatch(material_id=material.id, matched_text=m.group(0), reference_type="HADITH", status="CANDIDATE")
        db.add(rm); created.append(rm)
    # also scan translation segments text_id
    if tr:
        from ..models import TranslationSegment
        for ts in db.query(TranslationSegment).filter(TranslationSegment.translation_id==tr.id).all():
            for m in re.finditer(r'QS\.\s*([A-Za-z\-\s]+):(\d+)', ts.text_id or ""):
                rm = ReferenceMatch(material_id=material.id, matched_text=m.group(0), reference_type="QURAN", status="CANDIDATE")
                db.add(rm); created.append(rm)
            for m in re.finditer(r'\(HR\.\s*([^)]+)\)', ts.text_id or ""):
                rm = ReferenceMatch(material_id=material.id, matched_text=m.group(0), reference_type="HADITH", status="CANDIDATE")
                db.add(rm); created.append(rm)
    db.commit()
    return created
