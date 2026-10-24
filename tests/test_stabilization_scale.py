"""Regression coverage for publication integrity, editorial operations and scale."""
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
import pytest
from sqlalchemy import event
from app.models import (Material, ArabicText, TextSegment, Translation, TranslationSegment,
                        PublicationApproval, CorrectionReport, QualityFinding,
                        MaterialSearch, ContentTask, User, SourceRegistry)
from app.services.gate import evaluate_publication, content_fingerprint
from app.services.catalog import index_material
from app.security import create_mfa_token
from test_api import _make_complete


def test_mfa_challenge_cannot_access_admin(client, db):
    admin = db.query(User).filter_by(email="admin@pustaka.local").one()
    headers = {"Authorization": "Bearer " + create_mfa_token(admin.id)}
    assert client.get("/api/admin/dashboard", headers=headers).status_code == 401
    assert client.post("/api/auth/mfa/enroll", headers=headers).status_code == 401


def test_approval_is_bound_to_text(db):
    m = _make_complete(db, "snapshot")
    assert evaluate_publication(db, m) == []
    t = db.query(TranslationSegment).join(Translation).filter(Translation.material_id == m.id).one()
    t.text_id += " berubah"
    db.commit()
    assert any("kedaluwarsa" in b for b in evaluate_publication(db, m))


def test_latest_rejection_overrides_approval(db):
    m = _make_complete(db, "reject")
    db.add(PublicationApproval(material_id=m.id, decision="REJECTED",
                              created_at=datetime.now(timezone.utc) + timedelta(seconds=1)))
    db.commit()
    assert any("persetujuan" in b for b in evaluate_publication(db, m))


def test_legacy_approval_requires_reapproval(db):
    m = _make_complete(db, "legacy")
    approval = db.query(PublicationApproval).filter_by(material_id=m.id).one()
    approval.content_hash = ""; db.commit()
    assert any("kedaluwarsa" in b for b in evaluate_publication(db, m))


def test_blank_translation_and_missing_source_text_block(db):
    m = _make_complete(db, "empty")
    t = db.query(TranslationSegment).join(Translation).filter(Translation.material_id == m.id).one()
    t.text_id = "  "
    db.commit()
    assert any("kosong" in b for b in evaluate_publication(db, m))
    at = db.query(ArabicText).filter_by(material_id=m.id).one()
    at.full_text += " نص محذوف"
    db.commit()
    assert any("keseluruhan" in b for b in evaluate_publication(db, m))


def test_edit_published_material_hides_until_reapproval(client, db, admin_headers):
    m = _make_complete(db, "edit")
    assert client.post(f"/api/admin/materials/{m.id}/publish", headers=admin_headers).status_code == 200
    segment = db.query(TextSegment).join(ArabicText).filter(ArabicText.material_id == m.id).one()
    path = f"/api/admin/materials/{m.id}/segments/{segment.id}"
    assert client.patch(path, headers=admin_headers, json={"text_id": " "}).status_code == 422
    assert client.patch(path, headers=admin_headers, json={"text_id": "Teks Arab lengkap diperbarui"}).status_code == 200
    assert client.get(f"/api/materials/{m.id}").status_code == 404
    assert client.post(f"/api/admin/materials/{m.id}/publish", headers=admin_headers).status_code == 422
    assert client.post(f"/api/admin/materials/{m.id}/approve", headers=admin_headers).status_code == 200
    assert client.post(f"/api/admin/materials/{m.id}/publish", headers=admin_headers).status_code == 200


def test_editorial_validation_and_topic_cycle(client, admin_headers):
    scholar = client.post("/api/admin/scholars", headers=admin_headers, json={"name_id": "Ulama Uji"})
    assert scholar.status_code == 201, scholar.text
    sid = scholar.json()["id"]
    assert client.put(f"/api/admin/scholars/{sid}", headers=admin_headers,
                      json={"name_id": "Ulama Diperbarui", "bio_id": "Catatan sumber uji"}).status_code == 200
    assert client.post("/api/admin/scholars", headers=admin_headers, json={"name_id": "  "}).status_code == 422
    parent = client.post("/api/admin/topics", headers=admin_headers, json={"code": "TEST-PARENT", "name_id": "Induk"}).json()
    child = client.post("/api/admin/topics", headers=admin_headers,
                        json={"code": "TEST-CHILD", "name_id": "Anak", "parent_id": parent["id"]}).json()
    assert client.put(f"/api/admin/topics/{parent['id']}", headers=admin_headers,
                      json={"code": "TEST-PARENT", "name_id": "Induk", "parent_id": child["id"]}).status_code == 422
    assert client.post("/api/admin/topics", headers=admin_headers, json={"code": "TEST-PARENT", "name_id": "Duplikat"}).status_code == 409
    assert client.post("/api/admin/issues", headers=admin_headers,
                       json={"code": "TEST-BAD", "title_id": "Persoalan", "topic_id": "missing"}).status_code == 422


