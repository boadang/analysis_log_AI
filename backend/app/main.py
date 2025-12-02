from fastapi import FastAPI
from app.api.v1.router import api_router
from .database.postgres import SessionLocal  # Ensure database is initialized
from sqlalchemy import text
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Ana_FW Log API",
    description="Backend API for FE project",
    version="1.0.0"
)

# Cấu hình CORS để FE có thể gọi API
origins = [
    "http://localhost:5173",  # địa chỉ FE dev server (Vite)
    "http://127.0.0.1:5173",  # hoặc localhost
    "http://localhost:3000",  # nếu bạn dùng React dev server
    # "https://your-frontend-domain.com"  # production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          
    allow_credentials=True,         
    allow_methods=["*"],            
    allow_headers=["*"],            
)

# Đăng ký router API v1
app.include_router(api_router, prefix="/api/v1")

try:
    db = SessionLocal()
    db.execute(text("SELECT 1"))
    db.close()
    print("Database connection successful.")
except Exception as e:
    print(f"Database connection failed: {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to My Application!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",           # module:app
        host="0.0.0.0",           # cho phép truy cập từ mạng LAN (nếu cần)
        port=8000,                # ← PORT BẠN MUỐN DÙNG (mặc định 8000)
        reload=True,              # tự restart khi save code
        log_level="info"
    )