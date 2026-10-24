from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session
from ..db import get_db
from ..deps import require_roles, log_audit
from ..config import settings
from ..models import CorpusCandidate, CorpusTarget, Material, ContentTask
from ..services.corpus import progress, resolve_registry, can_store_text
from ..services.source_connectors import SCHOLARS
from ..services.queue import enqueue

router = APIRouter(prefix='/api/admin/corpus', tags=['corpus'])
read = require_roles('super_admin','admin','editor')
write = require_roles('super_admin','admin')


def valid_key(key):
    if key not in SCHOLARS:
        raise HTTPException(404,'Ulama tidak didukung')


@router.get('')
def overview(db: Session=Depends(get_db), user=Depends(read)):
    return {'scholars':progress(db),'ai_configured':bool(settings.ai_api_key),
            'milestones':[100,250,500,1000],
            'note':'Kandidat sumber dan halaman terverifikasi bukan jumlah terjemahan atau materi terbit.'}


class TargetIn(BaseModel):
    model_config = ConfigDict(extra='forbid')
    target: int = Field(ge=100,le=1000)
    paused: bool


@router.put('/{key}/target')
def update_target(key:str, body:TargetIn, db:Session=Depends(get_db), user=Depends(write)):
    valid_key(key)
    plan=db.get(CorpusTarget,key)
    if plan is None:
        plan=CorpusTarget(scholar_key=key);db.add(plan)
    plan.target,plan.paused=body.target,body.paused
    db.commit()
    log_audit(db,user.id,'CORPUS_TARGET','corpus',key,f'target={body.target},paused={body.paused}')
    return {'scholar_key':key,'target':plan.target,'paused':plan.paused}


@router.get('/{key}/candidates')
def candidates(key:str,offset:int=Query(0,ge=0),limit:int=Query(25,ge=1,le=100),
               page_status:str|None=None, db:Session=Depends(get_db),user=Depends(read)):
    valid_key(key)
    q=db.query(CorpusCandidate).filter_by(scholar_key=key)
    if page_status:q=q.filter_by(page_status=page_status)
    rows=q.order_by(CorpusCandidate.source_key).offset(offset).limit(limit).all()
    fields=['id','source_key','canonical_url','title_ar','title_origin','scope','topic_hint','topic_basis',
            'page_status','body_status','ingestion_status','material_id','checked_at','error']
    return {'items':[{f:getattr(r,f) for f in fields} for r in rows],
            'total':q.count(),'offset':offset,'limit':limit}


class BatchIn(BaseModel):
    model_config=ConfigDict(extra='forbid')
    stage:Literal['VERIFY','IMPORT','TRANSLATE']
    limit:int=Field(default=25,ge=1,le=100)


@router.post('/{key}/queue',status_code=202)
def batch(key:str,body:BatchIn,db:Session=Depends(get_db),user=Depends(write)):
    valid_key(key)
    plan=db.query(CorpusTarget).filter_by(scholar_key=key).with_for_update().first()
    if plan is None or plan.paused:
        raise HTTPException(409,'Aktifkan rencana ulama terlebih dahulu; antrean tidak berjalan saat dijeda')
    registry=resolve_registry(db,key)
    if not registry or not registry.scholar_id:
        raise HTTPException(422,'Registry sumber dan ulama belum terpasang')
    q=db.query(CorpusCandidate).filter_by(scholar_key=key)
    if body.stage=='VERIFY':
        q=q.filter(CorpusCandidate.page_status=='DISCOVERED')
    elif body.stage=='IMPORT':
        q=q.filter(CorpusCandidate.page_status=='VERIFIED',CorpusCandidate.material_id.is_(None))
    else:
        if not settings.ai_api_key:
            raise HTTPException(409,'API key AI belum dikonfigurasi; tidak membuat antrean penerjemahan palsu')
        q=q.join(Material,Material.id==CorpusCandidate.material_id).filter(Material.status.in_(['EXTRACTED','IMPORTED','FAILED']))
    kind='CORPUS_'+body.stage
    active=db.query(ContentTask).filter(ContentTask.kind==kind, ContentTask.scholar_id==registry.scholar_id, ContentTask.status.in_(['PENDING','RETRY','RUNNING']))
    if body.stage=='VERIFY':
        completed=db.query(CorpusCandidate).filter_by(scholar_key=key,page_status='VERIFIED').count()
    elif body.stage=='IMPORT':
        completed=db.query(Material).filter(Material.scholar_id==registry.scholar_id,Material.is_demo==False).count()
    else:
        completed=next(row['translated_materials'] for row in progress(db) if row['scholar_key']==key)
    remaining=max(0,plan.target-completed-active.count())
    limit=min(body.limit,remaining)
    q=q.filter(CorpusCandidate.canonical_url.not_in(active.with_entities(ContentTask.url)))
    rows=q.order_by(CorpusCandidate.source_key).limit(limit).all()
    queued,existing,blocked=0,0,0
    task_ids=[]
    for candidate in rows:
        if body.stage=='IMPORT' and not can_store_text(candidate,registry):
            candidate.ingestion_status='BLOCKED_RIGHTS';blocked+=1;continue
        kind='CORPUS_'+body.stage
        task=enqueue(db,kind=kind,url=candidate.canonical_url,material_id=candidate.material_id,
                     registry_id=registry.id,scholar_id=registry.scholar_id,commit=False)
        task_ids.append(task.id)
        if task.status in ('PENDING','RETRY'):queued+=1
        else:existing+=1
    db.commit()
    log_audit(db,user.id,'CORPUS_BATCH','corpus',key,f'{body.stage}: queued={queued}, existing={existing}, blocked={blocked}')
    return {'queued_or_pending':queued,'existing_tasks':existing,'blocked_rights':blocked,'task_ids':task_ids,
            'note':'Status dapat dipantau di Antrean Konten; tidak ada publikasi otomatis.'}
