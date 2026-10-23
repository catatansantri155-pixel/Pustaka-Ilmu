"""Backup database: SQLite disalin via sqlite3 backup API, PostgreSQL via pg_dump.

Direktori tujuan: env BACKUP_DIR bila diset, selain itu <repo>/backups
(dihitung dari lokasi file ini: services/api/app/services -> naik 4 level).
"""
import os
import sqlite3
import subprocess
from datetime import datetime, timezone
from pathlib import Path

def get_backup_dir() -> Path:
    override = os.environ.get("BACKUP_DIR")
    if override:
        return Path(override)
    return Path(__file__).resolve().parents[4] / "backups"

def list_backups() -> list:
    d = get_backup_dir()
    if not d.exists():
        return []
    out = []
    for p in sorted(d.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
        if p.is_file():
            st = p.stat()
            out.append({"name": p.name, "size_bytes": st.st_size,
                        "created_at": datetime.fromtimestamp(st.st_mtime, timezone.utc).isoformat()})
    return out

def create_backup() -> dict:
    from ..db import engine
    backup_dir = get_backup_dir()
    backup_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    dialect = engine.dialect.name
    if dialect == "sqlite":
        db_path = engine.url.database
        if not db_path or db_path == ":memory:":
            raise RuntimeError("Database SQLite in-memory tidak bisa di-backup")
        dest = backup_dir / f"backup-{ts}.db"
        src = sqlite3.connect(str(db_path))
        try:
            dst = sqlite3.connect(str(dest))
            try:
                src.backup(dst)
            finally:
                dst.close()
        finally:
            src.close()
    elif dialect == "postgresql":
        dest = backup_dir / f"backup-{ts}.sql"
        url = str(engine.url.render_as_string(hide_password=False))
        with open(dest, "w") as fh:
            subprocess.run(["pg_dump", url], stdout=fh, check=True)
    else:
        raise RuntimeError(f"Backup belum didukung untuk dialect: {dialect}")
    return {"file": dest.name, "path": str(dest), "size_bytes": dest.stat().st_size}
