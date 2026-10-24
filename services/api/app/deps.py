from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from .db import get_db
from .models import User, Role
from .security import decode_token
import jwt as pyjwt

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except pyjwt.PyJWTError:
        raise HTTPException(401, "Invalid token")
    if payload.get("type") == "mfa":
        raise HTTPException(401, "Token MFA bukan sesi akses")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user or not user.is_active:
        raise HTTPException(401, "User not found")
    return user

def get_optional_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        payload = decode_token(authorization.split(" ", 1)[1])
    except Exception:
        return None
    if payload.get("type") == "mfa":
        return None
    return db.query(User).filter(User.id == payload.get("sub"), User.is_active == True).first()

def role_name(db: Session, user: User) -> str:
    if user.role: return user.role.name
    if user.role_id:
        r = db.query(Role).filter(Role.id == user.role_id).first()
        return r.name if r else ""
    return ""

def require_roles(*roles):
    def dep(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        rn = role_name(db, current_user)
        if rn not in roles:
            raise HTTPException(403, f"Requires role: {', '.join(roles)}")
        return current_user
    return dep

def log_audit(db: Session, user_id, action, entity, entity_id=None, detail=""):
    from .models import AuditLog
    db.add(AuditLog(user_id=user_id, action=action, entity=entity, entity_id=str(entity_id) if entity_id else None, detail=str(detail)[:2000]))
    db.commit()
