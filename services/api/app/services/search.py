import re
# Harakat/tashkeel + tatweel (U+0640) dihapus saat normalisasi.
TASHKEEL = re.compile(r'[\u0640\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]')
# Peta sinonim dua arah (Indonesia <-> Arab <-> variasi ejaan), Master Prompt V2 BAGIAN 14.
_GROUPS = [
    ["wudu", "wudhu", "وضوء", "الوضوء"],
    ["shalat", "salat", "صلاة", "الصلاة"],
    ["tayamum", "tayammum", "تيمم", "التيمم"],
    ["najis", "نجاسة", "النجاسة"],
    ["haid", "حيض", "الحيض"],
    ["mandi wajib", "ghusl", "غسل", "الغسل"],
    ["khuf", "خف", "الخف"],
    ["istinja", "استنجاء", "الاستنجاء"],
]
SYNONYMS = {}
for _g in _GROUPS:
    for _k in _g:
        SYNONYMS[_k] = _g
def normalize_query(q: str) -> str:
    q = q.lower().strip()
    q = TASHKEEL.sub('', q)
    q = q.replace('أ','ا').replace('إ','ا').replace('آ','ا').replace('ة','ه').replace('ى','ي')
    return q
def normalize_text(t: str) -> str:
    return normalize_query(t or "")
def expand_query(q: str) -> list[str]:
    nq = normalize_query(q)
    terms = {nq, q.lower().strip()}
    # check synonym keys (normalized and raw)
    for key, vals in SYNONYMS.items():
        if normalize_query(key) == nq or key == q.strip() or nq in normalize_query(key):
            for v in vals:
                terms.add(v); terms.add(normalize_query(v))
    # also if query contains a synonym key
    for key, vals in SYNONYMS.items():
        if key in q or normalize_query(key) in nq:
            for v in vals:
                terms.add(v); terms.add(normalize_query(v))
    return list(terms)
