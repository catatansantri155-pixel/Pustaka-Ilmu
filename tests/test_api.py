import pytest
from app.models import Material, ArabicText, TextSegment, Translation, TranslationSegment, PublicationApproval, Scholar, User
from app.services.gate import evaluate_publication, content_fingerprint
from app.services.search import normalize_query, expand_query
from app.services.audit import audit_translation
from app.services.importer import compute_checksum, assert_safe_url
from app.security import hash_password
from app.models import Role

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"

def test_login_success(client):
    r = client.post("/api/auth/login", json={"email": "admin@pustaka.local", "password": "admin12345"})
    assert r.status_code == 200
    assert "access_token" in r.json()

def test_login_fail(client):
    r = client.post("/api/auth/login", json={"email": "admin@pustaka.local", "password": "salah"})
    assert r.status_code == 401

def test_rbac_anon_denied(client):
    r = client.get("/api/admin/dashboard")
    assert r.status_code in (401, 403)

def test_rbac_viewer_denied(client, db):
    role = db.query(Role).filter(Role.name=="viewer").first()
    u = User(email="viewer@test.local", password_hash=hash_password("viewer123"), full_name="Viewer", role_id=role.id)
    db.add(u); db.commit()
    r = client.post("/api/auth/login", json={"email": "viewer@test.local", "password": "viewer123"})
    tok = r.json()["access_token"]
    r2 = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {tok}"})
    assert r2.status_code == 403

def test_rbac_admin_ok(client, admin_headers):
    r = client.get("/api/admin/dashboard", headers=admin_headers)
    assert r.status_code == 200
    assert "materials_total" in r.json()

def test_gate_rejects_demo(db):
    m = db.query(Material).filter(Material.is_demo==True).first()
    blockers = evaluate_publication(db, m)
    assert len(blockers) > 0

def _make_complete(db, suffix):
    sch = db.query(Scholar).first()
    m = Material(scholar_id=sch.id, title_id=f"Materi Wudu Lengkap {suffix}", title_ar="الوضوء", status="ADMIN_REVIEW", rights_status="CLEARED", source_url="https://example.com/fatwa")
    db.add(m); db.commit(); db.refresh(m)
    at = ArabicText(material_id=m.id, full_text="نص عربي كامل", is_complete=True); db.add(at); db.commit(); db.refresh(at)
    s1 = TextSegment(arabic_text_id=at.id, order_index=0, text_ar="نص عربي كامل"); db.add(s1); db.commit(); db.refresh(s1)
    tr = Translation(material_id=m.id, model="test", prompt_version="id-ar-v1", status="TRANSLATED"); db.add(tr); db.commit(); db.refresh(tr)
    db.add(TranslationSegment(translation_id=tr.id, text_segment_id=s1.id, text_id="Teks Arab lengkap")); db.commit()
    admin = db.query(User).filter(User.email=="admin@pustaka.local").first()
    db.add(PublicationApproval(material_id=m.id, admin_id=admin.id, decision="APPROVED", content_hash=content_fingerprint(db, m))); db.commit()
    return m

def test_gate_passes_complete(db):
    m = _make_complete(db, "gate")
    assert evaluate_publication(db, m) == []

def test_search_normalize():
    assert normalize_query("وُضُوء") == normalize_query("وضوء") or "وضوء" in expand_query("wudhu")
    assert any("wudu" in t for t in expand_query("wudhu"))
    assert any("وضوء" in t for t in expand_query("wudhu"))

def test_search_endpoint_finds_wudu(client, db, admin_headers):
    m = _make_complete(db, "search")
    # approve + publish via API
    r = client.post(f"/api/admin/materials/{m.id}/publish", headers=admin_headers)
    assert r.status_code == 200, r.text
    r2 = client.get("/api/search", params={"q": "wudhu"})
    assert r2.json()["total"] >= 1
    r3 = client.get("/api/search", params={"q": "وضوء"})
    assert r3.json()["total"] >= 1

def test_checksum_dedup(db):
    c1 = compute_checksum("teks   sama")
    c2 = compute_checksum("teks sama")
    assert c1 == c2
    from app.services.importer import import_html
    html = "<html><body><article>" + ("Ini teks panjang untuk pengujian. " * 20) + "</article></body></html>"
    fake = lambda url: html
    r1 = import_html(db, "https://example.com/dedup-test", _fetch=fake)
    assert r1["status"] == "COMPLETED"
    r2 = import_html(db, "https://example.com/dedup-test", _fetch=fake)
    assert r2["status"] == "DUPLICATE"