def test_metadata_and_report_workflow(client, db, admin_headers):
    m = _make_complete(db, "metadata")
    m.status = "PUBLISHED_AI"; db.commit()
    report = client.post("/api/correction-reports", json={"material_id": m.id, "message": "Tolong periksa terjemahan ini."})
    assert report.status_code == 201
    rid = report.json()["id"]
    path = f"/api/admin/correction-reports/{rid}"
    assert client.patch(path, json={"status": "RESOLVED", "notes": "Sudah dicek."}).status_code == 401
    assert client.patch(path, headers=admin_headers, json={"status": "RESOLVED", "notes": "Dicek terhadap sumber asli."}).status_code == 200
    assert client.patch(path, headers=admin_headers, json={"status": "DISMISSED", "notes": "Ganti keputusan."}).status_code == 409
    meta = {"title_id": "Judul Diperbarui", "scholar_id": m.scholar_id, "topic_ids": [], "issue_ids": []}
    assert client.put(f"/api/admin/materials/{m.id}/metadata", headers=admin_headers, json=meta).status_code == 200
    assert client.get(f"/api/materials/{m.id}").status_code == 404
    assert client.post("/api/correction-reports", json={"material_id": m.id, "message": "Laporan pada draf tersembunyi"}).status_code == 404


def test_public_report_rejects_foreign_segment(client, db):
    a = _make_complete(db, "report-a"); b = _make_complete(db, "report-b")
    a.status = "PUBLISHED_AI"; db.commit()
    seg = db.query(TextSegment).join(ArabicText).filter(ArabicText.material_id == b.id).one()
    assert client.post("/api/correction-reports", json={"material_id": a.id, "segment_id": seg.id,
                       "message": "Segmen milik materi lain"}).status_code == 422


def test_pagination_and_query_count_for_thousand_materials(client, db):
    rows = [Material(title_id=f"Skala Seribu {i}", status="PUBLISHED_AI", is_demo=False) for i in range(1000)]
    db.add_all(rows); db.flush()
    db.add_all([MaterialSearch(material_id=m.id, normalized_text=f"skala seribu {i}") for i,m in enumerate(rows)])
    db.commit()
    queries = []
    engine = db.get_bind()
    def count(conn, cursor, statement, params, context, executemany):
        if statement.lstrip().upper().startswith("SELECT"):
            queries.append(statement)
    event.listen(engine, "before_cursor_execute", count)
    try:
        first = client.get("/api/catalog/materials", params={"q": "skala seribu", "limit": 24}).json()
        assert first["total"] == 1000 and len(first["items"]) == 24 and first["has_more"]
        assert len(queries) <= 5  # Count + page + scholar + topics; independent of collection size.
        last = client.get("/api/catalog/materials", params={"q": "skala seribu", "offset": 984}).json()
        assert len(last["items"]) == 16 and not last["has_more"]
        assert not ({r["id"] for r in first["items"]} & {r["id"] for r in last["items"]})
    finally:
        event.remove(engine, "before_cursor_execute", count)
        ids = [m.id for m in rows]
        db.query(MaterialSearch).filter(MaterialSearch.material_id.in_(ids)).delete(synchronize_session=False)
        db.query(Material).filter(Material.id.in_(ids)).delete(synchronize_session=False)
        db.commit()
    assert client.get("/api/catalog/materials?limit=101").status_code == 422
    assert client.get("/api/catalog/materials?offset=-1").status_code == 422


def test_catalog_matches_translation_and_filters(client, db):
    m = _make_complete(db, "index")
    m.status = "PUBLISHED_AI"
    ts = db.query(TranslationSegment).join(Translation).filter(Translation.material_id == m.id).one()
    ts.text_id = "Teks Arab lengkap dengan istilah istinja"
    index_material(db, m); db.commit()
    page = client.get("/api/catalog/materials", params={"q": "istinja", "scholar_id": m.scholar_id}).json()
    assert m.id in {r["id"] for r in page["items"]}
    assert client.get("/api/catalog/materials", params={"q": "istinja", "scholar_id": "other"}).json()["total"] == 0


def test_queue_dedup_claim_and_no_key_block(client, db, admin_headers, monkeypatch):
    from app.services.queue import enqueue, claim, run_one
    from app.config import settings
    m = _make_complete(db, "queue")
    one = enqueue(db, kind="TRANSLATE", material_id=m.id)
    two = enqueue(db, kind="TRANSLATE", material_id=m.id)
    assert one.id == two.id
    assert claim(db).id == one.id
    assert claim(db) is None
    one.status = "PENDING"; db.commit()
    monkeypatch.setattr(settings, "ai_api_key", "")
    assert run_one() == one.id
    db.expire_all()
    assert db.get(ContentTask, one.id).status == "BLOCKED"
    assert client.post(f"/api/admin/queue/{one.id}/retry", headers=admin_headers).status_code == 200
    one = db.get(ContentTask, one.id); one.status = "COMPLETED"; db.commit()
    assert client.post(f"/api/admin/queue/{one.id}/retry", headers=admin_headers).status_code == 409


