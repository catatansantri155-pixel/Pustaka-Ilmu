"""Rebuild derived search documents in bounded batches (safe to rerun)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "services/api"))
from app.db import SessionLocal
from app.models import Material
from app.services.catalog import index_material


def reindex():
    with SessionLocal() as db:
        last = ""
        count = 0
        while True:
            rows = db.query(Material).filter(Material.id > last).order_by(Material.id).limit(100).all()
            if not rows:
                break
            for row in rows:
                index_material(db, row)
                count += 1
            last = rows[-1].id
            db.commit()
        print(f"{count} dokumen pencarian dibangun ulang")


if __name__ == "__main__":
    reindex()
