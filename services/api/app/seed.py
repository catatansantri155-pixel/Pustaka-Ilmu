from .db import SessionLocal, Base, engine
from .models import *
from .security import hash_password
from .config import settings
from .services.ai_adapter import segment_arabic, AI_LABEL

TOPICS = [
    ("THA-01","Air dan Hukum Bersuci"),("THA-02","Bejana dan Peralatan"),("THA-03","Istinja dan Adab Buang Hajat"),
    ("THA-04","Wudu"),("THA-05","Pembatal Wudu"),("THA-06","Mengusap Khuf, Kaus Kaki, dan Perban"),
    ("THA-07","Mandi Wajib"),("THA-08","Tayamum"),("THA-09","Najis dan Cara Menyucikannya"),("THA-10","Haid, Nifas, dan Istihadhah"),
]

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        roles = {}
        for name in ["super_admin","admin","editor","viewer"]:
            r = db.query(Role).filter(Role.name==name).first()
            if not r:
                r = Role(name=name); db.add(r); db.commit(); db.refresh(r)
            roles[name] = r
        if not db.query(User).filter(User.email=="admin@pustaka.local").first():
            db.add(User(email="admin@pustaka.local", password_hash=hash_password(settings.admin_password), full_name="Admin Pustaka", role_id=roles["super_admin"].id))
            db.commit()
        scholars_data = [
            ("Abdul Aziz bin Baz","عبد العزيز بن عبد الله بن باز", None, "1420H","1999M","Ulama Arab Saudi yang pernah menjabat sebagai Mufti Agung Arab Saudi."),
            ("Muhammad bin Shalih Al-Utsaimin","محمد بن صالح العثيمين", None, "1421H","2001M","Ulama Arab Saudi yang dikenal sebagai pengajar dan penulis di bidang fikih dan akidah."),
            ("Muhammad Nashiruddin Al-Albani","محمد ناصر الدين الألباني", None, "1420H","1999M","Ulama yang dikenal atas penelitiannya di bidang hadis."),
        ]
        # Note: display names use common transliteration; spec names Bin Baz / Ibnu Utsaimin / Al-Albani
        scholars_data = [
            ("Bin Baz","عبد العزيز بن عبد الله بن باز", None, "1420H","1999M","Ulama Arab Saudi yang pernah menjabat sebagai Mufti Agung Arab Saudi."),
            ("Ibnu Utsaimin","محمد بن صالح العثيمين", None, "1421H","2001M","Ulama Arab Saudi yang dikenal sebagai pengajar dan penulis di bidang fikih dan akidah."),
            ("Al-Albani","محمد ناصر الدين الألباني", None, "1420H","1999M","Ulama yang dikenal atas penelitiannya di bidang hadis."),
        ]
        scholars = {}
        for name_id, name_ar, birth, dh, dm, bio in scholars_data:
            s = db.query(Scholar).filter(Scholar.name_id==name_id).first()
            if not s:
                s = Scholar(name_id=name_id, name_ar=name_ar, birth_year_h=birth, death_year_h=dh, death_year_m=dm, bio_id=bio)
                db.add(s); db.commit(); db.refresh(s)
            scholars[name_id] = s
        topics = {}
        for code, name in TOPICS:
            t = db.query(Topic).filter(Topic.code==code).first()
            if not t:
                t = Topic(code=code, name_id=name); db.add(t); db.commit(); db.refresh(t)
            topics[code] = t
        regs = [
            ("Bin Baz Official","binbaz.org.sa", scholars["Bin Baz"].id),
            ("Ibnu Utsaimin Official","binothaimeen.net", scholars["Ibnu Utsaimin"].id),
            ("Al-Albani Official","al-albany.com", scholars["Al-Albani"].id),
        ]
        for name, domain, sid in regs:
            if not db.query(SourceRegistry).filter(SourceRegistry.name==name).first():
                db.add(SourceRegistry(name=name, domain=domain, scholar_id=sid, permission_status="UNVERIFIED", redistribution_policy="UNKNOWN")); db.commit()
        candidates = [
            ("https://binbaz.org.sa/fatwas/3785","TEXT",""),
            ("https://alathar.net/home/esound/index.php?coid=40053&op=codevi","AUDIO","memerlukan transkripsi"),
            ("https://www.al-albany.com/audios/content/143402","AUDIO","memerlukan transkripsi"),
        ]
        for url, fmt, notes in candidates:
            if not db.query(Source).filter(Source.url==url).first():
                db.add(Source(url=url, content_format=fmt, status="DISCOVERED", notes=notes)); db.commit()
        if not db.query(Issue).filter(Issue.code=="THA-05-001").first():
            db.add(Issue(code="THA-05-001", title_id="Hukum wudu setelah memakan daging unta", topic_id=topics["THA-05"].id)); db.commit()
        # demo material
        if not db.query(Material).filter(Material.is_demo==True).first():
            m = Material(scholar_id=scholars["Bin Baz"].id, title_id="Contoh Tampilan: Materi Uji Editor (Bukan Fatwa)", content_type="FATWA", status="ADMIN_REVIEW", is_demo=True, rights_status="UNKNOWN", ai_label=AI_LABEL)
            db.add(m); db.commit(); db.refresh(m)
            ar_text = "هذا نص عربي قصير مخصص للاختبار فقط وليس فتوى ولا يجوز نشره كمادة علمية."
            at = ArabicText(material_id=m.id, full_text=ar_text, is_complete=True); db.add(at); db.commit(); db.refresh(at)
            segs = segment_arabic(ar_text)
            seg_objs = []
            for i, s in enumerate(segs):
                so = TextSegment(arabic_text_id=at.id, order_index=i, text_ar=s); db.add(so); seg_objs.append(so)
            db.commit()
            for so in seg_objs: db.refresh(so)
            tr = Translation(material_id=m.id, model="", prompt_version="id-ar-v1", status="DRAFT"); db.add(tr); db.commit(); db.refresh(tr)
            id_text = "Ini adalah teks Arab pendek yang khusus untuk pengujian saja, bukan fatwa, dan tidak boleh diterbitkan sebagai materi ilmiah."
            # one segment -> one translation segment
            for so in seg_objs:
                db.add(TranslationSegment(translation_id=tr.id, text_segment_id=so.id, text_id=id_text))
            db.commit()
        # Job transkripsi untuk sumber AUDIO (idempoten; BLOCKED bila belum aktif)
        try:
            from .services.transcription import ensure_audio_jobs
            ensure_audio_jobs(db)
        except Exception as e:
            print(f"ensure_audio_jobs dilewati: {e}")
        print("Seed selesai.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