def test_queue_retries_are_bounded(db, monkeypatch):
    from app.services.queue import enqueue, run_one
    from app.services import importer
    registry = db.query(SourceRegistry).first()
    task = enqueue(db, kind="IMPORT", url=f"https://{registry.domain}/queue-test", registry_id=registry.id)
    monkeypatch.setattr(importer, "assert_safe_url", lambda *a, **k: None)
    monkeypatch.setattr(importer, "import_html", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("network failure")))
    for expected in ("RETRY", "RETRY", "FAILED"):
        task.available_at = datetime.now(timezone.utc) - timedelta(seconds=1); db.commit()
        run_one(); db.expire_all(); task = db.get(ContentTask, task.id)
        assert task.status == expected
    assert task.attempts == 3


def test_pilot_integrity_and_idempotent_import(db):
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
    from import_pilot import load_pilot, MANIFEST
    manifest = json.loads(MANIFEST.read_text())
    result = load_pilot(db, manifest)
    assert result == {"imported_drafts": 30, "skipped_existing": 0, "quality_findings": 3, "published": 0}
    assert load_pilot(db, manifest)["skipped_existing"] == 30
    rows = db.query(Material).filter(Material.source_url.in_([r["source_url"] for r in manifest["materials"]])).all()
    assert len(rows) == 30
    assert all(m.status == "ADMIN_REVIEW" and m.rights_status == "UNKNOWN" for m in rows)
    assert all(evaluate_publication(db, m) for m in rows)


def test_verification_and_quality_review_are_version_bound(client, db, admin_headers):
    m = _make_complete(db, "quality-review")
    at = db.query(ArabicText).filter_by(material_id=m.id).one()
    segment = db.query(TextSegment).filter_by(arabic_text_id=at.id).one()
    at.full_text = segment.text_ar = "لا يجوز هذا الفعل"
    ts = db.query(TranslationSegment).join(Translation).filter(Translation.material_id == m.id).one()
    ts.text_id = "Perbuatan ini boleh dilakukan"
    db.commit()
    response = client.post(f"/api/admin/materials/{m.id}/quality-review", headers=admin_headers,
                           json={"rule": "NEGATION_MISSING", "segment_ref": "0", "notes": "Catatan pengecualian khusus untuk pengujian regresi."})
    assert response.status_code == 200, response.text
    assert not any("Audit teks terkini" in b for b in evaluate_publication(db, m))
    ts.text_id += " perubahan"; db.commit()
    assert any("Audit teks terkini" in b for b in evaluate_publication(db, m))
    result = client.post(f"/api/admin/materials/{m.id}/verification", headers=admin_headers,
                         json={"arabic_complete": True, "rights_evidence": "Bukti izin sumber untuk pengujian.", "notes": "Segmen sumber dicocokkan dalam pengujian."})
    assert result.status_code == 200, result.text
    db.expire_all()
    assert db.get(Material,m.id).status == "ADMIN_REVIEW"


def test_migration_is_additive_and_repeatable(tmp_path, monkeypatch):
    from sqlalchemy import create_engine, text, inspect
    from app import migrate
    engine = create_engine(f"sqlite:///{tmp_path/'legacy.db'}")
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE publication_approvals (id VARCHAR PRIMARY KEY, material_id VARCHAR, decision VARCHAR)"))
        conn.execute(text("INSERT INTO publication_approvals VALUES ('legacy','m','APPROVED')"))
    monkeypatch.setattr(migrate, "engine", engine)
    migrate.upgrade(); migrate.upgrade()
    with engine.connect() as conn:
        assert conn.execute(text("SELECT content_hash FROM publication_approvals WHERE id='legacy'")).scalar() == ""
    assert "content_tasks" in inspect(engine).get_table_names()
    assert "quality_reviews" in inspect(engine).get_table_names()


def test_backup_restore_sqlite(client, admin_headers, db, tmp_path, monkeypatch):
    import sqlite3
    from app.services.backup import create_backup
    monkeypatch.setenv("BACKUP_DIR", str(tmp_path))
    backup = create_backup()
    with sqlite3.connect(tmp_path / backup["file"]) as restored:
        assert restored.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        assert restored.execute("SELECT count(*) FROM materials").fetchone()[0] == db.query(Material).count()


def test_invalid_ai_output_preserves_existing_translation(db):
    from app.services.ai_adapter import translate_material
    m = _make_complete(db, "invalid-adapter")
    m.status = "PUBLISHED_AI"; db.commit()
    before = db.query(TranslationSegment).join(Translation).filter(Translation.material_id == m.id).one().text_id
    class BadAdapter:
        def translate_segments(self, segments):
            return []
    run = translate_material(db, m, adapter=BadAdapter())
    assert run.status == "FAILED" and m.status == "PUBLISHED_AI"
    assert db.query(TranslationSegment).join(Translation).filter(Translation.material_id == m.id).one().text_id == before
