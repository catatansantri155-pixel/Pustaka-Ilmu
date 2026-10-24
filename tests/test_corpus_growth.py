import asyncio
from copy import deepcopy
from datetime import datetime, timezone
import gzip
import hashlib
import json
from pathlib import Path
from types import SimpleNamespace
import httpx
import pytest
from app.models import (CorpusCandidate,CorpusTarget,ContentTask,Material,SourceRegistry,
                        ArabicText,TextSegment,Translation,TranslationSegment)
from app.services.source_connectors import (source_identity,parse_document,parse_listing,
    parse_sitemap,candidate_record,canonical_url,document_endpoint)
from app.services.source_client import SourceClient
from app.services.corpus import load_snapshot,progress,ingest_candidate,ATTRIBUTION_PERMISSION
from app.services.queue import enqueue,run_one
from app.services.source_connectors import SCHOLARS

UID='015596aa-d811-496a-bbc9-e2dae823a42d'
UTH=f'https://binothaimeen.net/ar/voice_library/lessonDetails/الوضوء/حكم-الوضوء/{UID}'
AR='هذا نص عربي للاختبار فقط ولا يعد فتوى منشورة ويتطلب التحقق من المصادر قبل النشر.'


def row(i,key='binbaz'):
    url=f'https://binbaz.org.sa/fatwas/{800000+i}/عنوان-تجريبي' if key=='binbaz' else f'https://www.al-albany.com/audios/content/{800000+i}/عنوان-تجريبي'
    return candidate_record(url,'https://binbaz.org.sa/categories/fiqhi/10' if key=='binbaz' else 'https://www.al-albany.com/audios/', 'CATEGORY_LIST',title='عنوان تجريبي')


def snapshot(rows,key='binbaz'):
    return {'schema_version':1,'scholar_key':key,'candidates':rows}


def test_source_identity_deduplicates_alias_paths():
    alternate=UTH.replace('/الوضوء/','/اللقاء-الشهري/')
    assert source_identity(UTH)==source_identity(alternate)==('uthaymeen','uthaymeen:lesson:'+UID)
    assert source_identity('https://www.al-albany.com/audios/content/5279/عنوان')==source_identity('https://www.al-albany.com/audios/content/05279/عنوان-آخر')
    with pytest.raises(ValueError):source_identity('https://binothaimeen.net/ar/voice_library/lessonDetails/باب/عنوان/'+'-'*36)


@pytest.mark.parametrize('url',['http://binbaz.org.sa/fatwas/1/x','https://127.0.0.1/a',
    'https://binbaz.org.sa.evil.test/fatwas/1/x','https://user:pass@binbaz.org.sa/fatwas/1/x',
    'https://binbaz.org.sa:8443/fatwas/1/x'])
def test_official_source_boundaries(url):
    with pytest.raises(ValueError):canonical_url(url)


def test_sitemap_dedup_is_not_a_verified_material():
    xml=f'<urlset><url><loc>{UTH}</loc></url><url><loc>{UTH.replace("الوضوء","آخر")}</loc></url><url><loc>https://evil.test/a</loc></url></urlset>'
    rows=parse_sitemap(xml,'https://binothaimeen.net/sitemap.xml')
    assert len(rows)==1 and rows[0]['source_key'].endswith(UID)
    assert 'page_status' not in rows[0] and 'text_ar' not in rows[0]


def test_listing_avoids_binbaz_navigation_and_keeps_pagination():
    html='<nav><a href="/fatwas/9/navigation">لا يضم</a></nav><article class="box__body__element fatwa"><a href="/fatwas/1826/عنوان">عنوان السؤال</a></article><a href="?page=2">التالي</a>'
    rows,pages=parse_listing(html,'https://binbaz.org.sa/categories/fiqhi/10',official_thaharah=True,topic_hint='THA-01')
    assert len(rows)==1 and rows[0]['source_key']=='binbaz:fatwa:1826'
    assert rows[0]['scope']=='THAHARAH' and rows[0]['topic_basis']=='SOURCE_CATEGORY'
    assert pages==['https://binbaz.org.sa/categories/fiqhi/10?page=2']


