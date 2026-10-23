import re
AR_NEG = ["لا","لم","لن","ليس","ما","غير"]
ID_NEG = ["tidak","bukan","jangan","belum","tanpa"]
AR_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩","0123456789")
def extract_numbers(text: str) -> list[str]:
    t = (text or "").translate(AR_DIGITS)
    return re.findall(r'\d+', t)
def audit_translation(pairs, source_full=""):
    """pairs: list of (ar_text, id_text) or (ar, id, order_index)"""
    findings = []
    norm = []
    for i, p in enumerate(pairs):
        if len(p) == 3: norm.append((p[0], p[1], p[2]))
        else: norm.append((p[0], p[1], i))
    # duplicates / missing
    seen = {}
    for ar, idt, idx in norm:
        if not (ar or "").strip():
            findings.append({"rule":"MISSING_SEGMENT","severity":"HIGH","message":f"Segmen {idx} kosong/hilang","segment_ref":str(idx)})
        if ar in seen:
            findings.append({"rule":"DUPLICATE_SEGMENT","severity":"MEDIUM","message":f"Segmen duplikat pada index {idx}","segment_ref":str(idx)})
        seen[ar] = idx
        if not (idt or "").strip() and (ar or "").strip():
            findings.append({"rule":"MISSING_TRANSLATION","severity":"HIGH","message":f"Terjemahan hilang untuk segmen {idx}","segment_ref":str(idx)})
    # order monotonic
    idxs = [x[2] for x in norm]
    if idxs != sorted(idxs):
        findings.append({"rule":"ORDER_MISMATCH","severity":"MEDIUM","message":"Urutan segmen tidak monoton","segment_ref":None})
    for ar, idt, idx in norm:
        # damaged chars
        for txt in (ar or "", idt or ""):
            if '\ufffd' in txt or any(ord(c) < 32 and c not in '\n\t' for c in txt):
                findings.append({"rule":"DAMAGED_CHARACTER","severity":"CRITICAL","message":f"Karakter rusak pada segmen {idx}","segment_ref":str(idx)})
                break
        # numbers
        ar_nums = extract_numbers(ar or "")
        id_nums = extract_numbers(idt or "")
        for n in ar_nums:
            if n not in id_nums:
                findings.append({"rule":"NUMBER_MISSING","severity":"HIGH","message":f"Angka {n} dari teks Arab hilang di terjemahan segmen {idx}","segment_ref":str(idx)})
        # negation: token-based for Arabic to avoid substring false positives
        ar_tokens = re.findall(r'[\u0600-\u06FF]+', ar or "")
        has_ar_neg = any(tok in AR_NEG for tok in ar_tokens)
        id_lower = (idt or "").lower()
        has_id_neg = any(w in id_lower.split() or w in id_lower for w in ID_NEG)
        # use word boundary-ish: check split tokens stripped punctuation
        id_tokens = re.findall(r'[a-z]+', id_lower)
        has_id_neg = any(w in id_tokens for w in ID_NEG)
        if has_ar_neg and not has_id_neg:
            findings.append({"rule":"NEGATION_MISSING","severity":"HIGH","message":f"Negasi Arab hilang di terjemahan segmen {idx}","segment_ref":str(idx)})
    return findings