def test_audit_negation():
    findings = audit_translation([("لا يجوز هذا الفعل", "Perbuatan ini boleh dilakukan")])
    assert any(f["rule"]=="NEGATION_MISSING" and f["severity"]=="HIGH" for f in findings)

def test_audit_number():
    findings = audit_translation([("العدد ٥ مرات في اليوم", "Dilakukan setiap hari")])
    assert any(f["rule"]=="NUMBER_MISSING" and f["severity"]=="HIGH" for f in findings)

def test_ssrf_loopback():
    with pytest.raises(Exception):
        assert_safe_url("http://127.0.0.1/admin")

def test_ssrf_metadata():
    with pytest.raises(Exception):
        assert_safe_url("http://169.254.169.254/latest/meta-data/")

def test_translate_no_key(client, db, admin_headers):
    m = db.query(Material).filter(Material.is_demo==True).first()
    r = client.post(f"/api/admin/materials/{m.id}/translate", headers=admin_headers)
    assert r.status_code == 200, r.text
    assert r.json()["ai_run"]["status"] == "FAILED"

# --- SSRF guard berlapis (perbaikan importer via proxy) ---
from app.services import importer as importer_mod

def test_ssrf_registry_domain_rejected():
    with pytest.raises(Exception):
        importer_mod.assert_safe_url("https://example.com/artikel", allowed_domains={"binbaz.org.sa"})

def test_ssrf_registry_subdomain_allowed_with_proxy(monkeypatch):
    monkeypatch.setenv("https_proxy", "http://proxy.local:3128")
    # tidak boleh raise: domain registry + mode proxy (tanpa resolve lokal)
    importer_mod.assert_safe_url("https://www.binbaz.org.sa/fatwas/1", allowed_domains={"binbaz.org.sa"})

def test_ssrf_literal_ip_rejected_even_with_proxy(monkeypatch):
    monkeypatch.setenv("https_proxy", "http://proxy.local:3128")
    for u in ["https://127.0.0.1/admin", "https://192.168.1.10/x", "https://169.254.169.254/latest", "https://8.8.8.8/x"]:
        with pytest.raises(Exception):
            importer_mod.assert_safe_url(u)

def test_ssrf_non_https_rejected():
    with pytest.raises(Exception):
        importer_mod.assert_safe_url("http://binbaz.org.sa/fatwas/1", allowed_domains={"binbaz.org.sa"})

class _Resp:
    def __init__(self, status, text="", headers=None, url=""):
        self.status_code = status; self.text = text; self.headers = headers or {}; self.url = url
    def raise_for_status(self): pass

def _fake_client_class(handler):
    class FakeClient:
        captured = {}
        def __init__(self, **kw): FakeClient.captured = kw
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def get(self, url): return handler(url)
    return FakeClient

def test_fetch_via_proxy_manual_redirect(monkeypatch):
    monkeypatch.setenv("https_proxy", "http://proxy.local:3128")
    def handler(url):
        if url == "https://binbaz.org.sa/fatwas/3785":
            return _Resp(301, headers={"location": "https://binbaz.org.sa/fatwas/977/judul"}, url=url)
        return _Resp(200, text="<html><body><article>isi fatwa</article></body></html>", url=url)
    Fake = _fake_client_class(handler)
    monkeypatch.setattr(importer_mod.httpx, "Client", Fake)
    html, final = importer_mod.fetch_url("https://binbaz.org.sa/fatwas/3785", allowed_domains={"binbaz.org.sa"})
    assert "isi fatwa" in html
    assert final == "https://binbaz.org.sa/fatwas/977/judul"
    assert Fake.captured.get("trust_env") is True
    assert Fake.captured.get("follow_redirects") is False

def test_fetch_redirect_to_private_ip_rejected(monkeypatch):
    monkeypatch.setenv("https_proxy", "http://proxy.local:3128")
    def handler(url):
        return _Resp(302, headers={"location": "https://127.0.0.1/admin"}, url=url)
    monkeypatch.setattr(importer_mod.httpx, "Client", _fake_client_class(handler))
    with pytest.raises(Exception):
        importer_mod.fetch_url("https://binbaz.org.sa/fatwas/3785", allowed_domains={"binbaz.org.sa"})

def test_no_proxy_ipv6_entries_filtered():
    raw = "localhost,127.0.0.1,::1,[::1],fd8b:4f84::1,[fd8b:4f84::1]"
    out = importer_mod._filtered_no_proxy(raw)
    assert "[" not in out and "]" not in out
    assert "localhost" in out and "127.0.0.1" in out

def test_ssl_verify_uses_system_bundle():
    v = importer_mod._ssl_verify()
    assert v is True or type(v).__name__ == "SSLContext"
