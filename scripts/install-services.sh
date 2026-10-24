#!/usr/bin/env bash
# Memasang (ulang) semua unit systemd Pustaka Ilmu di VM dev ini.
# Unit di /etc hilang setiap VM berganti; jalankan skrip ini (atau
# scripts/start-all.sh yang memanggilnya) untuk memulihkan semuanya.
# Aset persisten yang diasumsikan ada: .env backend, ~/.cloudflared/
# (cert + kredensial tunnel), ~/workspace/tools/cloudflared + hosts_cf.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="$HOME/workspace/tools"
API_ENV="$ROOT/services/api/.env"

cat > /etc/systemd/system/pustaka-tunnel.service <<EOF
[Unit]
Description=Pustaka Ilmu - PG tunnel ke Supabase (khusus VM dev)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$ROOT
EnvironmentFile=$API_ENV
ExecStart=$ROOT/.venv/bin/python $ROOT/scripts/pg_tunnel.py 15432
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/pustaka-api.service <<EOF
[Unit]
Description=Pustaka Ilmu API (FastAPI)
After=network.target pustaka-tunnel.service
Wants=pustaka-tunnel.service

[Service]
Type=simple
User=root
WorkingDirectory=$ROOT/services/api
EnvironmentFile=$API_ENV
ExecStart=$ROOT/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/pustaka-web.service <<EOF
[Unit]
Description=Pustaka Ilmu Web (Next.js)
After=network.target pustaka-api.service

[Service]
Type=simple
User=root
WorkingDirectory=$ROOT/apps/web
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port 3000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/pustaka-relays.service <<EOF
[Unit]
Description=Pustaka Ilmu - SNI relay egress (khusus VM dev: cloudflared via proxy)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$ROOT
EnvironmentFile=$API_ENV
ExecStart=$ROOT/.venv/bin/python $ROOT/scripts/sni_relay.py 443 7844
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/pustaka-tunnel-api.service <<EOF
[Unit]
Description=Pustaka Ilmu - Cloudflare Named Tunnel pustaka-api (api.catatansantri.com -> localhost:8000)
After=network.target pustaka-api.service pustaka-relays.service
Wants=pustaka-api.service pustaka-relays.service

[Service]
Type=simple
User=root
ExecStart=/usr/bin/unshare -m /bin/bash -c "mount --bind $TOOLS/hosts_cf /etc/hosts && exec $TOOLS/cloudflared tunnel --config $HOME/.cloudflared/config.yml --protocol http2 --edge 127.0.0.1:7844 run pustaka-api"
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now pustaka-tunnel pustaka-api pustaka-web pustaka-relays pustaka-tunnel-api
echo "Semua unit Pustaka Ilmu terpasang & dijalankan."
