"""Source-specific identities and parsers. Never fall back to navigation/body chrome."""
from dataclasses import dataclass
import hashlib
import re
from urllib.parse import unquote, urljoin, urlsplit
from xml.etree import ElementTree as ET
from bs4 import BeautifulSoup
import httpx
from .search import normalize_text

SCHOLARS = {
    "binbaz": {"name": "Bin Baz", "domain": "binbaz.org.sa"},
    "uthaymeen": {"name": "Ibnu Utsaimin", "domain": "binothaimeen.net"},
    "albani": {"name": "Al-Albani", "domain": "al-albany.com"},
}
ALLOWED_HOSTS = {"binbaz.org.sa", "www.binbaz.org.sa", "binothaimeen.net", "www.binothaimeen.net",
                 "shekhapi.binothaimeen.net", "al-albany.com", "www.al-albany.com"}
BINBAZ_TOPICS = {10: "THA-01", 11: "THA-02", 12: "THA-03", 14: "THA-04", 15: "THA-05",
                 17: "THA-06", 18: "THA-07", 19: "THA-08", 20: "THA-09", 21: "THA-10"}
THAHARAH_WORDS = ["طهارة", "الوضوء", "وضوء", "التيمم", "تيمم", "الاستنجاء", "استنجاء", "النجاسة", "النجاسات",
                  "المذي", "المني", "الجنابة", "الحيض", "النّفاس", "النفاس", "الخفين", "الجوارب", "الغسل", "المياه"]


def canonical_url(url):
    parsed = urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_HOSTS or parsed.username or parsed.password:
        raise ValueError("Sumber harus HTTPS pada host resmi yang didukung tanpa kredensial")
    if parsed.port not in (None, 443):
        raise ValueError("Port sumber tidak didukung")
    return str(httpx.URL(url).copy_with(fragment=None))


def source_identity(url):
    url = canonical_url(url)
    parsed = urlsplit(url)
    path = unquote(parsed.path)
    host = parsed.hostname
    if host in ("binbaz.org.sa", "www.binbaz.org.sa"):
        m = re.fullmatch(r"/fatwas/(\d+)/[^/]+/?", path)
        if m:
            return "binbaz", f"binbaz:fatwa:{int(m[1])}"
    if host in ("binothaimeen.net", "www.binothaimeen.net"):
        m = re.fullmatch(r"/ar/(?:voice_library|Levels)/lessonDetails/(?:[^/]+/)+([0-9a-fA-F-]{36})/?", path)
        if m:
            import uuid
            identity = str(uuid.UUID(m[1]))
            return "uthaymeen", f"uthaymeen:lesson:{identity}"
    if host in ("al-albany.com", "www.al-albany.com"):
        m = re.fullmatch(r"/audios/content/(\d+)/[^/]+/?", path)
        if m:
            return "albani", f"albani:audio:{int(m[1])}"
    raise ValueError("URL bukan halaman materi yang didukung")


def title_from_url(url):
    parts = unquote(urlsplit(url).path).strip("/").split("/")
    return (parts[-2] if "lessonDetails" in parts else parts[-1]).replace("-", " ").strip()


def scope_from_title(title):
    normalized = normalize_text(title)
    return "THAHARAH_CANDIDATE" if any(normalize_text(word) in normalized for word in THAHARAH_WORDS) else "UNCLASSIFIED"


def candidate_record(url, discovery_url, method, title=None, topic_hint="", official_thaharah=False):
    scholar, key = source_identity(url)
    title = (title or title_from_url(url)).strip()
    return {"source_key": key, "scholar_key": scholar, "canonical_url": canonical_url(url),
            "title_ar": title, "title_origin": "SOURCE_LIST" if title and method != "SITEMAP" else "URL_SLUG",
            "discovery_url": canonical_url(discovery_url), "discovery_method": method,
            "topic_hint": topic_hint, "topic_basis": "SOURCE_CATEGORY" if official_thaharah else "TITLE_HINT",
            "scope": "THAHARAH" if official_thaharah else scope_from_title(title)}


def parse_sitemap(xml, discovery_url):
    root = ET.fromstring(xml)
    if root.tag.rsplit("}", 1)[-1] != "urlset":
        raise ValueError("Sitemap harus urlset; sitemap index perlu diikuti secara eksplisit")
    seen = {}
    for loc in root.iter():
        if loc.tag.rsplit("}", 1)[-1] != "loc" or not loc.text:
            continue
        try:
            row = candidate_record(loc.text.strip(), discovery_url, "SITEMAP")
        except (ValueError, httpx.InvalidURL):
            continue
        # A single lesson may have several category paths: prefer a topical path.
        previous = seen.get(row["source_key"])
        if previous is None or (previous["scope"] == "UNCLASSIFIED" and row["scope"] != "UNCLASSIFIED"):
            seen[row["source_key"]] = row
    return list(seen.values())


