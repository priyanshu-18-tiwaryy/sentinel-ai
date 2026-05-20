@echo off
title Sentinel AI - Startup
color 0A
echo.
echo  ==========================================
echo    SENTINEL AI - Starting All Services
echo    Group 13 ^| ITER, SOA University
echo  ==========================================
echo.

echo [1/3] Installing Python backend dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo ERROR: pip install failed. Make sure Python is installed.
    pause
    exit /b
)

echo [2/3] Starting FastAPI Backend on port 8000...
start "Sentinel AI - Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [3/3] Installing and starting React Frontend on port 3000...
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo Installing npm packages (first time only, ~2 minutes)...
    call npm install
)

start "Sentinel AI - Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo  ==========================================
echo    Both services are starting!
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:3000
echo    
echo    Open http://localhost:3000 in browser
echo  ==========================================
echo.
timeout /t 5 /nobreak >nul
start http://localhost:3000
