"""Corpus inventory, explicit milestones, and controlled draft ingestion."""
from datetime import datetime, timezone
import hashlib
import json
from sqlalchemy import func, or_
from ..models import (CorpusCandidate, CorpusTarget, Material, SourceRegistry, Scholar,
                      ArabicText, TextSegment, Translation, TranslationSegment, Source,
                      SourceAsset, MaterialTopic, Topic, ContentTask)
from .source_connectors import (SCHOLARS, source_identity, parse_document, document_endpoint)
from .catalog import index_material
from .ai_adapter import segment_arabic, AI_LABEL

ATTRIBUTION_PERMISSION = "جميع الحقوق محفوظة والنقل متاح لكل مسلم بشرط ذكر المصدر"


def resolve_registry(db, key):
    domain = SCHOLARS[key]['domain']
    return db.query(SourceRegistry).filter(SourceRegistry.domain.in_([domain, 'www.'+domain])).first()


def load_snapshot(db, snapshot):
    key = snapshot.get('scholar_key')
    if key not in SCHOLARS or snapshot.get('schema_version') != 1:
        raise ValueError('Format snapshot atau ulama tidak didukung')
    rows = snapshot.get('candidates', [])
    if len(rows) > 1000:
        raise ValueError('Maksimal 1000 kandidat per snapshot')
    identities = set()
    for row in rows:
        source_key = source_identity(row['canonical_url'])
        if source_key != (key, row['source_key']) or row['source_key'] in identities:
            raise ValueError('Identitas/ulama tidak cocok atau duplikat')
        identities.add(row['source_key'])
        if row.get('text_ar'):
            if key != 'binbaz' or row.get('rights_evidence') != ATTRIBUTION_PERMISSION:
                raise ValueError('Snapshot teks lengkap belum memiliki bukti izin yang dikenali')
            norm = __import__('re').sub(r'\s+', ' ', row['text_ar']).strip()
            if hashlib.sha256(norm.encode()).hexdigest() != row.get('content_checksum'):
                raise ValueError('Checksum snapshot teks Arab tidak cocok')
    columns = {c.name for c in CorpusCandidate.__table__.columns} - {'id', 'created_at', 'updated_at', 'material_id'}
    imported = updated = 0
    existing = {row.source_key: row for row in db.query(CorpusCandidate).filter_by(scholar_key=key)}
    for row in rows:
        candidate = existing.get(row['source_key'])
        if candidate is None:
            candidate = CorpusCandidate(source_key=row['source_key'], scholar_key=key,
                                        canonical_url=row['canonical_url'], discovery_url=row['discovery_url'],
                                        discovery_method=row['discovery_method'])
            db.add(candidate); imported += 1
        elif candidate.page_status == 'VERIFIED' and row.get('page_status') != 'VERIFIED':
            continue
        elif candidate.material_id:
            continue
        else:
            updated += 1
        for name in columns & row.keys():
            value = row[name]
            if name == 'checked_at' and value:
                value = datetime.fromisoformat(value)
            setattr(candidate, name, value)
    if db.get(CorpusTarget, key) is None:
        db.add(CorpusTarget(scholar_key=key, target=100, paused=True))
    db.commit()
    return {'new_candidates': imported, 'updated_candidates': updated}


def progress(db):
    result = []
    for key, spec in SCHOLARS.items():
        q = db.query(CorpusCandidate).filter_by(scholar_key=key)
        total = q.count()
        registry = resolve_registry(db, key)
        sid = registry.scholar_id if registry else None
        material_q = db.query(Material).filter(Material.scholar_id == sid, Material.is_demo == False) if sid else db.query(Material).filter(False)
        materials = material_q.count()
        arabic = material_q.join(ArabicText).filter(ArabicText.full_text != '').with_entities(func.count(func.distinct(Material.id))).scalar() or 0
        # Completeness is based on paired nonblank segments, never number of AI runs.
        arabic_counts = db.query(ArabicText.material_id.label('mid'), func.count(TextSegment.id).label('n')).join(TextSegment).group_by(ArabicText.material_id).subquery()
        translated_counts = db.query(Translation.material_id.label('mid'), func.count(func.distinct(TranslationSegment.text_segment_id)).label('n')).join(TranslationSegment).join(TextSegment, TextSegment.id == TranslationSegment.text_segment_id).join(ArabicText, (ArabicText.id == TextSegment.arabic_text_id) & (ArabicText.material_id == Translation.material_id)).filter(func.trim(TranslationSegment.text_id) != '').group_by(Translation.material_id).subquery()
        translated = material_q.join(arabic_counts, arabic_counts.c.mid == Material.id).join(translated_counts, translated_counts.c.mid == Material.id).filter(
            arabic_counts.c.n > 0, arabic_counts.c.n == translated_counts.c.n, func.trim(Material.title_id) != '').count()
        published = material_q.filter(Material.status == 'PUBLISHED_AI').count()
        target = db.get(CorpusTarget, key)
        result.append({'scholar_key': key, 'name': spec['name'], 'target': target.target if target else 100,
                       'paused': target.paused if target else True,
                       'candidates': total, 'pages_verified': q.filter_by(page_status='VERIFIED').count(),
                       'arabic_available_at_source': q.filter_by(body_status='AVAILABLE').count(),
                       'arabic_snapshots': q.filter(CorpusCandidate.text_ar != '').count(),
                       'rights_blocked': q.filter_by(ingestion_status='BLOCKED_RIGHTS').count(),
                       'linked_candidates': q.filter(CorpusCandidate.material_id.is_not(None)).count(),
                       'materials': materials, 'arabic_texts_stored': arabic,
                       'translated_materials': translated, 'published_materials': published,
                       'remaining_to_100': max(0, 100-translated), 'remaining_to_1000': max(0, 1000-translated),
                       'ai_label': AI_LABEL})
    return result


