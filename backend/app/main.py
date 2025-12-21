# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.v1.router import api_router
from app.core.ws_manager import job_ws_manager          # AI Analysis
from app.core.hunt_ws_manager import ws_manager         # Threat Hunt
from app.database.postgres import SessionLocal
from sqlalchemy import text


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[APP] 🚀 Starting up...")

    # ===============================
    # Start Redis listeners
    # ===============================
    await job_ws_manager.start_redis_listener()
    print("[APP] ✅ AI Analysis WS listener started")

    await ws_manager.start_redis_listener()
    print("[APP] ✅ Threat Hunt WS listener started")

    yield

    # ===============================
    # Shutdown
    # ===============================
    print("[APP] 🛑 Shutting down...")
    await job_ws_manager.stop_redis_listener()
    await ws_manager.stop_redis_listener()
    print("[APP] ✅ All listeners stopped")


app = FastAPI(
    title="Ana_FW Log API",
    description="Backend API for FE project",
    version="1.0.0",
    lifespan=lifespan,
)

# ===============================
# CORS
# ===============================
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===============================
# Routes
# ===============================
app.include_router(api_router, prefix="/api/v1")


# ===============================
# DB check (startup)
# ===============================
try:
    db = SessionLocal()
    db.execute(text("SELECT 1"))
    db.close()
    print("✅ Database connection successful.")
except Exception as e:
    print(f"❌ Database connection failed: {e}")


@app.get("/")
def read_root():
    return {"message": "Welcome to Ana_FW Log API"}
