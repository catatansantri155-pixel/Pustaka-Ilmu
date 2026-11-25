import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..services.ask import answer_question

router = APIRouter(prefix="/api", tags=["ask"])

# Batas khusus Tanya AI per IP (di luar batas global /api di main.py):
# melindungi kuota gratis penyedia AI dari pemakaian berlebihan.
_ask_hits: dict = defaultdict(list)


class AskIn(BaseModel):
    question: str


@router.post("/ask")
def ask(body: AskIn, request: Request, db: Session = Depends(get_db)):
    ip = (
        request.headers.get("cf-connecting-ip")
        or (request.headers.get("x-forwarded-for", "").split(",")[0].strip() or None)
        or (request.client.host if request.client else "unknown")
    )
    now = time.time()
    bucket = _ask_hits[ip]
    while bucket and bucket[0] < now - 60:
        bucket.pop(0)
    if len(bucket) >= int(settings.ai_ask_rate_limit_per_minute):
        raise HTTPException(429, "Terlalu banyak pertanyaan dalam waktu singkat. Tunggu sebentar lalu coba lagi.")
    q = (body.question or "").strip()
    if len(q) < 5 or len(q) > 500:
        raise HTTPException(422, "Pertanyaan harus 5–500 karakter")
    bucket.append(now)
    try:
        return answer_question(db, q)
    except RuntimeError as e:
        raise HTTPException(503, f"Layanan AI sedang tidak tersedia. {e}")
