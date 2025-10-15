@echo off
cd packages\backend
start "NFL Backend API" cmd /k "npm run dev"
echo Backend starting on http://localhost:3000
timeout /t 5 /nobreak >nul
curl http://localhost:3000/health 2>nul || echo Waiting for backend...
