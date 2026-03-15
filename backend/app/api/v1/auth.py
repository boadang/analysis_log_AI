# backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Header, Body
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime
from loguru import logger

from app.models.user import User
from app.schemas.auth import RegisterSchema, LoginSchema, UserRead
from app.core.security import verify_password, hash_password, create_access_token, verify_access_token
from app.dependencies import get_db, get_current_user

router = APIRouter()

# ----------------------
# REGISTER (chỉ admin hoặc mở cho tất cả tùy bạn)
# ----------------------
@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    # Kiểm tra trùng username hoặc email
    existing = db.query(User).filter(
        (User.username == data.username) | (User.email == data.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username hoặc email đã tồn tại")

    hashed_pw = hash_password(data.password)
    new_user = User(
        username=data.username,
        email=data.email,
        hashed_password=hashed_pw,
        full_name=data.full_name or data.username,
        role=data.role or "user"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"Đăng ký thành công: {new_user.email} (role: {new_user.role})")
    return new_user


# ----------------------
# LOGIN
# ----------------------
@router.post("/login")
def login(data: LoginSchema = Body(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        logger.warning(f"Login thất bại: {data.email}")
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    if not user.is_active:
        raise HTTPException(status_code=401, detail="Tài khoản đã bị khóa")

    # Cập nhật last_login
    user.last_login = datetime.utcnow()
    db.commit()

    # Tạo token (hết hạn 7 ngày)
    access_token = create_access_token({"sub": str(user.id)})

    logger.info(f"Login thành công: {user.email} (ID: {user.id})")

    return {
        "status": "success",
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 3600 * 24 * 7,  # 7 ngày
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

# ----------------------
# GET CURRENT USER (/auth/me)
# ----------------------
@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ----------------------
# LOGOUT (chỉ xóa token ở client – không cần Redis)
# ----------------------
@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    logger.info(f"User {current_user.email} đã đăng xuất")

    return JSONResponse(
        status_code=200,
        content={
            "status": "success",
            "message": "Đăng xuất thành công!",
            "detail": "Token đã được đánh dấu xóa ở phía client."
        },
        headers={
            "X-Clear-Auth": "true",           # Frontend bắt header này để xóa token
            "Clear-Site-Data": "storage"      # Xóa localStorage (mạnh hơn cookie)
        }
    )