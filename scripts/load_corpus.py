"""Load discovery snapshots without publishing or modifying existing materials."""
import argparse
import gzip
import json
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'services/api'))
from app.db import SessionLocal
from app.services.corpus import load_snapshot, ingest_candidate
from app.models import CorpusCandidate

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--directory',type=Path,default=ROOT/'database/seeds/corpus')
    parser.add_argument('--ingest-binbaz',type=int,default=0,help='Import up to N verified Bin Baz Arabic drafts; no translations/publication')
    args=parser.parse_args()
    if not 0<=args.ingest_binbaz<=1000:parser.error('Batas impor 0–1000')
    with SessionLocal() as db:
        for path in sorted(args.directory.glob('*.json.gz')):
            print(path.name,load_snapshot(db,json.loads(gzip.decompress(path.read_bytes()))))
        made=duplicates=0
        if args.ingest_binbaz:
            rows=db.query(CorpusCandidate).filter(CorpusCandidate.scholar_key=='binbaz',CorpusCandidate.page_status=='VERIFIED',CorpusCandidate.text_ar!='').order_by(CorpusCandidate.source_key).limit(args.ingest_binbaz)
            for row in rows:
                _,created=ingest_candidate(db,row)
                made+=int(created);duplicates+=int(not created)
        print(json.dumps({'new_arabic_drafts':made,'already_linked':duplicates,'translations_created':0,'published':0}))
