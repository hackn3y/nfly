## Train ML Models on Railway - Step by Step

Since `railway run` doesn't work well on Windows, use Railway's dashboard instead:

### Option 1: One-Time Deployment (Easiest)

1. **Go to Railway Dashboard**
   - Open https://railway.app/dashboard
   - Select your project: "extraordinary-warmth"

2. **Find your ML Service**
   - Click on the "ml-service" service

3. **Open the Shell**
   - Click on the "Settings" tab
   - Scroll down to find "Shell" or "Terminal"
   - OR click the three dots (⋯) menu → "Shell"

4. **Run Training Command**
   In the Railway shell, run:
   ```bash
   cd /app
   python train_once.py
   ```

   This will train the models (takes 5-10 minutes).

5. **Verify**
   Check the logs to see:
   ```
   ✅ Model training complete!
   Models saved to /app/models/
   ```

6. **Restart ML Service**
   - Go back to the ML service
   - Click "Restart" button
   - The service will now use the trained models

---

### Option 2: Modify Start Command Temporarily

1. **Go to Railway Dashboard** → Your Project → ML Service

2. **Click Settings Tab**

3. **Find "Start Command"**
   - Current command: Something like `uvicorn app:app --host 0.0.0.0 --port 8080`

4. **Temporarily Change It To:**
   ```bash
   python train_once.py && uvicorn app:app --host 0.0.0.0 --port 8080
   ```

5. **Deploy**
   - Railway will restart the service
   - It will train models first, then start the API server
   - Check logs to see training progress

6. **After Training, Revert the Command**
   - Change start command back to just:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8080
   ```
   - This ensures training doesn't run on every restart

---

### Option 3: Add Training Script to Startup (Permanent)

If you want models to automatically retrain on deployment:

1. **Edit** `packages/ml-service/app.py`

2. **Add training to startup**:
   ```python
   @asynccontextmanager
   async def lifespan(app: FastAPI):
       # Startup
       logger.info("Starting NFL Predictor ML Service...")
       await init_db()

       # Train models if they don't exist
       from pathlib import Path
       models_dir = Path("models")
       if not (models_dir / "rf_model.joblib").exists():
           logger.info("No models found, training...")
           from training.train_models import NFLModelTrainer
           trainer = NFLModelTrainer()
           trainer.load_training_data(min_season=2020)
           trainer.train_all_models()

       logger.info("Database connections established")
       yield
       # Shutdown
       logger.info("Shutting down ML Service...")
       await close_db()
   ```

3. **Commit and Push**
   ```bash
   git add packages/ml-service/app.py
   git commit -m "Auto-train models on first startup"
   git push
   ```

Railway will auto-deploy and train models on first run.

---

### Option 4: Use Railway CLI with Exec (Windows)

Try this Railway CLI command that executes remotely:

```powershell
railway exec --service ml-service "cd /app && python train_once.py"
```

Or:

```powershell
railway exec --service ml-service "python /app/train_once.py"
```

---

### Recommended: Option 1 (Shell)

**Use the Railway shell** - it's the most straightforward:

1. https://railway.app/dashboard
2. Select your project
3. Click "ml-service"
4. Click the "⋯" menu → "Shell"
5. Run: `cd /app && python train_once.py`
6. Wait 5-10 minutes
7. Restart the service

After this, predictions in your mobile app will be unique for each game!

---

### Verify Training Worked

After restarting, check the logs. You should see:
```
INFO - ✅ Models loaded successfully
INFO - Loaded Random Forest model
INFO - Loaded XGBoost model
INFO - Loaded Neural Network model
```

Instead of:
```
WARNING - No trained models found, will use baseline predictions
```

Then refresh your mobile app - predictions should now vary by game!
