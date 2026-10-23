import io
import pytest
import pyotp

from app.config import settings
from app.main import reset_rate_limits
from app.models import (
    Material, ArabicText, TextSegment, Translation, TranslationSegment,
    MaterialVersion, AuditLog, User, Role, Source, ProcessingJob, GlossaryTerm,
)
from app.security import hash_password
from app.services.transcription import transcribe_source


def _make_user(db, email, password, role_name_):
    role = db.query(Role).filter(Role.name == role_name_).first()
    u = db.query(User).filter(User.email == email).first()
    if not u:
        u = User(email=email, password_hash=hash_password(password), full_name="Test User", role_id=role.id)
        db.add(u); db.commit(); db.refresh(u)
    return u


def _minimal_pdf(text: str) -> bytes:
    """PDF 1 halaman minimal (font Helvetica + stream teks) yang bisa diekstrak pypdf."""
    safe = text.replace("\\", "").replace("(", "").replace(")", "")
    stream = f"BT /F1 14 Tf 72 720 Td ({safe}) Tj ET".encode()
    objects = []
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objects.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objects.append(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>")
    objects.append(b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream")
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    out = io.BytesIO()
    out.write(b"%PDF-1.4\n")
    offsets = []
    for i, obj in enumerate(objects, start=1):
        offsets.append(out.tell())
        out.write(f"{i} 0 obj\n".encode()); out.write(obj); out.write(b"\nendobj\n")
    xref_pos = out.tell()
    out.write(f"xref\n0 {len(objects)+1}\n".encode())
    out.write(b"0000000000 65535 f \n")
    for off in offsets:
        out.write(f"{off:010d} 00000 n \n".encode())
    out.write(f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF".encode())
    return out.getvalue()


# (1) MFA full flow
def test_mfa_full_flow(client, db):
    _make_user(db, "mfa@test.local", "mfa12345", "editor")
    _make_user(db, "plain@test.local", "plain12345", "editor")

    # login tanpa MFA tetap seperti lama untuk user lain
    r_plain = client.post("/api/auth/login", json={"email": "plain@test.local", "password": "plain12345"})
    assert r_plain.status_code == 200 and "access_token" in r_plain.json()

    r = client.post("/api/auth/login", json={"email": "mfa@test.local", "password": "mfa12345"})
    assert r.status_code == 200 and "access_token" in r.json()
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

    r = client.post("/api/auth/mfa/enroll", headers=headers)
    assert r.status_code == 200, r.text
    secret = r.json()["secret"]
    assert secret and r.json()["otpauth_uri"].startswith("otpauth://")

    # kode salah ditolak
    r_bad = client.post("/api/auth/mfa/activate", headers=headers, json={"code": "000000"})
    assert r_bad.status_code in (400, 401)

    good = pyotp.TOTP(secret).now()
    r = client.post("/api/auth/mfa/activate", headers=headers, json={"code": good})
    assert r.status_code == 200 and r.json()["mfa_enabled"] is True

    # login sekarang menuntut MFA, tanpa access_token
    r = client.post("/api/auth/login", json={"email": "mfa@test.local", "password": "mfa12345"})
    body = r.json()
    assert body.get("mfa_required") is True and "mfa_token" in body and "access_token" not in body

    # kode salah di verify ditolak
    r_bad = client.post("/api/auth/mfa/verify", json={"mfa_token": body["mfa_token"], "code": "000000"})
    assert r_bad.status_code in (400, 401)

    r = client.post("/api/auth/mfa/verify", json={"mfa_token": body["mfa_token"], "code": pyotp.TOTP(secret).now()})
    assert r.status_code == 200, r.text
    assert "access_token" in r.json() and r.json()["user"]["email"] == "mfa@test.local"

    # disable dengan kode valid
    headers2 = {"Authorization": f"Bearer {r.json()['access_token']}"}
    r = client.post("/api/auth/mfa/disable", headers=headers2, json={"code": pyotp.TOTP(secret).now()})
    assert r.status_code == 200 and r.json()["mfa_enabled"] is False
    r = client.post("/api/auth/login", json={"email": "mfa@test.local", "password": "mfa12345"})
    assert "access_token" in r.json()


# (2) Rate limit login
def test_rate_limit_login(client):
    old = settings.login_rate_limit_per_minute
    try:
        settings.login_rate_limit_per_minute = 3
        reset_rate_limits()
        codes = []
        for _ in range(4):
            r = client.post("/api/auth/login", json={"email": "admin@pustaka.local", "password": "admin12345"})
            codes.append(r.status_code)
        assert codes[:3] == [200, 200, 200], codes
        assert codes[3] == 429, codes
    finally:
        settings.login_rate_limit_per_minute = old
        reset_rate_limits()


# (3) PATCH segmen
def test_patch_segment(client, db, admin_headers):
    m = db.query(Material).filter(Material.is_demo == True).first()
    assert m is not None
    at = db.query(ArabicText).filter(ArabicText.material_id == m.id).first()
    seg = db.query(TextSegment).filter(TextSegment.arabic_text_id == at.id).order_by(TextSegment.order_index).first()
    assert seg is not None

    # enriched GET
    r = client.get(f"/api/admin/materials/{m.id}", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["arabic"]["full_text"] == at.full_text
    assert any(s["id"] == seg.id for s in data["arabic"]["segments"])
    assert data["translation"] is not None and "segments" in data["translation"]
    assert data["scholar"] is not None and data["scholar"]["name_id"]

    mv_before = db.query(MaterialVersion).filter(MaterialVersion.material_id == m.id).count()
    r = client.patch(f"/api/admin/materials/{m.id}/segments/{seg.id}", headers=admin_headers, json={"text_id": "Terjemahan hasil edit uji satu"})
    assert r.status_code == 200, r.text
    v1 = r.json()["version"]
    assert r.json()["text_id"] == "Terjemahan hasil edit uji satu"
    assert r.json()["material_version"] >= 1

    r = client.patch(f"/api/admin/materials/{m.id}/segments/{seg.id}", headers=admin_headers, json={"text_id": "Terjemahan hasil edit uji dua"})
    assert r.status_code == 200, r.text
    assert r.json()["version"] == v1 + 1
    assert r.json()["text_id"] == "Terjemahan hasil edit uji dua"

    db.expire_all()
    mv_after = db.query(MaterialVersion).filter(MaterialVersion.material_id == m.id).count()
    assert mv_after == mv_before + 2
    assert db.query(AuditLog).filter(AuditLog.action == "EDIT_SEGMENT", AuditLog.entity_id == m.id).count() >= 1
    tseg = db.query(TranslationSegment).filter(TranslationSegment.text_segment_id == seg.id).first()
    assert tseg.text_id == "Terjemahan hasil edit uji dua" and tseg.version == v1 + 1

    # segmen milik material lain -> 404
    r = client.patch(f"/api/admin/materials/{m.id}/segments/tidak-ada-segmen-ini", headers=admin_headers, json={"text_id": "x"})
    assert r.status_code == 404

    # viewer 403
    _make_user(db, "viewer2@test.local", "viewer123", "viewer")
    r_login = client.post("/api/auth/login", json={"email": "viewer2@test.local", "password": "viewer123"})
    vheaders = {"Authorization": f"Bearer {r_login.json()['access_token']}"}
    r = client.patch(f"/api/admin/materials/{m.id}/segments/{seg.id}", headers=vheaders, json={"text_id": "tidak boleh"})
    assert r.status_code == 403


# (4) Endpoint modules admin
def test_admin_modules(client, db, admin_headers):
    r = client.get("/api/admin/processing", headers=admin_headers)
    assert r.status_code == 200
    assert "acquisition_jobs" in r.json() and "processing_jobs" in r.json()

    r = client.get("/api/admin/ai-runs", headers=admin_headers)
    assert r.status_code == 200
    assert "runs" in r.json() and "totals" in r.json()
    for k in ("runs", "cost_estimate", "tokens_input", "tokens_output", "by_status"):
        assert k in r.json()["totals"]

    r = client.get("/api/admin/publication", headers=admin_headers)
    assert r.status_code == 200
    assert "items" in r.json() and len(r.json()["items"]) >= 1
    for item in r.json()["items"]:
        assert isinstance(item["blockers"], list) and "approvals" in item

    r = client.get("/api/admin/reports/summary", headers=admin_headers)
    assert r.status_code == 200
    for k in ("materials_by_status", "materials_by_scholar", "materials_by_topic", "findings_by_severity", "ai", "jobs"):
        assert k in r.json()
    for k in ("runs", "cost_estimate", "tokens_input", "tokens_output"):
        assert k in r.json()["ai"]
    assert "acquisition_by_status" in r.json()["jobs"] and "processing_by_status" in r.json()["jobs"]

    r = client.get("/api/admin/ai-settings", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data["ai_api_key_configured"], bool)
    assert isinstance(data["ai_api_base_configured"], bool)
    assert "ai_model" in data and "ai_cost_limit" in data
    # nilai key mentah tidak boleh bocor di mana pun di respons
    if settings.ai_api_key:
        assert settings.ai_api_key not in r.text
    assert set(data.keys()) == {"ai_api_base_configured", "ai_api_key_configured", "ai_model", "ai_cost_limit", "celery_eager", "redis_configured"}

    r = client.get("/api/admin/system", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["database"]["ok"] is True
    assert r.json()["app_version"] == "1.0.0"
    assert "backups" in r.json()


def test_glossary_crud(client, db, admin_headers):
    r = client.post("/api/admin/glossary", headers=admin_headers, json={"term_ar": "وضوء", "term_id": "wudu", "context": "thaharah"})
    assert r.status_code == 201, r.text
    gid = r.json()["id"]
    r = client.get("/api/admin/glossary", headers=admin_headers)
    assert any(g["id"] == gid for g in r.json())
    r = client.put(f"/api/admin/glossary/{gid}", headers=admin_headers, json={"term_ar": "وضوء", "term_id": "wudu (bersuci)", "context": "thaharah"})
    assert r.status_code == 200 and r.json()["term_id"] == "wudu (bersuci)"
    r = client.delete(f"/api/admin/glossary/{gid}", headers=admin_headers)
    assert r.status_code == 200
    r = client.get("/api/admin/glossary", headers=admin_headers)
    assert not any(g["id"] == gid for g in r.json())
    db.expire_all()
    assert db.query(AuditLog).filter(AuditLog.action.in_(["CREATE_GLOSSARY", "UPDATE_GLOSSARY", "DELETE_GLOSSARY"])).count() >= 3


# (5) Impor PDF
def test_import_pdf_text(client, db, admin_headers):
    pdf = _minimal_pdf("This is a test document with enough text for the PDF importer to extract and process successfully today")
    r = client.post("/api/admin/acquisition/import-pdf", headers=admin_headers,
                    files={"file": ("test-import.pdf", pdf, "application/pdf")})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "COMPLETED"
    assert r.json()["material"] is not None


def test_import_pdf_blank_needs_ocr(client, db, admin_headers):
    from pypdf import PdfWriter
    buf = io.BytesIO()
    w = PdfWriter(); w.add_blank_page(612, 792); w.write(buf)
    r = client.post("/api/admin/acquisition/import-pdf", headers=admin_headers,
                    files={"file": ("blank-scan.pdf", buf.getvalue(), "application/pdf")})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "NEEDS_OCR"
    assert r.json()["material"] is None
    db.expire_all()
    assert db.query(ProcessingJob).filter(ProcessingJob.job_type == "PDF_IMPORT", ProcessingJob.status == "NEEDS_OCR").count() >= 1


# (6) Transkripsi audio -> BLOCKED tercatat
def test_transcribe_audio_blocked(db, monkeypatch):
    monkeypatch.delenv("TRANSCRIPTION_ENABLED", raising=False)
    src = db.query(Source).filter(Source.content_format == "AUDIO").first()
    assert src is not None
    before = db.query(ProcessingJob).filter(ProcessingJob.job_type == "TRANSCRIPTION").count()
    job = transcribe_source(db, src)
    assert job.status == "BLOCKED"
    db.expire_all()
    after = db.query(ProcessingJob).filter(ProcessingJob.job_type == "TRANSCRIPTION", ProcessingJob.status == "BLOCKED").count()
    assert after >= 1
    assert db.query(ProcessingJob).filter(ProcessingJob.job_type == "TRANSCRIPTION").count() == before + 1


# (7) Backup endpoint
def test_backup_endpoint(client, db, admin_headers, tmp_path, monkeypatch):
    monkeypatch.setenv("BACKUP_DIR", str(tmp_path))
    r = client.post("/api/admin/system/backup", headers=admin_headers)
    assert r.status_code == 200, r.text
    fname = r.json()["file"]
    assert r.json()["size_bytes"] > 0
    assert (tmp_path / fname).exists()
    r = client.get("/api/admin/system", headers=admin_headers)
    assert any(b["name"] == fname for b in r.json()["backups"])

