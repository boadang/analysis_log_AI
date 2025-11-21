from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from loguru import logger
import redis

from app.models.user import User
from app.schemas.auth import RegisterSchema, LoginSchema
from app.core.security import verify_password, hash_password, create_access_token, verify_access_token
from app.database.postgres import SessionLocal

# ----------------------
# Router
# ----------------------
router = APIRouter(prefix="/auth", tags=["auth"])

# ----------------------
# Redis for JWT blacklist
# ----------------------
r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

# ----------------------
# Dependency: DB session
# ----------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----------------------
# Dependency: get current user
# ----------------------
def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        logger.warning("Authorization header invalid")
        raise HTTPException(status_code=401, detail="Authorization header invalid")

    token = authorization.split(" ")[1]

    # Check blacklist
    if r.get(token):
        logger.warning("Token đã bị logout")
        raise HTTPException(status_code=401, detail="Token đã bị logout")

    payload = verify_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        logger.warning("Token không hợp lệ")
        raise HTTPException(status_code=401, detail="Token không hợp lệ")

    user = db.query(User).get(int(user_id))
    if not user:
        logger.warning(f"User id {user_id} không tồn tại")
        raise HTTPException(status_code=401, detail="User không tồn tại")

    return user

# ----------------------
# REGISTER
# ----------------------
@router.post("/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.username == data.username) | (User.email == data.email)
    ).first()
    if existing_user:
        logger.info(f"Đăng ký thất bại: {data.email} đã tồn tại")
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = hash_password(data.password)
    new_user = User(
        username=data.username,
        email=data.email,
        hashed_password=hashed_password,
        full_name=data.full_name,
        role=data.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info(f"User {new_user.email} đã được đăng ký thành công")

    return {
        "status": "success",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role
        }
    }

# ----------------------
# LOGIN
# ----------------------
@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        logger.warning(f"Login thất bại: {data.email} không tồn tại")
        raise HTTPException(status_code=401, detail="Email không tồn tại")

    if not verify_password(data.password, user.hashed_password):
        logger.warning(f"Login thất bại: {data.email} sai mật khẩu")
        raise HTTPException(status_code=401, detail="Sai mật khẩu")

    # Cập nhật last_login
    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token({"sub": str(user.id)})
    logger.info(f"User {user.email} đã login thành công")

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }

# ----------------------
# LOGOUT
# ----------------------
@router.post("/logout")
def logout(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header invalid")

    token = authorization.split(" ")[1]

    # Lưu token vào Redis blacklist (TTL = 1 giờ)
    r.setex(token, timedelta(hours=1), "revoked")
    logger.info("User đã logout, token bị blacklist")

    return {"status": "success", "message": "Logout thành công"}

# ----------------------
# GET CURRENT USER
# ----------------------
@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login
    }
