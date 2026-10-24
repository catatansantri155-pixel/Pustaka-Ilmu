"""Check actual source pages, not search snippets; no AI calls or publication.

Persists full Arabic only when the Bin Baz source's explicit attribution
permission is present. Other sources remain metadata/checksum only pending rights.
"""
import argparse
import asyncio
from datetime import datetime, timezone
import gzip
import json
from pathlib import Path
import sys
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'services/api'))
from app.services.source_client import SourceClient
from app.services.source_connectors import parse_document, document_endpoint, SCHOLARS


def save(path, data):
    data['page_verification_count'] = sum(c.get('page_status') == 'VERIFIED' for c in data['candidates'])
    data['arabic_snapshot_count'] = sum(bool(c.get('text_ar')) for c in data['candidates'])
    data['translation_count'] = 0
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_bytes(gzip.compress(json.dumps(data, ensure_ascii=False, indent=2).encode(), mtime=0))
    temporary.replace(path)


async def verify_file(client, path, limit):
    data = json.loads(gzip.decompress(path.read_bytes()))
    rows = data['candidates']
    checked = 0
    # Do not replace a successful earlier verification with a failed network retry.
    verified = sum(c.get('page_status') == 'VERIFIED' for c in rows)
    for row in rows:
        if verified >= limit:
            break
        if row.get('page_status') == 'VERIFIED':
            continue
        row['checked_at'] = datetime.now(timezone.utc).isoformat()
        try:
            endpoint = document_endpoint(SimpleNamespace(**row))
            payload, final = await client.get(endpoint)
            if row['scholar_key'] == 'uthaymeen':
                payload = json.loads(payload)
            doc = parse_document(row['scholar_key'], payload, row['source_key'])
            row.update(title_ar=doc.title_ar, title_origin='SOURCE_PAGE', page_status='VERIFIED',
                       body_status='AVAILABLE', content_checksum=doc.checksum,
                       source_reference=doc.source_reference, rights_evidence=doc.permission_evidence,
                       content_format=doc.content_format, error='', verified_endpoint=final)
            # Benefit/access statements are not silently treated as redistribution licenses.
            if row['scholar_key'] == 'binbaz' and doc.permission_evidence:
                row['text_ar'] = doc.text_ar
                row['ingestion_status'] = 'READY_FOR_REVIEW'
            else:
                row['text_ar'] = ''
                row['ingestion_status'] = 'BLOCKED_RIGHTS'
            verified += 1
        except Exception as exc:
            row.update(page_status='FAILED', body_status='NOT_CONFIRMED', error=str(exc)[:500])
        checked += 1
        if checked % 10 == 0:
            save(path, data)
            print(json.dumps({'scholar': data['scholar_key'], 'verified': verified, 'attempts': checked}), flush=True)
        # A failed source must not trigger an unbounded crawl to fill the target.
        if checked >= limit * 2:
            break
    save(path, data)
    print(json.dumps({'scholar': data['scholar_key'], 'verified': verified,
                      'arabic_snapshots': data['arabic_snapshot_count'], 'translations': 0}), flush=True)


async def run(args):
    async with SourceClient(interval=args.interval) as client:
        tasks = [verify_file(client, args.directory/f'{key}.json.gz', args.limit)
                 for key in SCHOLARS if args.scholar in ('all', key)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        errors = [str(r) for r in results if isinstance(r, Exception)]
        if errors:
            raise RuntimeError('; '.join(errors))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--directory', type=Path, default=ROOT/'database/seeds/corpus')
    parser.add_argument('--scholar', choices=['all', *SCHOLARS], default='all')
    parser.add_argument('--limit', type=int, choices=[100,1000], default=100)
    parser.add_argument('--interval', type=float, default=1.0)
    asyncio.run(run(parser.parse_args()))
