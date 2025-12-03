@echo off
REM ===========================
REM Run Backend + Celery + Frontend
REM ===========================

REM 1. Thay đổi thư mục làm việc nếu cần
cd /d %~dp0

REM 2. Chạy Celery Worker
echo Starting Celery worker...
start "Celery Worker" cmd /k "cd backend && celery -A app.tasks.celery_worker worker --loglevel=INFO -P solo"

REM 3. Chạy FastAPI Backend
echo Starting FastAPI backend...
start "FastAPI Backend" cmd /k "cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

REM 4. Chạy Frontend
echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

REM 5. Hoàn tất
echo All processes started.
pause
