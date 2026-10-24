"""Bounded, rate-limited, robots-aware reads of explicitly supported public sources."""
import asyncio
import time
from urllib.parse import urlsplit, urljoin
from urllib.robotparser import RobotFileParser
import httpx
from .source_connectors import canonical_url

USER_AGENT = "PustakaIlmu/2.0 (+source-attribution; corpus-curation)"


class SourceClient:
    def __init__(self, *, interval=1.0, transport=None):
        self.interval = max(0.5, interval)
        self.client = httpx.AsyncClient(timeout=30, follow_redirects=False, transport=transport,
                                        headers={"User-Agent": USER_AGENT})
        self.locks = {}
        self.last_request = {}
        self.robots = {}
        self.requests = 0

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.client.aclose()

    async def _read(self, url, max_bytes):
        url = canonical_url(url)
        for _ in range(6):
            host = urlsplit(url).hostname
            lock = self.locks.setdefault(host, asyncio.Lock())
            async with lock:
                pause = self.interval - (time.monotonic() - self.last_request.get(host, 0))
                if pause > 0:
                    await asyncio.sleep(pause)
                self.last_request[host] = time.monotonic()
                self.requests += 1
                async with self.client.stream("GET", url) as response:
                    if response.status_code in (301, 302, 303, 307, 308):
                        next_url = canonical_url(urljoin(url, response.headers.get("location", "")))
                        # Even another official host must pass its own robots policy.
                        if urlsplit(next_url).hostname != host:
                            raise ValueError("Redirect lintas host memerlukan pemeriksaan sumber tersendiri")
                        url = next_url
                        continue
                    response.raise_for_status()
                    chunks, size = [], 0
                    async for chunk in response.aiter_bytes():
                        size += len(chunk)
                        if size > max_bytes:
                            raise ValueError("Ukuran respons sumber melewati batas")
                        chunks.append(chunk)
                    return b"".join(chunks).decode("utf-8-sig"), url
        raise ValueError("Terlalu banyak redirect sumber")

    async def get(self, url, max_bytes=3_000_000):
        url = canonical_url(url)
        p = urlsplit(url)
        origin = f"{p.scheme}://{p.netloc}"
        if origin not in self.robots:
            # Cache a task so concurrent callers share one robots request.
            self.robots[origin] = asyncio.create_task(self._robots(origin))
        policy = await self.robots[origin]
        if policy is not None and not policy.can_fetch(USER_AGENT, url):
            raise ValueError("robots.txt tidak mengizinkan pengambilan halaman")
        for attempt in range(2):
            try:
                return await self._read(url, max_bytes)
            except (httpx.TimeoutException, httpx.NetworkError):
                if attempt:
                    raise
                await asyncio.sleep(2)

    async def _robots(self, origin):
        try:
            text, _ = await self._read(origin + "/robots.txt", 100_000)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                return None
            # 401/403/429/5xx are not permission to crawl.
            raise ValueError(f"robots.txt belum dapat diverifikasi: HTTP {exc.response.status_code}") from exc
        policy = RobotFileParser()
        policy.parse(text.splitlines())
        return policy
