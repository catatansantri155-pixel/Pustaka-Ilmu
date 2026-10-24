"""Worker-side orchestration. Never approves or publishes content."""
import asyncio
from ..models import CorpusCandidate, CorpusTarget, Material, GlossaryTerm
from ..config import settings
from .source_connectors import source_identity
from .source_client import SourceClient
from .corpus import verify_candidate, ingest_candidate, resolve_registry, can_store_text


def run_corpus_task(db, task):
    key, identity = source_identity(task.url)
    candidate = db.query(CorpusCandidate).filter_by(source_key=identity).first()
    if not candidate:
        raise ValueError('Kandidat sumber tidak ditemukan')
    plan = db.get(CorpusTarget, key)
    if plan is None or plan.paused:
        task.status, task.error = 'BLOCKED', 'Rencana koleksi sedang dijeda'
        return
    if task.kind == 'CORPUS_VERIFY':
        async def verify():
            async with SourceClient() as client:
                return await verify_candidate(db,candidate,client)
        asyncio.run(verify())
    elif task.kind == 'CORPUS_IMPORT':
        registry=resolve_registry(db,key)
        if not can_store_text(candidate,registry):
            candidate.ingestion_status='BLOCKED_RIGHTS'
            task.status,task.error='BLOCKED','Izin sumber belum terverifikasi; tetap metadata saja'
            return
        if not candidate.text_ar:
            async def refresh():
                async with SourceClient() as client:
                    return await verify_candidate(db,candidate,client)
            asyncio.run(refresh())
        material,_=ingest_candidate(db,candidate)
        task.material_id=material.id
    elif task.kind == 'CORPUS_TRANSLATE':
        if not settings.ai_api_key:
            task.status,task.error='BLOCKED','API key AI belum dikonfigurasi'
            return
        material=db.get(Material,candidate.material_id) if candidate.material_id else None
        if not material or material.status not in ('EXTRACTED','IMPORTED','FAILED'):
            task.status,task.error='BLOCKED','Hanya draf baru dapat diterjemahkan dalam batch; tidak menimpa materi terbit/editorial'
            return
        from .ai_adapter import OpenAICompatibleAdapter,translate_material
        adapter=OpenAICompatibleAdapter([f'{g.term_ar} = {g.term_id}' for g in db.query(GlossaryTerm).limit(100)])
        title=adapter.translate_segments([candidate.title_ar])
        if len(title)!=1 or not title[0].strip():
            raise ValueError('Terjemahan judul tidak valid')
        # Persist the translated title only when the body translation succeeds.
        run=translate_material(db,material,adapter=adapter)
        if run.status!='COMPLETED':
            raise RuntimeError(run.error or 'Terjemahan gagal')
        material.title_id=title[0]
        from .catalog import index_material
        index_material(db,material)
        candidate.ingestion_status='TRANSLATED_DRAFT'
    else:
        raise ValueError('Tahap korpus tidak didukung')
    task.status,task.error='COMPLETED',''
