@echo off
cd packages\backend
start "NFL Backend API" cmd /k "npm run dev"
echo Backend starting on http://localhost:4100
timeout /t 5 /nobreak >nul
curl http://localhost:4100/health 2>nul || echo Waiting for backend...
