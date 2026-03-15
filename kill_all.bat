@echo off
title KILL ALL SERVICES (Redis + AI + Celery + Backend + Frontend)

echo ========================================
echo    KILLING BACKEND / CELERY / AI / NODE
echo ========================================

REM Kill FastAPI (uvicorn)
taskkill /IM uvicorn.exe /F >nul 2>&1

REM Kill Celery
taskkill /IM celery.exe /F >nul 2>&1

REM Kill Python (phòng backend chạy python main.py)
taskkill /IM python.exe /F >nul 2>&1

REM Kill Node.js (Frontend)
taskkill /IM node.exe /F >nul 2>&1

REM Kill Redis
taskkill /IM redis-server.exe /F >nul 2>&1

REM Kill Ollama AI
taskkill /IM ollama.exe /F >nul 2>&1
taskkill /IM "ollama.exe" /F >nul 2>&1

echo ========================================
echo    KILLING PORTS 8000 + 11434
echo ========================================

for %%p in (8000 11434) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%p') do (
        echo Killing PID %%a on port %%p
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo ========================================
echo     ALL SERVICES HAVE BEEN TERMINATED
echo ========================================

taskkill /IM cmd.exe /F
