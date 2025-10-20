@echo off
title NFL Predictor - Stopping Services
color 0E

echo.
echo ========================================
echo   NFL Predictor - Stopping Services
echo ========================================
echo.

REM Stop specific terminal windows
echo [1/4] Closing service windows...
echo   - Backend API window...
taskkill /F /FI "WINDOWTITLE eq NFL Predictor - Backend API*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Backend API*" >nul 2>&1

echo   - Mobile App window...
taskkill /F /FI "WINDOWTITLE eq NFL Predictor - Mobile App*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Mobile App*" >nul 2>&1

echo [OK] Service windows closed
echo.

REM Kill processes on specific ports (safer than killing all node processes)
echo [2/4] Stopping processes on ports...

echo   - Port 4100 (Backend API)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4100" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo   - Port 8100 (Mobile App)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8100" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo   - Port 8081 (Metro bundler fallback)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8081" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [OK] Port processes stopped
echo.

REM Stop Docker containers
echo [3/4] Stopping Docker containers...
echo   - PostgreSQL
echo   - MongoDB
echo   - Redis
echo   - ML Service
call docker-compose down
if errorlevel 1 (
    echo [WARNING] Some containers may not have stopped properly
    echo   Run 'docker-compose down' manually if needed
) else (
    echo [OK] Docker containers stopped
)
echo.

REM Clean up (optional - remove if you want to keep data)
echo [4/4] Cleanup options...
echo.
set /p CLEANUP="Do you want to remove Docker volumes (deletes all data)? (y/N): "
if /i "%CLEANUP%"=="y" (
    echo   Removing volumes...
    docker-compose down -v >nul 2>&1
    echo   [OK] Volumes removed
) else (
    echo   [SKIP] Keeping data volumes
)
echo.

REM Verify everything is stopped
echo [Verify] Checking if services are stopped...
netstat -ano | findstr ":4100" >nul 2>&1
if not errorlevel 1 (
    color 0C
    echo [WARNING] Port 4100 is still in use!
) else (
    echo [OK] Port 4100 is free
)

netstat -ano | findstr ":8100" >nul 2>&1
if not errorlevel 1 (
    color 0C
    echo [WARNING] Port 8100 is still in use!
) else (
    echo [OK] Port 8100 is free
)

docker ps | findstr "nfl" >nul 2>&1
if not errorlevel 1 (
    color 0C
    echo [WARNING] Some NFL containers are still running
    echo   Run 'docker ps' to see active containers
) else (
    echo [OK] All containers stopped
)
echo.

color 0A
echo ========================================
echo   All Services Stopped Successfully!
echo ========================================
echo.
echo To restart services, run: start-all.bat
echo.
echo Press any key to close this window...
pause >nul
