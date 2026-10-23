"""Adapter OCR — interface jujur.

Belum ada mesin OCR yang dikonfigurasi di deployment ini, jadi fungsi ini
selalu melempar OcrUnavailableError alih-alih mengembalikan teks kosong/
karangan. Pemanggil (mis. importer PDF) menerjemahkan error ini menjadi
status NEEDS_OCR pada job.
"""

class OcrUnavailableError(Exception):
    pass

def extract_text_with_ocr(data: bytes) -> str:
    raise OcrUnavailableError("Adapter OCR belum dikonfigurasi")