def parse_listing(html, url, *, official_thaharah=False, topic_hint=""):
    soup = BeautifulSoup(html, "html.parser")
    rows = {}
    # Bin Baz cards: do not harvest repeated sidebar/navigation links as new records.
    selector = "article.box__body__element a[href]" if "binbaz.org.sa" in urlsplit(url).hostname else "a[href]"
    for link in soup.select(selector):
        target = urljoin(url, link["href"])
        try:
            row = candidate_record(target, url, "CATEGORY_LIST", link.get_text(" ", strip=True), topic_hint, official_thaharah)
        except (ValueError, httpx.InvalidURL):
            continue
        rows.setdefault(row["source_key"], row)
    pagination = []
    for link in soup.select('a[href]'):
        target = urljoin(url, link["href"])
        try:
            target = canonical_url(target)
        except (ValueError, httpx.InvalidURL):
            continue
        if urlsplit(target).hostname == urlsplit(url).hostname and "page=" in target and urlsplit(target).path == urlsplit(url).path:
            pagination.append(target)
    return list(rows.values()), sorted(set(pagination))


@dataclass
class SourceDocument:
    title_ar: str
    text_ar: str
    source_reference: str = ""
    permission_evidence: str = ""
    content_format: str = "TEXT"
    parsed_id: str = ""

    @property
    def checksum(self):
        normalized = re.sub(r"\s+", " ", self.text_ar).strip()
        return hashlib.sha256(normalized.encode()).hexdigest()


def parse_document(scholar_key, payload, source_key):
    if scholar_key == "uthaymeen":
        data = payload.get("data", payload) if isinstance(payload, dict) else None
        if not isinstance(data, dict) or str(data.get("id", "")).lower() != source_key.rsplit(":", 1)[-1]:
            raise ValueError("Respons resmi tidak cocok dengan ID materi")
        objective = data.get("objective") or {}
        content = objective.get("content") or {}
        body = content.get("ar") or ""
        title = (data.get("title") or {}).get("ar") or ""
        text = BeautifulSoup(body, "html.parser").get_text("\n", strip=True)
        refs = []
        for section in data.get("many_sections") or []:
            if isinstance(section, dict):
                title_data = section.get("title") or {}
                refs.append(str(title_data.get("ar", "")) if isinstance(title_data, dict) else str(title_data))
        document = SourceDocument(title, text, "\n".join(refs), content_format="TRANSCRIPT", parsed_id=str(data.get("id")))
    else:
        soup = BeautifulSoup(payload, "html.parser")
        if scholar_key == "binbaz":
            article = soup.select_one("article.fatwa")
            body = article.select_one('[itemprop="articleBody"]') if article else None
            title = article.select_one("h1") if article else None
            question = article.select_one('[itemprop="alternativeHeadline"]') if article else None
            if not article or not body or not title:
                raise ValueError("Teks fatwa utama tidak ditemukan; tidak mengambil navigasi atau halaman tantangan")
            text = ((question.get_text("\n", strip=True) + "\n\n") if question else "") + body.get_text("\n", strip=True)
            evidence = "جميع الحقوق محفوظة والنقل متاح لكل مسلم بشرط ذكر المصدر"
            evidence = evidence if evidence in soup.get_text(" ", strip=True) else ""
            document = SourceDocument(title.get_text(" ", strip=True), text,
                                      "\n".join(li.get_text(" ", strip=True) for li in body.select('.footnotes li')),
                                      evidence, parsed_id=source_key.rsplit(":", 1)[-1])
        elif scholar_key == "albani":
            body = soup.select_one("#contentText.content-text")
            title = soup.select_one(".content > .title .col-lg-10") or soup.select_one("h1")
            if not body or not title:
                raise ValueError("Transkrip sumber tidak tersedia; jangan menggantikannya dengan judul atau navigasi")
            details = soup.select_one(".content-details")
            document = SourceDocument(title.get_text(" ", strip=True), body.get_text("\n", strip=True),
                                      details.get_text(" ", strip=True) if details else "",
                                      content_format="TRANSCRIPT", parsed_id=source_key.rsplit(":", 1)[-1])
        else:
            raise ValueError("Sumber tidak didukung")
    if not document.title_ar.strip() or len(re.findall(r"[\u0621-\u064a]", document.text_ar)) < 30:
        raise ValueError("Teks Arab sumber kosong atau terlalu pendek untuk impor otomatis")
    if "\ufffd" in document.text_ar:
        raise ValueError("Karakter teks sumber rusak")
    return document


def document_endpoint(candidate):
    if candidate.scholar_key == "uthaymeen":
        uid = candidate.source_key.rsplit(":", 1)[-1]
        return f"https://shekhapi.binothaimeen.net/lessons/audios/show/{uid}/0/1?getManySectionsWithAllParent=audio_library&getAllPaths=1"
    return candidate.canonical_url
