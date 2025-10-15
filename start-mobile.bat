@echo off
echo Starting NFL Predictor Mobile App...
cd packages\mobile
start "NFL Mobile App" cmd /k "npm start"
echo.
echo Mobile app is starting!
echo.
echo In the Expo window that opens:
echo   - Press 'w' to open in web browser
echo   - Press 'a' to open in Android emulator
echo   - Press 'i' to open in iOS simulator (Mac only)
echo   - Or scan QR code with Expo Go app on your phone
echo.
echo Login with:
echo   Email: test@nflpredictor.com
echo   Password: password123
echo.
pause
