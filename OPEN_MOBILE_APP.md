# 📱 How to Open the Mobile App

The Expo dev server is running on **port 8081**.

## Option 1: Open Expo DevTools (Easiest)

**Open your browser and go to:**
```
http://localhost:8081
```

You should see the Expo DevTools interface with a QR code and options.

Then:
- Click the **"Open in web browser"** button, OR
- Press **`w`** key in the terminal where Expo is running

---

## Option 2: Open Directly in Browser

The web version should be available at:
```
http://localhost:19006
```

If that doesn't work, the Expo server will tell you the correct URL in the DevTools.

---

## Option 3: Use Your Phone

1. **Install Expo Go** app from:
   - iOS: App Store
   - Android: Google Play Store

2. **Make sure your phone is on the same WiFi** as your computer

3. **Open http://localhost:8081** in your browser

4. **Scan the QR code** with:
   - iOS: Camera app
   - Android: Expo Go app

---

## Option 4: Start Fresh

If the mobile app isn't responding, restart it:

```bash
# Open a new terminal
cd packages\mobile

# Start Expo
npx expo start

# Then press 'w' when prompted
```

This will:
1. Start the Expo dev server
2. Show you a QR code
3. Give you options to open in web/iOS/Android

---

## What You'll See

When the app opens, you'll see:

1. **Welcome Screen** with:
   - "Get Started" button
   - "Sign In" button
   - Feature list

2. **Try logging in:**
   - Email: `test@nflpredictor.com`
   - Password: `password123`

3. **After login**, you'll see:
   - **Home Tab**: Dashboard with stats
   - **Predictions Tab**: Game predictions
   - **Gematria Tab**: Calculator
   - **Profile Tab**: Your account

---

## Troubleshooting

### "Cannot connect to Metro"
- Make sure backend is running: http://localhost:3000/health
- Check Expo is running: http://localhost:8081

### "Network request failed"
- Update the API URL in `packages/mobile/app.json`
- Change `apiUrl` to your computer's local IP if using phone

### Port already in use
```bash
npx kill-port 8081 19006
cd packages\mobile
npx expo start
```

---

## Quick Test

**Right now, open your browser:**
```
http://localhost:8081
```

You should see the Expo DevTools!

---

## Mobile App Features to Try

Once opened:

1. **Register/Login** - Use test credentials
2. **Gematria Calculator**:
   - Go to Gematria tab
   - Enter: "Kansas City Chiefs"
   - Click Calculate
3. **View Predictions** (mock data)
4. **Check Profile** - See your Free tier subscription

---

**Login Credentials:**
- Email: `test@nflpredictor.com`
- Password: `password123`

**Try it now:** http://localhost:8081
