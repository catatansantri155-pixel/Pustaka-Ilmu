"""Transkripsi audio — adapter jujur.

Transkripsi hanya berjalan bila env TRANSCRIPTION_ENABLED == "true" DAN
paket faster-whisper terpasang. Selain itu dibuat ProcessingJob BLOCKED
dengan penjelasan persis; tidak ada transkrip karangan yang dibuat.
"""
import os

BLOCKED_DETAIL = "Transkripsi audio belum aktif: faster-whisper tidak terpasang/TRANSCRIPTION_ENABLED tidak diset; tidak ada transkrip yang dibuat."

class TranscriptionUnavailableError(Exception):
    pass

def _whisper_available() -> bool:
    try:
        import faster_whisper  # noqa: F401
        return True
    except Exception:
        return False

def transcribe_source(db, source):
    from ..models import ProcessingJob
    job = ProcessingJob(material_id=source.material_id, job_type="TRANSCRIPTION", status="PENDING")
    db.add(job); db.commit(); db.refresh(job)
    if os.environ.get("TRANSCRIPTION_ENABLED") != "true" or not _whisper_available():
        job.status = "BLOCKED"
        job.detail = BLOCKED_DETAIL
        db.commit(); db.refresh(job)
        return job
    # Jalur aktif: unduh audio lalu transkripsikan dengan faster-whisper.
    try:
        import tempfile
        import httpx
        from faster_whisper import WhisperModel
        with httpx.Client(trust_env=True, timeout=120, follow_redirects=True) as client:
            r = client.get(source.url)
            r.raise_for_status()
            audio = r.content
        with tempfile.NamedTemporaryFile(delete=False, suffix=".audio") as fh:
            fh.write(audio)
            tmp_path = fh.name
        model = WhisperModel(os.environ.get("WHISPER_MODEL", "base"))
        segments, _info = model.transcribe(tmp_path)
        text = " ".join(seg.text.strip() for seg in segments).strip()
        if not text:
            raise TranscriptionUnavailableError("Hasil transkripsi kosong")
        job.status = "COMPLETED"
        job.detail = text[:2000]
        db.commit(); db.refresh(job)
        return job
    except Exception as e:
        job.status = "FAILED"
        job.error = str(e)
        db.commit(); db.refresh(job)
        return job

def ensure_audio_jobs(db):
    """Pastikan setiap Source AUDIO punya ProcessingJob TRANSCRIPTION (idempoten).

    ProcessingJob tidak punya kolom source_id; penanda pasangan adalah
    material_id. Untuk source tanpa material (material_id NULL), idempotensi
    dijaga dengan menghitung job TRANSCRIPTION bermaterial NULL yang sudah
    ada terhadap urutan source AUDIO bermaterial NULL.
    """
    from ..models import Source, ProcessingJob
    sources = db.query(Source).filter(Source.content_format == "AUDIO").order_by(Source.created_at, Source.id).all()
    if not sources:
        return []
    null_jobs = db.query(ProcessingJob).filter(
        ProcessingJob.job_type == "TRANSCRIPTION", ProcessingJob.material_id.is_(None)).count()
    created = []
    null_index = 0
    for source in sources:
        if source.material_id is not None:
            exists = db.query(ProcessingJob).filter(
                ProcessingJob.job_type == "TRANSCRIPTION",
                ProcessingJob.material_id == source.material_id).first()
            if exists:
                continue
            created.append(transcribe_source(db, source))
        else:
            if null_index < null_jobs:
                null_index += 1
                continue
            null_index += 1
            created.append(transcribe_source(db, source))
    return created
