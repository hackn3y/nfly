@echo off
echo Connecting to Railway ML service via SSH...
echo.
echo Once connected, run this command:
echo   cd /app ^&^& python train_once.py
echo.
echo This will train the models (takes 5-10 minutes).
echo.
pause

echo.
echo Attempting to SSH into ml-service...
echo.

railway ssh ml-service