def test_source_parsers_extract_only_original_body():
    html=f'<nav>قائمة غير علمية</nav><article class="fatwa"><h1>عنوان</h1><h2 itemprop="alternativeHeadline">سؤال الاختبار</h2><div itemprop="articleBody">{AR}<section class="footnotes"><li>مرجع الكتاب 6/22</li></section></div></article><footer>{ATTRIBUTION_PERMISSION}</footer>'
    doc=parse_document('binbaz',html,'binbaz:fatwa:1826')
    assert AR in doc.text_ar and 'قائمة' not in doc.text_ar
    assert doc.permission_evidence==ATTRIBUTION_PERMISSION and '6/22' in doc.source_reference
    with pytest.raises(ValueError):parse_document('binbaz','<body><h1>انتظر التحقق</h1>'+AR+'</body>','binbaz:fatwa:1')
    alb=f'<div class="content"><div class="title"><div class="row"><div class="col-lg-10">سؤال الألباني</div></div></div></div><div class="content-text" id="contentText">{AR}</div><div class="content-details">شريط 19 توقيت 01:25:13</div>'
    assert '01:25:13' in parse_document('albani',alb,'albani:audio:5279').source_reference


def test_uthaymeen_uses_real_json_identity_and_transcript():
    payload={'data':{'id':UID,'title':{'ar':'عنوان المصدر'},'objective':{'content':{'ar':f'<p>{AR}</p>'}},'many_sections':[{'title':{'ar':'اللقاء الشهري [37]'}}]}}
    doc=parse_document('uthaymeen',payload,'uthaymeen:lesson:'+UID)
    assert doc.text_ar==AR and '37' in doc.source_reference
    bad=deepcopy(payload);bad['data']['id']='other'
    with pytest.raises(ValueError):parse_document('uthaymeen',bad,'uthaymeen:lesson:'+UID)
    bad=deepcopy(payload);bad['data']['objective']['content']['ar']=''
    with pytest.raises(ValueError):parse_document('uthaymeen',bad,'uthaymeen:lesson:'+UID)


def test_robots_denial_is_not_retried_as_permission():
    calls=[]
    def handle(request):
        calls.append(str(request.url));return httpx.Response(200,text='User-agent: *\nDisallow: /fatwas/')
    async def check():
        async with SourceClient(transport=httpx.MockTransport(handle)) as client:
            with pytest.raises(ValueError,match='robots'):
                await client.get('https://binbaz.org.sa/fatwas/1/x')
    asyncio.run(check());assert calls==['https://binbaz.org.sa/robots.txt']


def test_redirect_outside_sources_is_blocked():
    calls=[]
    def handle(request):
        calls.append(str(request.url))
        return httpx.Response(404) if request.url.path=='/robots.txt' else httpx.Response(302,headers={'location':'https://evil.test/a'})
    async def check():
        async with SourceClient(transport=httpx.MockTransport(handle)) as client:
            with pytest.raises(ValueError):await client.get('https://binbaz.org.sa/fatwas/1/x')
    asyncio.run(check());assert len(calls)==2


def test_snapshot_import_preserves_verified_rows_and_rejects_wrong_author(db):
    data=snapshot([row(1)]);assert load_snapshot(db,data)['new_candidates']==1
    assert load_snapshot(db,data)['new_candidates']==0
    c=db.query(CorpusCandidate).filter_by(source_key=row(1)['source_key']).one()
    c.page_status='VERIFIED';db.commit()
    load_snapshot(db,data);db.refresh(c);assert c.page_status=='VERIFIED'
    forged=snapshot([row(2,'albani')])
    with pytest.raises(ValueError):load_snapshot(db,forged)
    forbidden=row(3,'albani');forbidden['text_ar']=AR
    with pytest.raises(ValueError):load_snapshot(db,snapshot([forbidden],'albani'))


