import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from .celery_app import app
@app.task(name="import_source")
def import_source(url, scholar_id=None, registry_id=None):
    from app.db import SessionLocal
    from app.services.importer import import_html
    db = SessionLocal()
    try:
        r = import_html(db, url, scholar_id=scholar_id, registry_id=registry_id)
        return {"status": r["status"]}
    finally: db.close()
@app.task(name="translate_material")
def translate_material_task(material_id):
    from app.db import SessionLocal
    from app.models import Material
    from app.services.ai_adapter import translate_material
    db = SessionLocal()
    try:
        m = db.query(Material).filter(Material.id==material_id).first()
        run = translate_material(db, m)
        return {"status": run.status}
    finally: db.close()
