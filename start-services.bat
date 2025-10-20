@echo off
echo ================================
echo NFL Predictor - Starting Services
echo ================================
echo.

echo Checking if Docker services are running...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo Starting databases...
docker-compose up -d postgres mongodb redis
timeout /t 10 /nobreak >nul
echo ✓ Databases started
echo.

echo Starting Backend API...
start "NFL Backend" cmd /k "cd packages\backend && npm run dev"
timeout /t 3 /nobreak >nul
echo ✓ Backend starting on http://localhost:4100
echo.

echo Starting ML Service...
start "NFL ML Service" cmd /k "cd packages\ml-service && python app.py"
timeout /t 3 /nobreak >nul
echo ✓ ML Service starting on http://localhost:5000
echo.

echo Starting Mobile App...
start "NFL Mobile" cmd /k "cd packages\mobile && npm start"
echo ✓ Mobile app starting...
echo.

echo ================================
echo All Services Started!
echo ================================
echo.
echo Backend API:     http://localhost:4100/api
echo ML Service:      http://localhost:5000/docs
echo Mobile App:      http://localhost:8100 (Expo DevTools)
echo.
echo Press any key to view status...
pause
