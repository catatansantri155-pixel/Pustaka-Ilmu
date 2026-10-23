"""Importer HTML dengan SSRF guard berlapis.

Konteks lingkungan: egress VM berjalan lewat HTTP proxy (env http_proxy/https_proxy)
dan DNS lokal mengembalikan fake-IP rentang reserved (198.18.x) untuk domain publik.
Karena itu pemeriksaan "resolved IP" TIDAK boleh dilakukan saat proxy dikonfigurasi —
resolusi nama terjadi di sisi proxy. Guard utama adalah allowlist domain dari
source_registry, bukan hasil resolve lokal.

Lapisan guard:
1. Skema wajib https.
2. Host berupa literal IP: privat/reserved/loopback/link-local/multicast/unspecified -> tolak.
   Literal IP publik pun ditolak (host wajib nama domain).
3. Bila daftar domain registry tersedia: host wajib sama dengan salah satu domain
   registry atau subdomainnya.
4. Hanya pada mode direct (tanpa proxy env): hasil resolve DNS diperiksa dan wajib
   seluruhnya IP publik.
5. Redirect diikuti manual (maks 5 hop) dan SETIAP hop divalidasi ulang dengan
   seluruh lapisan di atas.
Fetch memakai httpx.Client(trust_env=True) agar proxy env dihormati.
"""
import os
import socket
import ipaddress
import hashlib
import re
from contextlib import contextmanager
from urllib.parse import urlparse, urljoin
import httpx
from bs4 import BeautifulSoup
from .ai_adapter import segment_arabic

MAX_REDIRECTS = 5
FETCH_TIMEOUT = 25
USER_AGENT = "PustakaIlmu/1.0 (+https://pustaka.local)"
REDIRECT_STATUSES = (301, 302, 303, 307, 308)


def compute_checksum(text: str) -> str:
    norm = re.sub(r'\s+', ' ', (text or "").strip())
    return hashlib.sha256(norm.encode('utf-8')).hexdigest()


def proxy_configured() -> bool:
    return any(os.environ.get(k) for k in ("https_proxy", "HTTPS_PROXY", "http_proxy", "HTTP_PROXY"))


def _filtered_no_proxy(value: str) -> str:
    """Buang entri no_proxy berupa literal IPv6 dalam kurung siku (mis. [fd8b::1]).
    httpx gagal mem-parse pola semacam itu (InvalidURL: Invalid port) sehingga
    seluruh fetch via proxy runtuh; entri host sederhana tetap dipertahankan."""
    if not value:
        return value
    parts = [p.strip() for p in value.split(",")]
    return ",".join(p for p in parts if p and "[" not in p and "]" not in p)


def _ssl_verify():
    """Konteks SSL untuk httpx: hormati SSL_CERT_FILE bila berkasnya ada, jika tidak
    pakai bundle CA sistem (/etc/ssl/certs/ca-certificates.crt) — sama seperti curl.
    Diperlukan karena egress proxy VM memakai CA sendiri yang tidak ada di bundle
    certifi bawaan httpx. Verifikasi sertifikat TIDAK dimatikan."""
    import ssl
    cafile = os.environ.get("SSL_CERT_FILE")
    if cafile and os.path.exists(cafile):
        return ssl.create_default_context(cafile=cafile)
    system_bundle = "/etc/ssl/certs/ca-certificates.crt"
    if os.path.exists(system_bundle):
        return ssl.create_default_context(cafile=system_bundle)
    return True


@contextmanager
def _sanitized_proxy_env():
    keys = ("no_proxy", "NO_PROXY")
    old = {k: os.environ.get(k) for k in keys}
    try:
        for k in keys:
            if old[k]:
                os.environ[k] = _filtered_no_proxy(old[k])
        yield
    finally:
        for k, v in old.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v


def _is_ip_literal(host: str) -> bool:
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        return False


def _ip_is_public(ip) -> bool:
    return not (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved
                or ip.is_multicast or ip.is_unspecified)


