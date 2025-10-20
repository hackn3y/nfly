@echo off
title NFL Predictor - Service Status
color 0B

:CHECK_STATUS
cls
echo.
echo ========================================
echo   NFL Predictor - Service Status
echo ========================================
echo.
echo Checking all services...
echo.

REM Check Docker
echo [Docker]
docker info >nul 2>&1
if errorlevel 1 (
    color 0C
    echo   Status: NOT RUNNING
    echo   Error:  Docker Desktop is not started
    color 0B
) else (
    echo   Status: RUNNING

    REM Check individual containers
    echo.
    echo [Docker Containers]

    docker ps --filter "name=nfl" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>nul | findstr /V "NAMES" >nul 2>&1
    if errorlevel 1 (
        echo   No NFL containers running
    ) else (
        docker ps --filter "name=nfl" --format "   {{.Names}} - {{.Status}}"
    )
)
echo.

REM Check Backend API (port 4100)
echo [Backend API - Port 4100]
netstat -ano | findstr ":4100" >nul 2>&1
if errorlevel 1 (
    echo   Status: NOT RUNNING
    echo   Port:   4100 is free
) else (
    echo   Status: RUNNING
    curl -s http://localhost:4100/health >nul 2>&1
    if errorlevel 1 (
        echo   Health: NOT RESPONDING
    ) else (
        echo   Health: OK
    )
    echo   URL:    http://localhost:4100
    echo   Admin:  http://localhost:4100/admin.html
)
echo.

REM Check ML Service (port 5000)
echo [ML Service - Port 5000]
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo   Status: NOT RUNNING
    echo   Port:   5000 is not responding
) else (
    echo   Status: RUNNING
    echo   Health: OK
    echo   URL:    http://localhost:5000
    echo   Docs:   http://localhost:5000/docs
)
echo.

REM Check Mobile App (port 8100)
echo [Mobile App - Port 8100]
netstat -ano | findstr ":8100" >nul 2>&1
if errorlevel 1 (
    echo   Status: NOT RUNNING
    echo   Port:   8100 is free
) else (
    echo   Status: RUNNING
    echo   URL:    http://localhost:8100
)
echo.

REM Check Metro bundler (port 8081)
netstat -ano | findstr ":8081" >nul 2>&1
if not errorlevel 1 (
    echo [Metro Bundler - Port 8081]
    echo   Status: RUNNING
    echo.
)

REM Database ports
echo [Database Ports]
netstat -ano | findstr ":5432" >nul 2>&1
if errorlevel 1 (
    echo   PostgreSQL (5432): NOT RUNNING
) else (
    echo   PostgreSQL (5432): RUNNING
)

netstat -ano | findstr ":27017" >nul 2>&1
if errorlevel 1 (
    echo   MongoDB (27017):   NOT RUNNING
) else (
    echo   MongoDB (27017):   RUNNING
)

netstat -ano | findstr ":6379" >nul 2>&1
if errorlevel 1 (
    echo   Redis (6379):      NOT RUNNING
) else (
    echo   Redis (6379):      RUNNING
)
echo.

REM Summary
echo ========================================
echo   Quick Actions
echo ========================================
echo.
echo   [1] Start all services     - start-all.bat
echo   [2] Stop all services      - stop-all.bat
echo   [3] Restart services       - stop-all.bat then start-all.bat
echo   [4] View logs              - Check terminal windows
echo   [5] Open admin dashboard   - http://localhost:4100/admin.html
echo   [6] Open mobile app        - http://localhost:8100
echo.
echo   [R] Refresh status
echo   [Q] Quit
echo.

choice /c 123456RQ /n /m "Select an option (1-6, R, Q): "

if errorlevel 8 goto END
if errorlevel 7 goto CHECK_STATUS
if errorlevel 6 (
    start http://localhost:8100
    goto CHECK_STATUS
)
if errorlevel 5 (
    start http://localhost:4100/admin.html
    goto CHECK_STATUS
)
if errorlevel 4 (
    echo.
    echo Terminal windows contain the logs.
    echo Press any key to continue...
    pause >nul
    goto CHECK_STATUS
)
if errorlevel 3 (
    call stop-all.bat
    timeout /t 3 /nobreak >nul
    call start-all.bat
    goto END
)
if errorlevel 2 (
    call stop-all.bat
    goto END
)
if errorlevel 1 (
    call start-all.bat
    goto END
)

:END
echo.
echo Exiting...
timeout /t 1 /nobreak >nul
