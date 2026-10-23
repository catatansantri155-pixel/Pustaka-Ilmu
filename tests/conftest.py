import os, sys, tempfile
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mktemp(suffix='.db')}"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["ADMIN_PASSWORD"] = "admin12345"
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "services", "api"))
import pytest
from app.db import Base, engine, SessionLocal
from app.seed import seed
from fastapi.testclient import TestClient

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    seed()
    yield

@pytest.fixture()
def client():
    from app.main import app
    return TestClient(app)

@pytest.fixture()
def db():
    s = SessionLocal()
    yield s
    s.close()

@pytest.fixture()
def admin_token(client):
    r = client.post("/api/auth/login", json={"email": "admin@pustaka.local", "password": "admin12345"})
    return r.json()["access_token"]

@pytest.fixture()
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