def can_store_text(candidate, registry):
    return bool(registry and registry.permission_status in ('CLEARED', 'PERMITTED', 'PERMITTED_WITH_ATTRIBUTION')) or (
        candidate.scholar_key == 'binbaz' and candidate.rights_evidence == ATTRIBUTION_PERMISSION)


async def verify_candidate(db, candidate, client):
    payload, final = await client.get(document_endpoint(candidate))
    if candidate.scholar_key == 'uthaymeen':
        payload = json.loads(payload)
    document = parse_document(candidate.scholar_key, payload, candidate.source_key)
    candidate.title_ar = document.title_ar
    candidate.title_origin = 'SOURCE_PAGE'
    candidate.page_status = 'VERIFIED'
    candidate.body_status = 'AVAILABLE'
    candidate.checked_at = datetime.now(timezone.utc)
    candidate.content_checksum = document.checksum
    candidate.source_reference = document.source_reference
    candidate.rights_evidence = document.permission_evidence
    candidate.error = ''
    registry = resolve_registry(db, candidate.scholar_key)
    if can_store_text(candidate, registry):
        candidate.text_ar = document.text_ar
        candidate.ingestion_status = 'READY_FOR_REVIEW'
    else:
        candidate.text_ar = ''
        candidate.ingestion_status = 'BLOCKED_RIGHTS'
    db.commit()
    return document


def ingest_candidate(db, candidate):
    if candidate.material_id:
        return db.get(Material, candidate.material_id), False
    registry = resolve_registry(db, candidate.scholar_key)
    if not registry or not registry.scholar_id:
        raise ValueError('Registry sumber/ulama belum terpasang')
    if not can_store_text(candidate, registry):
        candidate.ingestion_status = 'BLOCKED_RIGHTS'; db.commit()
        raise ValueError('Izin sumber belum terverifikasi; kandidat tetap metadata saja')
    if candidate.page_status != 'VERIFIED' or not candidate.text_ar.strip():
        raise ValueError('Kandidat belum memiliki snapshot Arab yang terverifikasi')
    # Same source ID across different slugs/category paths is still one material.
    source_id = candidate.source_key.rsplit(':',1)[-1]
    if candidate.scholar_key == 'binbaz':
        patterns = [f'https://binbaz.org.sa/fatwas/{source_id}/%', f'https://www.binbaz.org.sa/fatwas/{source_id}/%']
    elif candidate.scholar_key == 'albani':
        patterns = [f'https://www.al-albany.com/audios/content/{source_id}/%', f'https://al-albany.com/audios/content/{source_id}/%']
    else:
        patterns = [f'https://binothaimeen.net/%/{source_id}', f'https://www.binothaimeen.net/%/{source_id}']
    duplicate = db.query(Material).filter(Material.scholar_id == registry.scholar_id,
                   or_(Material.source_url == candidate.canonical_url, *(Material.source_url.like(p) for p in patterns))).first()
    if duplicate is None:
        asset = db.query(SourceAsset).join(Material, Material.id == SourceAsset.material_id).filter(
            Material.scholar_id == registry.scholar_id, SourceAsset.checksum == candidate.content_checksum).first()
        duplicate = db.get(Material, asset.material_id) if asset else None
    if duplicate:
        candidate.material_id = duplicate.id; candidate.ingestion_status = 'DUPLICATE'; db.commit()
        return duplicate, False
    material = Material(scholar_id=registry.scholar_id, title_ar=candidate.title_ar, title_id='',
                        source_url=candidate.canonical_url, status='EXTRACTED', rights_status='UNKNOWN', ai_label=AI_LABEL)
    db.add(material); db.flush()
    source = Source(material_id=material.id, registry_id=registry.id, url=candidate.canonical_url,
                    title=candidate.title_ar, content_format='TEXT', status='IMPORTED',
                    notes=json.dumps({'source_key': candidate.source_key, 'checked_at': str(candidate.checked_at),
                                      'rights_evidence': candidate.rights_evidence, 'reference': candidate.source_reference,
                                      'note': 'Source-provided text/transcript; not an AI audio transcription.'}, ensure_ascii=False))
    db.add(source); db.flush()
    db.add(SourceAsset(material_id=material.id, source_id=source.id, url=candidate.canonical_url,
                       checksum=candidate.content_checksum, raw_text=candidate.text_ar, mime_type='text/plain'))
    arabic = ArabicText(material_id=material.id, full_text=candidate.text_ar, is_complete=False)
    db.add(arabic); db.flush()
    for i, text in enumerate(segment_arabic(candidate.text_ar)):
        db.add(TextSegment(arabic_text_id=arabic.id, order_index=i, text_ar=text))
    if candidate.topic_basis == 'SOURCE_CATEGORY' and candidate.topic_hint:
        topic = db.query(Topic).filter_by(code=candidate.topic_hint).first()
        if topic:
            db.add(MaterialTopic(material_id=material.id, topic_id=topic.id))
    candidate.material_id = material.id
    candidate.ingestion_status = 'IMPORTED'
    index_material(db, material)
    db.commit()
    return material, True
