from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
# pool_pre_ping + recycle: pooler (Supavisor/pgBouncer) menutup koneksi idle;
# tanpa ini koneksi mati di pool memicu "SSL error: unexpected eof" di Postgres.
engine_kwargs = {} if settings.database_url.startswith("sqlite") else {
    "pool_pre_ping": True, "pool_recycle": 180,
}
engine = create_engine(settings.database_url, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
