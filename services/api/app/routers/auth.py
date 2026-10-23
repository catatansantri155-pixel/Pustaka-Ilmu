from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import pyotp
import jwt as pyjwt
from ..db import get_db
from ..models import User
from ..security import verify_password, create_token, create_mfa_token, decode_token
from ..deps import get_current_user, role_name, log_audit

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginIn(BaseModel):
    email: str
    password: str

class CodeIn(BaseModel):
    code: str

class MfaVerifyIn(BaseModel):
    mfa_token: str
    code: str

def _login_response(db: Session, user: User):
    rn = role_name(db, user)
    token = create_token(user.id, user.email, rn)
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "role": rn}}

def _verify_totp(user: User, code: str) -> bool:
    if not user.mfa_secret:
        return False
    try:
        return pyotp.TOTP(user.mfa_secret).verify(str(code).strip(), valid_window=1)
    except Exception:
        return False

@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Email atau kata sandi salah")
    if getattr(user, "mfa_enabled", False):
        return {"mfa_required": True, "mfa_token": create_mfa_token(user.id)}
    return _login_response(db, user)

@router.post("/mfa/enroll")
def mfa_enroll(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    secret = pyotp.random_base32()
    current_user.mfa_secret = secret
    current_user.mfa_enabled = False
    db.commit()
    otpauth_uri = pyotp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name="Pustaka Ilmu")
    return {"secret": secret, "otpauth_uri": otpauth_uri}

@router.post("/mfa/activate")
def mfa_activate(body: CodeIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.mfa_secret:
        raise HTTPException(400, "MFA belum didaftarkan (enroll dulu)")
    if not _verify_totp(current_user, body.code):
        raise HTTPException(400, "Kode MFA tidak valid")
    current_user.mfa_enabled = True
    db.commit()
    log_audit(db, current_user.id, "MFA_ACTIVATED", "user", current_user.id, "")
    return {"mfa_enabled": True}

@router.post("/mfa/disable")
def mfa_disable(body: CodeIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _verify_totp(current_user, body.code):
        raise HTTPException(400, "Kode MFA tidak valid")
    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    db.commit()
    log_audit(db, current_user.id, "MFA_DISABLED", "user", current_user.id, "")
    return {"mfa_enabled": False}

@router.post("/mfa/verify")
def mfa_verify(body: MfaVerifyIn, db: Session = Depends(get_db)):
    try:
        payload = decode_token(body.mfa_token)
    except pyjwt.PyJWTError:
        raise HTTPException(401, "Token MFA tidak valid atau kedaluwarsa")
    if payload.get("type") != "mfa":
        raise HTTPException(401, "Token MFA tidak valid")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user or not user.is_active:
        raise HTTPException(401, "User tidak ditemukan")
    if not _verify_totp(user, body.code):
        raise HTTPException(400, "Kode MFA tidak valid")
    return _login_response(db, user)

@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"id": current_user.id, "email": current_user.email, "full_name": current_user.full_name, "role": role_name(db, current_user)}
