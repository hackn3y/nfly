@echo off
echo ================================
echo NFL Predictor - Setup Script
echo ================================
echo.

echo Step 1: Installing Backend Dependencies...
cd packages\backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend npm install failed
    pause
    exit /b 1
)
cd ..\..
echo ✓ Backend dependencies installed
echo.

echo Step 2: Installing ML Service Dependencies...
cd packages\ml-service
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: ML service pip install failed
    pause
    exit /b 1
)
cd ..\..
echo ✓ ML service dependencies installed
echo.

echo Step 3: Installing Mobile App Dependencies...
cd packages\mobile
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Mobile npm install failed
    pause
    exit /b 1
)
cd ..\..
echo ✓ Mobile dependencies installed
echo.

echo ================================
echo Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
echo 2. Run: docker-compose up -d
echo 3. Run start-services.bat to start the application
echo.
pause
