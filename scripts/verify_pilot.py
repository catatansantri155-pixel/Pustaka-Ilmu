"""Offline integrity report; does not certify religious accuracy."""
import hashlib
import json
from pathlib import Path


def verify():
    manifest = json.loads((Path(__file__).resolve().parents[1] / "database/seeds/pilot/thaharah_30.json").read_text())
    rows = manifest["materials"]
    assert len(rows) == 30
    assert len({r["fatwa_number"] for r in rows}) == 30
    topics = {}
    for row in rows:
        assert hashlib.sha256(row["text_ar"].encode()).hexdigest() == row["sha256"]
        assert "\n\n".join(s["text_ar"] for s in row["segments"]) == row["text_ar"]
        assert "\n\n".join(s["text_id"] for s in row["segments"]) == row["text_id"]
        assert row["human_reviewed"] is False
        topics[row["topic_code"]] = topics.get(row["topic_code"], 0) + 1
    return {"materials": len(rows), "topics": topics,
            "flagged_materials": sum(bool(r["audit_findings"]) for r in rows), "human_reviewed": False}


if __name__ == "__main__":
    print(json.dumps(verify(), ensure_ascii=False, indent=2))
