#!/usr/bin/env bash
# Backup database Pustaka Ilmu ke <repo>/backups/
# DATABASE_URL dibaca dari env, atau dari services/api/.env.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
mkdir -p "$BACKUP_DIR"
TS="$(date +%Y%m%d-%H%M%S)"

DATABASE_URL="${DATABASE_URL:-}"
if [ -z "$DATABASE_URL" ] && [ -f "$ROOT/services/api/.env" ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ROOT/services/api/.env" | head -1 | cut -d= -f2- || true)"
fi
DATABASE_URL="${DATABASE_URL:-sqlite:///$ROOT/services/api/pustaka.db}"

case "$DATABASE_URL" in
  sqlite:///*)
    DB_PATH="${DATABASE_URL#sqlite:///}"
    case "$DB_PATH" in
      /*) ;;
      *) DB_PATH="$ROOT/services/api/$DB_PATH" ;;
    esac
    OUT="$BACKUP_DIR/backup-$TS.db"
    if command -v sqlite3 >/dev/null 2>&1; then
      sqlite3 "$DB_PATH" ".backup '$OUT'"
    else
      cp "$DB_PATH" "$OUT"
    fi
    echo "$OUT"
    ;;
  postgresql*|postgres://*)
    OUT="$BACKUP_DIR/backup-$TS.sql"
    pg_dump "$DATABASE_URL" > "$OUT"
    echo "$OUT"
    ;;
  *)
    echo "DATABASE_URL tidak didukung untuk backup: $DATABASE_URL" >&2
    exit 1
    ;;
esac
