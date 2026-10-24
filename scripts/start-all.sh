#!/usr/bin/env bash
# Menjalankan Pustaka Ilmu (API :8000 + Web :3000) di VM ini.
# Memakai systemd bila unit terpasang; jika tidak, fallback nohup.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 1) .env backend bila belum ada
if [ ! -f services/api/.env ]; then
  JWT="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
  cat > services/api/.env <<EOF
DATABASE_URL=sqlite:///$ROOT/services/api/pustaka.db
JWT_SECRET=$JWT
ADMIN_PASSWORD=admin12345
AI_API_BASE=
AI_API_KEY=
<MASKED_SECRET_001>
REDIS_URL=redis://localhost:6379/0
CELERY_TASK_ALWAYS_EAGER=true
EOF
  echo ".env dibuat (JWT_SECRET baru). ADMIN_PASSWORD default dev: admin12345 — GANTI sebelum produksi."
fi

# 2) Seed database (idempoten)
if [ ! -f services/api/pustaka.db ]; then
  (cd services/api && "$ROOT/.venv/bin/python" -m app.seed)
fi

# 3) Build frontend bila belum ada hasil build
if [ ! -d apps/web/.next ]; then
  (cd apps/web && npm install && NEXT_PUBLIC_API_BASE="http://localhost:8000" NODE_OPTIONS=--max-old-space-size=2048 npm run build)
fi

# 3b) Segarkan variabel proxy di .env dari environment sesi ini.
#     Token proxy egress BERGANTI tiap VM/sesi; nilai basi di .env membuat
#     relay & tunnel ditolak proxy. Wajib dijalankan dari shell agen.
python3 - <<'PYEOF' || true
import os
path = "services/api/.env"
keys = ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "NO_PROXY", "no_proxy"]
if os.path.exists(path):
    lines = open(path).read().splitlines()
    seen, out = set(), []
    for ln in lines:
        k = ln.split("=", 1)[0] if "=" in ln else ""
        if k in keys and k in os.environ:
            out.append(f"{k}={os.environ[k]}"); seen.add(k)
        else:
            out.append(ln)
    for k in keys:
        if k not in seen and k in os.environ:
            out.append(f"{k}={os.environ[k]}")
    open(path, "w").write("\n".join(out) + "\n")
    print("Proxy .env disegarkan.")
PYEOF

# 4) Tunnel PostgreSQL (khusus VM dev ini): bila DATABASE_URL menunjuk
#    127.0.0.1:15432, koneksi ke Supabase harus lewat relay proxy lokal.
if grep -q "127.0.0.1:15432" services/api/.env && ! ss -ltn | grep -q 15432; then
  mkdir -p logs
  nohup "$ROOT/.venv/bin/python" "$ROOT/scripts/pg_tunnel.py" 15432 >> "$ROOT/logs/pg_tunnel.log" 2>&1 &
  sleep 1
  echo "Tunnel PG aktif di 127.0.0.1:15432"
fi

# 5) Jalankan server
if ! systemctl cat pustaka-api.service >/dev/null 2>&1; then
  # Unit hilang (VM berganti) — pasang ulang semua unit lebih dulu
  bash "$ROOT/scripts/install-services.sh" || true
fi
if systemctl cat pustaka-api.service >/dev/null 2>&1; then
  systemctl enable --now pustaka-tunnel pustaka-api pustaka-web pustaka-relays pustaka-tunnel-api
  systemctl --no-pager status pustaka-api pustaka-web | head -20
else
  mkdir -p logs
  (cd services/api && nohup "$ROOT/.venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 >> "$ROOT/logs/api.log" 2>&1 &)
  (cd apps/web && nohup node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port 3000 >> "$ROOT/logs/web.log" 2>&1 &)
fi

sleep 3
echo "API : $(curl -s http://localhost:8000/health || echo GAGAL)"
echo "Web : $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ || echo GAGAL)"