def assert_safe_url(url: str, allowed_domains=None):
    """Validasi satu URL (satu hop). allowed_domains: iterable domain registry;
    bila None, pemeriksaan allowlist dilewati (dipakai pemanggil yang belum punya
    konteks registry), tetapi lapisan skema + literal IP + (mode direct) resolve
    tetap ditegakkan."""
    p = urlparse(url)
    if p.scheme != "https":
        raise ValueError(f"URL ditolak: skema wajib https (diterima: {p.scheme or '-'})")
    host = (p.hostname or "").lower().rstrip(".")
    if not host:
        raise ValueError("Hostname tidak valid")
    # Lapisan 2: literal IP
    if _is_ip_literal(host):
        ip = ipaddress.ip_address(host)
        if not _ip_is_public(ip):
            raise ValueError(f"URL ditolak: literal IP tidak publik ({host})")
        raise ValueError("URL ditolak: host berupa literal IP tidak diizinkan; gunakan nama domain terdaftar")
    # Lapisan 3: allowlist domain registry
    if allowed_domains is not None:
        domains = {(d or "").lower().rstrip(".") for d in allowed_domains if d}
        if domains and not any(host == d or host.endswith("." + d) for d in domains):
            raise ValueError(f"URL ditolak: domain {host} tidak terdaftar di source_registry")
    # Lapisan 4: resolve check hanya untuk mode direct (tanpa proxy).
    if not proxy_configured():
        try:
            infos = socket.getaddrinfo(host, None)
        except socket.gaierror as e:
            raise ValueError(f"Gagal resolve hostname: {e}")
        for info in infos:
            ip_str = info[4][0]
            try:
                ip = ipaddress.ip_address(ip_str)
            except ValueError:
                continue
            if not _ip_is_public(ip):
                raise ValueError(f"URL ditolak: IP tujuan tidak publik ({ip_str})")


def load_registry_domains():
    """Ambil daftar domain dari source_registry. Mengembalikan None bila DB tidak
    dapat diakses (guard allowlist dilewati, lapisan lain tetap aktif)."""
    try:
        from ..db import SessionLocal
        from ..models import SourceRegistry
        db = SessionLocal()
        try:
            rows = db.query(SourceRegistry).all()
            return [r.domain for r in rows if r.domain]
        finally:
            db.close()
    except Exception:
        return None


def fetch_url(url: str, allowed_domains=None):
    """Fetch URL mengikuti redirect secara manual dengan validasi per hop.
    Mengembalikan (teks_html, url_final_setelah_redirect)."""
    if allowed_domains is None:
        allowed_domains = load_registry_domains()
    current = url
    with _sanitized_proxy_env():
        with httpx.Client(trust_env=True, timeout=FETCH_TIMEOUT, follow_redirects=False,
                          verify=_ssl_verify(), headers={"User-Agent": USER_AGENT}) as client:
            for _hop in range(MAX_REDIRECTS + 1):
                assert_safe_url(current, allowed_domains=allowed_domains)
                r = client.get(current)
                if r.status_code in REDIRECT_STATUSES:
                    loc = r.headers.get("location")
                    if not loc:
                        raise ValueError(f"Redirect tanpa Location dari {current}")
                    current = urljoin(current, loc)
                    continue
                r.raise_for_status()
                return r.text, str(r.url) if r.url else current
    raise ValueError(f"Terlalu banyak redirect (>{MAX_REDIRECTS}) dari {url}")


def fetch_html(url: str, allowed_domains=None) -> str:
    text, _final = fetch_url(url, allowed_domains=allowed_domains)
    return text


def extract_main_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "button", "form"]):
        tag.decompose()
    # Buang elemen antarmuka pemutar audio/video & tombol unduh (bukan isi materi):
    for el in soup.select(".jp-audio, .jp-jplayer, .jp-interface, .download-btn, .audio-player"):
        el.decompose()
    for el in soup.find_all(True):
        classes = " ".join(el.get("class") or [])
        if "jp-" in classes:
            el.decompose()
    main = soup.find("article") or soup.find("main") or soup.body or soup
    return main.get_text(separator="\n", strip=True)


def extract_pdf_text(data: bytes) -> str:
    """Ekstrak teks dari PDF memakai pypdf; halaman tanpa teks ditoleransi."""
    import io
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(data))
    parts = []
    for page in reader.pages:
        try:
            t = page.extract_text()
        except Exception:
            t = None
        if t:
            parts.append(t)
    return "\n".join(parts).strip()


