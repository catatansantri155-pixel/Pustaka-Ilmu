#!/usr/bin/env python3
"""Relay TCP lokal -> HTTP CONNECT proxy -> host PostgreSQL (Supabase pooler).

Dibutuhkan HANYA di VM dev ini: egress VM wajib lewat HTTP proxy dan DNS
lokal mengembalikan fake-IP untuk domain publik, jadi koneksi TCP langsung
ke Supabase tidak bisa. Di infrastruktur nyata (VPS/Cloudflare) file ini
tidak dipakai — DATABASE_URL menunjuk langsung ke host pooler Supabase.

Pakai: python3 pg_tunnel.py [listen_port] [target_host] [target_port]
Proxy dibaca dari env HTTPS_PROXY/https_proxy/HTTP_PROXY/http_proxy.
"""
import base64
import os
import select
import socket
import sys
import threading
from urllib.parse import urlparse

LISTEN_PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 15432
TARGET_HOST = sys.argv[2] if len(sys.argv) > 2 else "aws-0-ap-southeast-1.pooler.supabase.com"
TARGET_PORT = int(sys.argv[3]) if len(sys.argv) > 3 else 5432


def proxy_endpoint():
    raw = (os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
           or os.environ.get("HTTP_PROXY") or os.environ.get("http_proxy"))
    if not raw:
        raise SystemExit("env proxy tidak ditemukan (HTTPS_PROXY/http_proxy kosong)")
    u = urlparse(raw)
    auth = None
    if u.username:
        creds = f"{u.username}:{u.password or ''}".encode()
        auth = base64.b64encode(creds).decode()
    return u.hostname, u.port or 3128, auth


def open_tunnel():
    phost, pport, auth = proxy_endpoint()
    s = socket.create_connection((phost, pport), timeout=30)
    lines = [f"CONNECT {TARGET_HOST}:{TARGET_PORT} HTTP/1.1",
             f"Host: {TARGET_HOST}:{TARGET_PORT}",
             "Proxy-Connection: Keep-Alive"]
    if auth:
        lines.append(f"Proxy-Authorization: Basic {auth}")
    s.sendall(("\r\n".join(lines) + "\r\n\r\n").encode())
    buf = b""
    while b"\r\n\r\n" not in buf:
        chunk = s.recv(4096)
        if not chunk:
            raise OSError("proxy menutup koneksi saat CONNECT")
        buf += chunk
    status = buf.split(b"\r\n", 1)[0].decode(errors="replace")
    print(f"[tunnel] CONNECT {TARGET_HOST}:{TARGET_PORT} -> {status}", flush=True)
    if " 200 " not in status:
        raise OSError(f"CONNECT gagal: {status}")
    s.settimeout(None)
    return s


def relay(a, b):
    try:
        while True:
            r, _, _ = select.select([a, b], [], [], 300)
            if not r:
                break
            for src in r:
                data = src.recv(65536)
                if not data:
                    return
                (b if src is a else a).sendall(data)
    except OSError:
        pass
    finally:
        for s in (a, b):
            try:
                s.close()
            except OSError:
                pass


def handle(client):
    try:
        upstream = open_tunnel()
    except OSError as e:
        print(f"[tunnel] {e}", flush=True)
        client.close()
        return
    relay(client, upstream)


def main():
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("127.0.0.1", LISTEN_PORT))
    srv.listen(64)
    print(f"[tunnel] 127.0.0.1:{LISTEN_PORT} -> {TARGET_HOST}:{TARGET_PORT} via proxy", flush=True)
    while True:
        client, _ = srv.accept()
        threading.Thread(target=handle, args=(client,), daemon=True).start()


if __name__ == "__main__":
    main()
