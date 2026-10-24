"""Discover real source identities; writes metadata only, never translations/publications.

Usage: .venv/bin/python scripts/discover_corpus.py --limit 1000
Writes resumable, reviewable JSON snapshots (one gzip file per scholar).
"""
import argparse
import asyncio
from collections import deque
from datetime import datetime, timezone
import gzip
import json
from pathlib import Path
import sys
from urllib.parse import urljoin, urlsplit, quote
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services/api"))
from app.services.source_client import SourceClient
from app.services.source_connectors import (parse_sitemap, parse_listing, BINBAZ_TOPICS, SCHOLARS)

DEFAULT_OUTPUT = ROOT / "database/seeds/corpus"


def save(output, key, rows, errors, requests):
    data = {"schema_version": 1, "scholar_key": key, "checked_at": datetime.now(timezone.utc).isoformat(),
            "stage": "SOURCE_DISCOVERY", "material_count": 0, "translation_count": 0,
            "candidate_count": len(rows), "page_verification_count": 0,
            "discovery_requests": requests, "errors": errors, "candidates": list(rows.values())}
    output.mkdir(parents=True, exist_ok=True)
    path = output / f"{key}.json.gz"
    payload = json.dumps(data, ensure_ascii=False, indent=2).encode()
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_bytes(gzip.compress(payload, mtime=0))
    temporary.replace(path)
    return path


async def discover_uthaymeen(client, limit, output):
    url = "https://binothaimeen.net/sitemap.xml"
    xml, _ = await client.get(url, max_bytes=25_000_000)
    rows = parse_sitemap(xml, url)
    # Prioritize likely Thaharah; all other records stay explicitly UNCLASSIFIED.
    rows.sort(key=lambda row: (row["scope"] == "UNCLASSIFIED", row["source_key"]))
    selected = {row["source_key"]: row for row in rows[:limit]}
    save(output, "uthaymeen", selected, [], client.requests)
    print(json.dumps({"scholar": "uthaymeen", "unique_available": len(rows), "saved_candidates": len(selected),
                      "topic_hints": sum(r['scope'] != 'UNCLASSIFIED' for r in selected.values())}), flush=True)


async def discover_lists(client, key, limit, output, max_pages=160):
    errors, rows, visited = [], {}, set()
    queue = deque()
    if key == "binbaz":
        for category in [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 341]:
            queue.append((f"https://binbaz.org.sa/categories/fiqhi/{category}", True, BINBAZ_TOPICS.get(category, "")))
    else:
        # These are the site's actual GET search form and publicly linked audio series.
        for term in ["الطهارة", "الوضوء", "التيمم", "الحيض", "النجاسة", "الجنابة", "الخفين", "المياه", "الاستنجاء"]:
            queue.append(("https://www.al-albany.com/audios/search.php?query=" + quote(term), False, ""))
        home, _ = await client.get("https://www.al-albany.com/audios/")
        soup = BeautifulSoup(home, "html.parser")
        for a in soup.select('a[href]'):
            if "/audios/series/" in a['href']:
                queue.append((urljoin("https://www.al-albany.com/audios/", a['href']), False, ""))
    while queue and len(rows) < limit and len(visited) < max_pages:
        url, thaharah, topic = queue.popleft()
        if url in visited:
            continue
        visited.add(url)
        try:
            html, final = await client.get(url)
            batch, pages = parse_listing(html, final, official_thaharah=thaharah, topic_hint=topic)
            new = 0
            for row in batch:
                if row['scholar_key'] == key and row['source_key'] not in rows and len(rows) < limit:
                    rows[row['source_key']] = row; new += 1
            for page in pages:
                if page not in visited:
                    queue.append((page, thaharah, topic))
            # Search pagination may use offset / page links with an unchanged query.
            if key == "albani":
                soup = BeautifulSoup(html, "html.parser")
                for a in soup.select('.pagination a[href], a[rel="next"]'):
                    page = urljoin(final, a['href'])
                    if urlsplit(page).path == urlsplit(final).path and page not in visited:
                        queue.append((page, thaharah, topic))
            if len(visited) % 10 == 0:
                save(output, key, rows, errors, len(visited))
                print(json.dumps({"scholar": key, "pages": len(visited), "candidates": len(rows)}), flush=True)
        except Exception as exc:
            errors.append({"url": url, "error": str(exc)[:300]})
            print(json.dumps({"scholar": key, "error": str(exc)[:180]}), flush=True)
        # Expand the inventory after the initial Thaharah categories are exhausted.
        if not queue and key == "binbaz" and len(rows) < limit:
            root_html, _ = await client.get("https://binbaz.org.sa/categories/fiqhi/9")
            for a in BeautifulSoup(root_html, "html.parser").select('a[href]'):
                u = a['href']
                if "/categories/fiqhi/" in u and u not in visited:
                    queue.append((u, False, ""))
    save(output, key, rows, errors, len(visited))
    print(json.dumps({"scholar": key, "saved_candidates": len(rows), "listing_pages": len(visited), "errors": len(errors)}), flush=True)


async def run(args):
    async with SourceClient(interval=args.interval) as client:
        tasks = []
        if args.scholar in ("all", "uthaymeen"):
            tasks.append(discover_uthaymeen(client, args.limit, args.output))
        for key in ["binbaz", "albani"]:
            if args.scholar in ("all", key):
                tasks.append(discover_lists(client, key, args.limit, args.output, args.max_pages))
        results = await asyncio.gather(*tasks, return_exceptions=True)
        failed = [f'{type(result).__name__}: {result}' for result in results if isinstance(result, Exception)]
        if failed:
            raise RuntimeError("; ".join(failed))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--scholar', choices=['all', *SCHOLARS], default='all')
    parser.add_argument('--limit', type=int, choices=[100, 1000], default=1000)
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument('--max-pages', type=int, default=160)
    parser.add_argument('--interval', type=float, default=1.0)
    asyncio.run(run(parser.parse_args()))
