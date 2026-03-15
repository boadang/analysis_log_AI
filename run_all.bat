@echo off
title Full Stack Start (Redis + AI + Celery + Backend + Frontend)

REM ===========================
REM MOVE TO CURRENT FOLDER
REM ===========================
cd /d %~dp0

REM ===========================
REM SET CELERY ENVIRONMENT (chung)
REM ===========================
echo ========================================
echo   SETTING CELERY ENVIRONMENT
echo ========================================
set CELERY_BROKER_URL=redis://localhost:6379/0
set CELERY_RESULT_BACKEND=redis://localhost:6379/1
echo Celery Broker: %CELERY_BROKER_URL%
echo Celery Backend: %CELERY_RESULT_BACKEND%
echo.

REM ===========================
REM FORCE KILL PORTS
REM ===========================
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
REM KILL CELERY & OLLAMA PROCESSES
REM ===========================
echo ========================================
echo   KILLING EXISTING CELERY & OLLAMA PROCESSES
echo ========================================
taskkill /F /IM celery.exe >nul 2>&1
taskkill /F /IM ollama.exe >nul 2>&1
echo Done killing old processes.
echo.

REM ===========================
REM CLEAN PYTHON CACHE
REM ===========================
echo ========================================
echo   CLEANING PYTHON CACHE
echo ========================================
cd backend
rmdir /s /q "__pycache__" 2>nul
for /r %%d in (.) do (
    if exist "%%d\__pycache__" rmdir /s /q "%%d\__pycache__" 2>nul
)
for /r %%f in (*.pyc) do del /f /q "%%f" 2>nul
cd ..
echo Python cache cleaned.
echo.

REM ===========================
REM START REDIS + FLUSH CACHE
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

echo Waiting for Redis to be ready...
:wait_redis
powershell -Command "try { $tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port 6379 -WarningAction SilentlyContinue; exit $tcp.TcpTestSucceeded } catch { exit 0 }" >nul 2>&1
if %errorlevel%==0 (
    timeout /t 1 >nul
    goto wait_redis
)
echo Redis is ready.

REM ===========================
REM FLUSH REDIS CACHE (DB 0 và DB 1)
REM ===========================
echo ========================================
echo   FLUSHING REDIS CACHE (DB 0 & 1)
echo ========================================
redis-cli -n 0 FLUSHDB >nul 2>&1
redis-cli -n 1 FLUSHDB >nul 2>&1
echo Redis cache flushed (broker + result backend).
echo.

REM ===========================
REM START AI (OLLAMA)
REM ===========================
echo ========================================
echo   START AI (Ollama Serve)
echo ========================================
start "AI Service" cmd /k "ollama serve"
timeout /t 3 >nul
echo Ollama started.
echo.

REM ===========================
REM START CELERY WORKERS (với hostname riêng)
REM ===========================
echo ========================================
echo   START CELERY WORKER - AI QUEUE
echo ========================================
start "Celery AI Worker" cmd /k "cd backend && set CELERY_BROKER_URL=%CELERY_BROKER_URL% && set CELERY_RESULT_BACKEND=%CELERY_RESULT_BACKEND% && celery -A app.core.celery_app worker --loglevel=info --pool=threads -E -Q ai --hostname=ai-worker@%COMPUTERNAME%"

echo ========================================
echo   START CELERY WORKER - HUNT QUEUE
echo ========================================
start "Celery Hunt Worker" cmd /k "cd backend && set CELERY_BROKER_URL=%CELERY_BROKER_URL% && set CELERY_RESULT_BACKEND=%CELERY_RESULT_BACKEND% && celery -A app.core.celery_app worker --loglevel=info --pool=threads -E -Q default,celery --hostname=hunt-worker@%COMPUTERNAME%"

echo Celery workers started with unique hostnames.
echo.

REM ===========================
REM START FASTAPI BACKEND
REM ===========================
echo ========================================
echo   START FASTAPI BACKEND
echo ========================================
start "FastAPI Backend" cmd /k "cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
timeout /t 3 >nul
echo Backend started at http://127.0.0.1:8000
echo.

REM ===========================
REM START FRONTEND
REM ===========================
echo ========================================
echo   START FRONTEND (npm run dev)
echo ========================================
start "Frontend" cmd /k "cd frontend && npm run dev"
echo Frontend dev server starting...
echo.

echo ========================================
echo   ALL SERVICES STARTED SUCCESSFULLY!
echo   - Redis: OK
echo   - Ollama: OK
echo   - Celery AI Worker: ai-worker@%COMPUTERNAME%
echo   - Celery Hunt Worker: hunt-worker@%COMPUTERNAME%
echo   - Backend: http://127.0.0.1:8000
echo   - Frontend: (check terminal for URL, usually http://localhost:5173)
echo ========================================
echo.
echo Press any key to exit this window (services will keep running)...
pause >nul