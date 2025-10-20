@echo off
echo Starting ML Model Training...
echo.

cd %~dp0..
python training/train_models.py

echo.
echo Training complete!
pause
