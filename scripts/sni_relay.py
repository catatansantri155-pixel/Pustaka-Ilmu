#!/usr/bin/env python3
"""Relay SNI lokal -> HTTP CONNECT proxy -> host asli (khusus VM dev ini).

Egress VM wajib lewat HTTP proxy dan DNS lokal mengembalikan fake-IP, jadi
program yang mengabaikan env proxy (mis. cloudflared) tidak bisa keluar.
Relay ini mendengarkan di 127.0.0.1 pada port-port yang diberikan, membaca
SNI dari TLS ClientHello pertama, lalu meneruskan koneksi lewat CONNECT
proxy ke host SNI tersebut pada port yang sama. TLS tetap end-to-end.

Pakai: python3 sni_relay.py 443 7844
Proxy dibaca dari env HTTPS_PROXY/https_proxy/HTTP_PROXY/http_proxy.
Di infrastruktur nyata file ini tidak dipakai.
"""
import base64
import os
import select
import socket
import sys
import threading
from urllib.parse import urlparse


def proxy_endpoint():
    raw = (os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
           or os.environ.get("HTTP_PROXY") or os.environ.get("http_proxy"))
    if not raw:
        raise SystemExit("env proxy tidak ditemukan")
    u = urlparse(raw)
    auth = None
    if u.username:
        auth = base64.b64encode(f"{u.username}:{u.password or ''}".encode()).decode()
    return u.hostname, u.port or 3128, auth


def parse_sni(data: bytes) -> str | None:
    # TLS record header 5 byte; handshake ClientHello; cari ekstensi server_name
    try:
        if len(data) < 5 or data[0] != 0x16:
            return None
        rec_len = int.from_bytes(data[3:5], "big")
        body = data[5:5 + rec_len]
        if len(body) < 4 or body[0] != 0x01:  # ClientHello
            return None
        p = 4  # handshake header
        p += 2 + 32  # version + random
        sid_len = body[p]; p += 1 + sid_len
        cs_len = int.from_bytes(body[p:p + 2], "big"); p += 2 + cs_len
        comp_len = body[p]; p += 1 + comp_len
        ext_total = int.from_bytes(body[p:p + 2], "big"); p += 2
        end = p + ext_total
        while p + 4 <= end:
            etype = int.from_bytes(body[p:p + 2], "big")
            elen = int.from_bytes(body[p + 2:p + 4], "big")
            p += 4
            if etype == 0:  # server_name
                q = p
                q += 2  # list length
                if body[q] != 0:  # host_name
                    return None
                q += 1
                nlen = int.from_bytes(body[q:q + 2], "big"); q += 2
                return body[q:q + nlen].decode()
            p += elen
    except (IndexError, UnicodeDecodeError):
        return None
    return None


def open_via_proxy(host: str, port: int) -> socket.socket:
    phost, pport, auth = proxy_endpoint()
    s = socket.create_connection((phost, pport), timeout=30)
    lines = [f"CONNECT {host}:{port} HTTP/1.1", f"Host: {host}:{port}",
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
    if " 200 " not in status:
        raise OSError(f"CONNECT {host}:{port} gagal: {status}")
    s.settimeout(None)
    return s


def relay(a, b, first: bytes):
    try:
        b.sendall(first)
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


# Port 7844 = edge Cloudflare Tunnel. Proxy egress menolak CONNECT ke
# hostname *.argotunnel.com (stall/tutup) tetapi menerima CONNECT ke IP
# edge langsung — jadi port ini selalu diteruskan ke IP edge tetap.
FIXED_TARGET = {7844: ("198.41.192.7", 7844)}


def handle(client, port):
    try:
        client.settimeout(15)
        first = client.recv(65536)
        if not first:
            client.close(); return
        if port in FIXED_TARGET:
            host, tport = FIXED_TARGET[port]
            upstream = open_via_proxy(host, tport)
            print(f"[sni-relay:{port}] edge tetap {host}:{tport} tersambung via proxy", flush=True)
            client.settimeout(None)
            relay(client, upstream, first)
            return
        host = parse_sni(first)
        if not host:
            print(f"[sni-relay:{port}] SNI tidak terbaca, koneksi ditutup", flush=True)
            client.close(); return
        upstream = open_via_proxy(host, port)
        print(f"[sni-relay:{port}] {host}:{port} tersambung via proxy", flush=True)
        client.settimeout(None)
        relay(client, upstream, first)
    except OSError as e:
        print(f"[sni-relay:{port}] {e}", flush=True)
        try:
            client.close()
        except OSError:
            pass


def serve(port):
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("0.0.0.0", port))
    srv.listen(64)
    print(f"[sni-relay] dengar 0.0.0.0:{port}", flush=True)
    while True:
        client, _ = srv.accept()
        threading.Thread(target=handle, args=(client, port), daemon=True).start()


if __name__ == "__main__":
    ports = [int(x) for x in sys.argv[1:]] or [443, 7844]
    for p in ports[:-1]:
        threading.Thread(target=serve, args=(p,), daemon=True).start()
    serve(ports[-1])
