# Force Model Retraining

The ML service has already trained models with synthetic data. To retrain with the real 108 games from the 2025 season, you need to delete the existing model files.

## Option 1: Via Railway Dashboard (Recommended)

1. Go to https://railway.app/dashboard
2. Select your project "extraordinary-warmth"
3. Click on "ml-service"
4. Go to the "Variables" tab
5. Add a new environment variable:
   - Name: `FORCE_RETRAIN`
   - Value: `true`
6. Save and wait for redeployment

The app.py checks for this variable and will delete old models and retrain.

## Option 2: Via SSH

```powershell
railway link  # (already done)
railway ssh
```

Then in the SSH session:
```bash
cd /app/models
rm -f *.joblib
exit
```

Then restart the service:
```powershell
railway restart
```

## Option 3: Add Variable Then Remove It

Actually, let me add code to check for a FORCE_RETRAIN variable...

## Verification

After retraining with real data, the logs should show:
```
Loaded 108 historical games
Training Random Forest...
Training XGBoost...
Training Neural Network...
```

Instead of:
```
Only 0 games found. Need at least 100 for training.
Falling back to synthetic data.
```
