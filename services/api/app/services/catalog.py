"""Bounded SQL catalog queries, shared by reader and admin; no full-text N+1 scans."""
from sqlalchemy import or_, func
from ..models import (Material, MaterialSearch, Scholar, ArabicText, Translation,
                      TranslationSegment, Topic, MaterialTopic)
from .search import expand_query, normalize_text


def index_material(db, material):
    db.flush()
    parts = [material.title_id or "", material.title_ar or ""]
    scholar = db.get(Scholar, material.scholar_id) if material.scholar_id else None
    if scholar:
        parts.extend([scholar.name_id or "", scholar.name_ar or ""])
    parts.extend(r.full_text or "" for r in db.query(ArabicText).filter_by(material_id=material.id))
    parts.extend(r[0] or "" for r in db.query(TranslationSegment.text_id).join(Translation)
                 .filter(Translation.material_id == material.id))
    for topic in db.query(Topic).join(MaterialTopic).filter(MaterialTopic.material_id == material.id):
        parts.extend([topic.name_id, topic.name_ar, topic.code])
    doc = db.get(MaterialSearch, material.id)
    if doc is None:
        doc = MaterialSearch(material_id=material.id)
        db.add(doc)
    doc.normalized_text = normalize_text(" ".join(parts))
    db.flush()


def rebuild_for_classification(db, kind, row_id):
    q = db.query(Material)
    if kind == "scholars":
        q = q.filter(Material.scholar_id == row_id)
    elif kind == "topics":
        q = q.join(MaterialTopic).filter(MaterialTopic.topic_id == row_id)
    else:
        return
    for material in q.yield_per(100):
        index_material(db, material)
    db.commit()


def brief_many(db, materials):
    """Three bounded queries for a page instead of queries for every card."""
    if not materials:
        return []
    ids = [m.id for m in materials]
    scholars = {s.id: s for s in db.query(Scholar).filter(Scholar.id.in_({m.scholar_id for m in materials if m.scholar_id}))}
    topics = {}
    for mid, tid, code, name_id, name_ar in db.query(MaterialTopic.material_id, Topic.id, Topic.code, Topic.name_id, Topic.name_ar).join(Topic).filter(MaterialTopic.material_id.in_(ids)):
        topics.setdefault(mid, []).append({"id": tid, "code": code, "name_id": name_id, "name_ar": name_ar})
    result = []
    for m in materials:
        s = scholars.get(m.scholar_id)
        result.append({"id": m.id, "title_id": m.title_id, "title_ar": m.title_ar,
                       "scholar_id": m.scholar_id,
                       "scholar": {"id": s.id, "name_id": s.name_id, "name_ar": s.name_ar} if s else None,
                       "content_type": m.content_type, "status": m.status, "topics": topics.get(m.id, []),
                       "is_demo": m.is_demo, "rights_status": m.rights_status,
                       "source_url": m.source_url, "created_at": m.created_at})
    return result


def page(db, *, q="", scholar_id=None, topic_id=None, content_type=None,
         status=None, offset=0, limit=24, admin=False):
    query = db.query(Material)
    if not admin:
        query = query.filter(Material.status == "PUBLISHED_AI", Material.is_demo == False)
    elif status:
        query = query.filter(Material.status == status)
    if scholar_id:
        query = query.filter(Material.scholar_id == scholar_id)
    if topic_id:
        query = query.filter(Material.id.in_(db.query(MaterialTopic.material_id).filter(MaterialTopic.topic_id == topic_id)))
    if content_type:
        query = query.filter(Material.content_type == content_type)
    terms = sorted({normalize_text(t) for t in expand_query(q.strip()) if normalize_text(t)}) if q.strip() else []
    if terms:
        query = query.outerjoin(MaterialSearch, MaterialSearch.material_id == Material.id)
        # Fallback for legacy materials until explicit backfill has completed.
        haystack = func.coalesce(MaterialSearch.normalized_text,
                                 func.lower(func.coalesce(Material.title_id, "") + " " + func.coalesce(Material.title_ar, "")))
        query = query.filter(or_(*(haystack.contains(term, autoescape=True) for term in terms)))
    total = query.count()
    rows = query.order_by(Material.created_at.desc(), Material.id.desc()).offset(offset).limit(limit).all()
    return {"items": brief_many(db, rows), "total": total, "offset": offset, "limit": limit,
            "has_more": offset + limit < total}
