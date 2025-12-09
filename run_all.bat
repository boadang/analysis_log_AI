@echo off
title Full Stack Start (Redis + AI + Celery + Backend + Frontend)

REM ===========================
REM MOVE TO CURRENT FOLDER
REM ===========================
cd /d %~dp0

echo ========================================
echo   FORCE KILL PORTS (8000, 11434)
echo ========================================

for %%p in (8000 11434) do (
    echo Checking port %%p ...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%p ^| findstr LISTENING') do (
        echo Killing PID %%a using port %%p ...
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo Done killing ports.
echo.

REM ===========================
REM START REDIS
REM ===========================
echo ========================================
echo   START REDIS SERVER
echo ========================================

tasklist | findstr /i "redis-server.exe" >nul
if %errorlevel%==0 (
    echo Redis is already running.
) else (
    echo Starting Redis...
    start "Redis" cmd /k "redis-server.exe"
)

timeout /t 2 >nul

REM ===========================
REM START OLLAMA
REM ===========================
echo ========================================
echo   START AI (Ollama Serve)
echo ========================================
taskkill /IM "ollama.exe" /F >nul 2>&1

start "AI Service" cmd /k "ollama serve"

timeout /t 2 >nul

REM ===========================
REM START CELERY
REM ===========================
echo ========================================
echo   START CELERY WORKER
echo ========================================
start "Celery Worker" cmd /k "cd backend && celery -A app.core.celery_app worker --loglevel=info --pool=threads"

REM ===========================
REM START BACKEND
REM ===========================
echo ========================================
echo   START FASTAPI BACKEND
echo ========================================
start "FastAPI Backend" cmd /k "cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

REM ===========================
REM START FRONTEND
REM ===========================
echo ========================================
echo   START FRONTEND (npm run dev)
echo ========================================
start "Frontend" cmd /k "cd frontend && npm run dev"

echo ========================================
echo   ALL SERVICES STARTED SUCCESSFULLY
echo ========================================
pause
