import re
TASHKEEL = re.compile(r'[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]')
SYNONYMS = {
    "wudu": ["wudu","wudhu","وضوء","الوضوء"], "wudhu": ["wudu","wudhu","وضوء","الوضوء"], "وضوء": ["wudu","wudhu","وضوء"],
    "shalat": ["shalat","salat","صلاة","صلاه"], "salat": ["shalat","salat","صلاة","صلاه"], "صلاة": ["shalat","salat","صلاة"],
    "tayamum": ["tayamum","tayammum","تيمم"], "tayammum": ["tayamum","tayammum","تيمم"], "تيمم": ["tayamum","tayammum","تيمم"],
    "najis": ["najis","نجاسة","نجاسه"], "نجاسة": ["najis","نجاسة"],
    "haid": ["haid","حيض"], "حيض": ["haid","حيض"],
    "ghusl": ["ghusl","mandi wajib","غسل"], "غسل": ["ghusl","mandi wajib","غسل"],
}
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
