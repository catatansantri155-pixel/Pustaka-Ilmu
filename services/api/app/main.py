import time
from collections import defaultdict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .db import Base, engine
from . import models  # noqa
from .config import settings
from .routers import auth, public, admin, references, bookmarks

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Pustaka Ilmu")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Rate limit in-memory: sliding window 60 detik per IP ---
_rate_store: dict = defaultdict(list)
RATE_WINDOW_SECONDS = 60

def reset_rate_limits():
    """Kosongkan seluruh jendela rate limit (dipakai test & operasi)."""
    _rate_store.clear()

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path
    if path == "/health":
        return await call_next(request)
    if path == "/api/auth/login":
        limit = settings.login_rate_limit_per_minute
    elif path.startswith("/api/"):
        limit = settings.rate_limit_per_minute
    else:
        return await call_next(request)
    ip = request.client.host if request.client else "unknown"
    key = (ip, "login" if path == "/api/auth/login" else "api")
    now = time.time()
    bucket = _rate_store[key]
    cutoff = now - RATE_WINDOW_SECONDS
    while bucket and bucket[0] < cutoff:
        bucket.pop(0)
    if len(bucket) >= int(limit):
        return JSONResponse(status_code=429, content={"detail": "Terlalu banyak permintaan, coba lagi nanti"})
    bucket.append(now)
    return await call_next(request)

@app.get("/health")
def health():
    return {"status": "ok", "app": "pustaka-ilmu"}

app.include_router(auth.router)
app.include_router(public.router)
app.include_router(admin.router)
app.include_router(references.router)
app.include_router(bookmarks.router)