def test_arabic_ingestion_is_draft_and_idempotent(db):
    r=row(4);r.update(page_status='VERIFIED',body_status='AVAILABLE',text_ar=AR,
        rights_evidence=ATTRIBUTION_PERMISSION,content_checksum=hashlib.sha256(AR.encode()).hexdigest())
    load_snapshot(db,snapshot([r]));c=db.query(CorpusCandidate).filter_by(source_key=r['source_key']).one()
    material,created=ingest_candidate(db,c)
    assert created and material.status=='EXTRACTED' and material.rights_status=='UNKNOWN' and not material.title_id
    assert not db.query(Translation).filter_by(material_id=material.id).first()
    assert not db.query(ArabicText).filter_by(material_id=material.id).one().is_complete
    again,created=ingest_candidate(db,c);assert not created and again.id==material.id


def test_rights_unknown_sources_stay_metadata(db):
    r=row(5,'albani');r.update(page_status='VERIFIED',body_status='AVAILABLE',ingestion_status='BLOCKED_RIGHTS')
    load_snapshot(db,snapshot([r],'albani'));c=db.query(CorpusCandidate).filter_by(source_key=r['source_key']).one()
    with pytest.raises(ValueError,match='Izin'):ingest_candidate(db,c)
    assert not c.material_id and not c.text_ar


def test_target_pause_quota_and_auth(client,db,admin_headers):
    rows=[row(i) for i in range(100,220)]
    load_snapshot(db,snapshot(rows))
    assert client.get('/api/admin/corpus').status_code==401
    assert client.post('/api/admin/corpus/binbaz/queue',headers=admin_headers,json={'stage':'VERIFY','limit':25}).status_code==409
    assert client.put('/api/admin/corpus/binbaz/target',headers=admin_headers,json={'target':1001,'paused':False}).status_code==422
    assert client.put('/api/admin/corpus/binbaz/target',headers=admin_headers,json={'target':100,'paused':False}).status_code==200
    initial=db.query(ContentTask).filter_by(kind='CORPUS_VERIFY').count()
    for _ in range(6):
        response=client.post('/api/admin/corpus/binbaz/queue',headers=admin_headers,json={'stage':'VERIFY','limit':25})
        assert response.status_code==202,response.text
    # Verified source candidates already in this test session reduce the available milestone.
    verified=db.query(CorpusCandidate).filter_by(scholar_key='binbaz',page_status='VERIFIED').count()
    assert db.query(ContentTask).filter_by(kind='CORPUS_VERIFY').count()-initial==100-verified
    assert client.post('/api/admin/corpus/binbaz/queue',headers=admin_headers,json={'stage':'TRANSLATE','limit':25}).status_code==409
    client.put('/api/admin/corpus/binbaz/target',headers=admin_headers,json={'target':100,'paused':True})
    db.query(ContentTask).filter_by(kind='CORPUS_VERIFY').update({'status':'COMPLETED'});db.commit()


def test_paused_worker_preserves_block_reason(db):
    r=row(500,'albani');load_snapshot(db,snapshot([r],'albani'))
    registry=db.query(SourceRegistry).filter_by(domain='al-albany.com').one()
    task=enqueue(db,kind='CORPUS_VERIFY',url=r['canonical_url'],registry_id=registry.id,scholar_id=registry.scholar_id)
    # Use the direct orchestration here: other tests have pending tasks, never drain their queue.
    from app.services.corpus_worker import run_corpus_task
    run_corpus_task(db,task);db.commit()
    assert task.status=='BLOCKED' and 'dijeda' in task.error


def test_packaged_corpus_contains_real_identities_without_invented_translations():
    directory=Path(__file__).resolve().parents[1]/'database/seeds/corpus'
    for key in SCHOLARS:
        path=directory/f'{key}.json.gz'
        assert path.exists(), f'Snapshot {key} wajib tersedia dalam paket'
        data=json.loads(gzip.decompress(path.read_bytes()))
        assert len(data['candidates'])==1000
        ids=set()
        for c in data['candidates']:
            assert source_identity(c['canonical_url'])==(key,c['source_key'])
            assert c['source_key'] not in ids;ids.add(c['source_key'])
            assert 'text_id' not in c and not c.get('material_id')
            if c.get('text_ar'):assert key=='binbaz' and c['rights_evidence']==ATTRIBUTION_PERMISSION
