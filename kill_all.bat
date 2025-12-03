@echo off
echo Killing processes...

REM Kill Uvicorn
taskkill /IM uvicorn.exe /F

REM Kill Celery worker
taskkill /IM celery.exe /F

REM Kill Node (React FE)
taskkill /IM node.exe /F

echo All processes killed.
exit