def import_pdf(db, data: bytes, filename: str, scholar_id=None, registry_id=None):
    """Impor PDF meniru import_html. PDF tanpa lapisan teks (hasil pindai)
    ditandai NEEDS_OCR — OCR tidak dikarang, adapter OCR belum aktif."""
    from ..models import AcquisitionJob, ProcessingJob, SourceAsset, Material, ArabicText, TextSegment, Source
    job = AcquisitionJob(url=filename, status="RUNNING", registry_id=registry_id)
    db.add(job); db.commit(); db.refresh(job)
    try:
        text = extract_pdf_text(data)
    except Exception:
        text = ""
    if not text or len(text.strip()) < 50:
        job.status = "NEEDS_OCR"
        job.error = "Teks PDF kosong atau kurang dari 50 karakter; dokumen ini memerlukan OCR, tetapi adapter OCR belum dikonfigurasi"
        db.add(ProcessingJob(job_type="PDF_IMPORT", status="NEEDS_OCR", error=job.error))
        db.commit(); db.refresh(job)
        return {"job": job, "material": None, "status": "NEEDS_OCR"}
    try:
        checksum = compute_checksum(text)
        dup_asset = db.query(SourceAsset).filter(SourceAsset.checksum == checksum).first()
        dup_mat = db.query(Material).filter(Material.source_url == filename).first()
        if dup_asset or dup_mat:
            job.status = "DUPLICATE"; job.material_id = (dup_mat.id if dup_mat else dup_asset.material_id); db.commit()
            return {"job": job, "material": dup_mat, "status": "DUPLICATE", "duplicate_of": job.material_id}
        mat = Material(scholar_id=scholar_id, title_id=text[:120], source_url=filename, status="IMPORTED", rights_status="UNKNOWN")
        db.add(mat); db.commit(); db.refresh(mat)
        src = Source(material_id=mat.id, registry_id=registry_id, url=filename, status="IMPORTED")
        db.add(src)
        asset = SourceAsset(source_id=None, material_id=mat.id, url=filename, checksum=checksum, raw_text=text)
        db.add(asset); db.commit()
        is_complete = len(text) >= 200
        at = ArabicText(material_id=mat.id, full_text=text, is_complete=is_complete)
        db.add(at); db.commit(); db.refresh(at)
        for i, seg in enumerate(segment_arabic(text)):
            db.add(TextSegment(arabic_text_id=at.id, order_index=i, text_ar=seg))
        mat.status = "EXTRACTED"
        job.status = "COMPLETED"; job.material_id = mat.id
        db.add(ProcessingJob(material_id=mat.id, job_type="PDF_IMPORT", status="COMPLETED"))
        db.commit()
        return {"job": job, "material": mat, "status": "COMPLETED", "duplicate_of": None}
    except Exception as e:
        job.status = "FAILED"; job.error = str(e); db.commit()
        db.add(ProcessingJob(job_type="PDF_IMPORT", status="FAILED", error=str(e))); db.commit()
        return {"job": job, "material": None, "status": "FAILED", "error": str(e)}


def import_html(db, url: str, scholar_id=None, registry_id=None, _fetch=None):
    from ..models import AcquisitionJob, ProcessingJob, SourceAsset, Material, ArabicText, TextSegment, Source
    job = AcquisitionJob(url=url, status="RUNNING", registry_id=registry_id)
    db.add(job); db.commit(); db.refresh(job)
    try:
        if _fetch is not None:
            html = _fetch(url)
            final_url = url
        else:
            html, final_url = fetch_url(url)
        text = extract_main_text(html) if "<" in html else html
        checksum = compute_checksum(text)
        dup_asset = db.query(SourceAsset).filter(SourceAsset.checksum == checksum).first()
        dup_mat = db.query(Material).filter(Material.source_url.in_([url, final_url])).first()
        if dup_asset or dup_mat:
            job.status = "DUPLICATE"; job.material_id = (dup_mat.id if dup_mat else dup_asset.material_id); db.commit()
            return {"job": job, "material": dup_mat, "status": "DUPLICATE", "duplicate_of": job.material_id}
        mat = Material(scholar_id=scholar_id, title_id=text[:120], source_url=final_url, status="IMPORTED", rights_status="UNKNOWN")
        db.add(mat); db.commit(); db.refresh(mat)
        src = Source(material_id=mat.id, registry_id=registry_id, url=final_url, status="IMPORTED")
        db.add(src)
        asset = SourceAsset(source_id=None, material_id=mat.id, url=final_url, checksum=checksum, raw_text=text)
        db.add(asset); db.commit()
        is_complete = len(text) >= 200
        at = ArabicText(material_id=mat.id, full_text=text, is_complete=is_complete)
        db.add(at); db.commit(); db.refresh(at)
        for i, seg in enumerate(segment_arabic(text)):
            db.add(TextSegment(arabic_text_id=at.id, order_index=i, text_ar=seg))
        mat.status = "EXTRACTED"
        job.status = "COMPLETED"; job.material_id = mat.id
        db.add(ProcessingJob(material_id=mat.id, job_type="IMPORT", status="COMPLETED"))
        db.commit()
        return {"job": job, "material": mat, "status": "COMPLETED", "duplicate_of": None}
    except Exception as e:
        job.status = "FAILED"; job.error = str(e); db.commit()
        db.add(ProcessingJob(job_type="IMPORT", status="FAILED", error=str(e))); db.commit()
        return {"job": job, "material": None, "status": "FAILED", "error": str(e)}
