# app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.v1 import auth

app = FastAPI(
    title="Ana_FW Log API",
    description="Backend API for FE project",
    version="1.0.0"
)

# Cấu hình CORS để FE có thể gọi API
origins = [
    "http://localhost:5173",  # địa chỉ FE dev server (Vite)
    "http://127.0.0.1:5173",  # hoặc localhost
    # "https://your-frontend-domain.com"  # production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          
    allow_credentials=True,         
    allow_methods=["*"],            
    allow_headers=["*"],            
)

# ======================
# Routers (tách file)
# ======================
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# ======================
# Test route cơ bản
# ======================
@app.get("/")
async def root():
    return {"message": "Hello from FastAPI backend!"}

