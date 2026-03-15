# app/dependencies.py
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database.postgres import SessionLocal
from app.models.user import User
from app.core.security import verify_access_token
from loguru import logger

# ----------------------
# DB session
# ----------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ----------------------
# Get current user
# ----------------------
def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> User:

    # ✅ Lấy token đúng chuẩn
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc thiếu")

    token = authorization.split(" ")[1]
    print("RAW TOKEN RECEIVED:", token)

    # ✅ Decode token
    payload = verify_access_token(token)

    user_id = payload.get("sub")
    if not user_id:
        logger.warning("Token không chứa sub (user_id)")
        raise HTTPException(status_code=401, detail="Token không hợp lệ")

    # ✅ Lấy user từ DB
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        logger.warning(f"User ID {user_id} không tồn tại trong DB")
        raise HTTPException(status_code=401, detail="User không tồn tại")

    if not user.is_active:
        raise HTTPException(status_code=401, detail="Tài khoản đã bị khóa")

    return user
