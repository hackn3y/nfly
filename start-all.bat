@echo off
title NFL Predictor - Starting Services
color 0A

echo.
echo ========================================
echo   NFL Predictor - All Services
echo ========================================
echo.

REM Check if Docker is running
echo [Checking] Docker status...
docker info >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)
echo [OK] Docker is running
echo.

REM Start Docker containers
echo [1/5] Starting Docker services...
echo   - PostgreSQL (port 5432)
echo   - MongoDB (port 27017)
echo   - Redis (port 6379)
echo   - ML Service (port 5000)
call docker-compose up -d
if errorlevel 1 (
    color 0C
    echo.
    echo [ERROR] Failed to start Docker containers
    pause
    exit /b 1
)
echo [OK] Docker containers started
echo.

echo [Wait] Initializing databases (10 seconds)...
timeout /t 10 /nobreak >nul
echo.

REM Check if port 4100 is already in use
echo [Checking] Port 4100 (Backend API)...
netstat -ano | findstr ":4100" >nul
if not errorlevel 1 (
    echo [WARNING] Port 4100 is already in use
    echo   Attempting to free port...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4100"') do taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
)
echo [OK] Port 4100 is available
echo.

REM Start Backend API
echo [2/5] Starting Backend API...
start "NFL Predictor - Backend API" cmd /k "color 0B && title Backend API (Port 4100) && cd packages\backend && npm run dev"
echo [OK] Backend API window opened
timeout /t 3 /nobreak >nul
echo.

REM Check if port 8100 is already in use
echo [Checking] Port 8100 (Mobile App)...
netstat -ano | findstr ":8100" >nul
if not errorlevel 1 (
    echo [WARNING] Port 8100 is already in use
    echo   Attempting to free port...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8100"') do taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
)
echo [OK] Port 8100 is available
echo.

REM Start Mobile App
echo [3/5] Starting Mobile App (Expo)...
start "NFL Predictor - Mobile App" cmd /k "color 0E && title Mobile App (Port 8100) && cd packages\mobile && npx expo start --clear --port 8100"
echo [OK] Mobile App window opened
echo.

REM Wait for services to start
echo [4/5] Waiting for services to initialize...
timeout /t 5 /nobreak >nul
echo.

REM Health check
echo [5/5] Performing health checks...
timeout /t 3 /nobreak >nul

echo   - Backend API...
curl -s http://localhost:4100/health >nul 2>&1
if errorlevel 1 (
    echo     [WARNING] Backend API not responding yet (may still be starting)
) else (
    echo     [OK] Backend API is healthy
)

echo   - ML Service...
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo     [WARNING] ML Service not responding yet (may still be starting)
) else (
    echo     [OK] ML Service is healthy
)

echo.
color 0A
echo ========================================
echo   All Services Started Successfully!
echo ========================================
echo.
echo Services:
echo   Backend API:      http://localhost:4100
echo   Admin Dashboard:  http://localhost:4100/admin.html
echo   ML Service:       http://localhost:5000
echo   Mobile App:       http://localhost:8100
echo.
echo Docker Containers:
echo   PostgreSQL:       localhost:5432
echo   MongoDB:          localhost:27017
echo   Redis:            localhost:6379
echo.
echo Test Account:
echo   Email:            test@nflpredictor.com
echo   Password:         password123
echo.
echo Tip: Run 'stop-all.bat' to stop all services
echo.
echo Press any key to close this window...
pause >nul
