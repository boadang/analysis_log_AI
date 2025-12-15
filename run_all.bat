@echo off
title Full Stack Start (Redis + AI + Celery + Backend + Frontend)

REM ===========================
REM MOVE TO CURRENT FOLDER
REM ===========================
cd /d %~dp0

REM ===========================
REM SET CELERY ENVIRONMENT
REM ===========================
echo ========================================
echo   SETTING CELERY ENVIRONMENT
echo ========================================
set CELERY_BROKER_URL=redis://localhost:6379/0
set CELERY_RESULT_BACKEND=redis://localhost:6379/0
echo Celery configured to use Redis.
echo.

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
REM KILL CELERY PROCESSES
REM ===========================
echo ========================================
echo   KILLING EXISTING CELERY PROCESSES
echo ========================================
taskkill /F /IM celery.exe >nul 2>&1
for /f "tokens=2" %%a in ('tasklist /FI "WINDOWTITLE eq Celery Worker" /FO LIST ^| findstr /i "PID:"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo Done killing Celery processes.
echo.

REM ===========================
REM CLEAN CACHE
REM ===========================
echo ========================================
echo   CLEANING PYTHON CACHE
echo ========================================
cd backend
if exist __pycache__ (
    echo Removing __pycache__ ...
    rmdir /s /q __pycache__ 2>nul
)
if exist .celery (
    echo Removing .celery cache...
    rmdir /s /q .celery 2>nul
)
echo Removing .pyc files...
for /r %%f in (*.pyc) do del /f /q "%%f" 2>nul
echo Cache cleaned.
cd ..
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
REM Wait Redis ready
echo Waiting for Redis to start on port 6379...
:wait_redis
powershell -Command "try {exit $(Test-NetConnection -ComputerName 127.0.0.1 -Port 6379).TcpTestSucceeded} catch {exit 0}"
if %errorlevel%==0 (
    timeout /t 1 >nul
    goto wait_redis
)
echo Redis is ready.
echo.

REM ===========================
REM START AI (OLLAMA)
REM ===========================
echo ========================================
echo   START AI (Ollama Serve)
echo ========================================
taskkill /IM "ollama.exe" /F >nul 2>&1
start "AI Service" cmd /k "ollama serve"
timeout /t 2 >nul
echo.

REM ===========================
REM START CELERY
REM ===========================
echo ========================================
echo   START CELERY WORKER
echo ========================================
start "Celery Worker" cmd /k "cd backend && set CELERY_BROKER_URL=redis://localhost:6379/0 && set CELERY_RESULT_BACKEND=redis://localhost:6379/0 && celery -A app.core.celery_app worker --loglevel=info --pool=threads -E"

REM Wait Celery ready
echo Waiting for Celery worker to connect...
:wait_celery
cd backend
for /f "delims=" %%i in ('celery -A app.core.celery_app status 2^>nul') do set CELERY_STATUS=%%i
cd ..
echo Celery status: %CELERY_STATUS%
echo %CELERY_STATUS% | findstr /i "online" >nul
if errorlevel 1 (
    timeout /t 1 >nul
    goto wait_celery
)
echo Celery worker is ready.
echo.

REM ===========================
REM START BACKEND
REM ===========================
echo ========================================
echo   START FASTAPI BACKEND
echo ========================================
start "FastAPI Backend" cmd /k "cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
timeout /t 2 >nul
echo.

REM ===========================
REM START FRONTEND
REM ===========================
echo ========================================
echo   START FRONTEND (npm run dev)
echo ========================================
start "Frontend" cmd /k "cd frontend && npm run dev"
echo.

echo ========================================
echo   ALL SERVICES STARTED SUCCESSFULLY
echo ========================================
pause