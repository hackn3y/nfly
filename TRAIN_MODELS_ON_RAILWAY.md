# How to Train Models on Railway

The ML service is running but using baseline predictions because models haven't been trained yet.

## Option 1: Train via Railway CLI (Recommended)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Link to your project:
```bash
railway link
```

4. Run training command on Railway:
```bash
railway run python packages/ml-service/training/train_models.py
```

This will train the models directly on Railway's infrastructure with access to the production database.

## Option 2: Train via One-Time Job

1. Go to your Railway project dashboard
2. Click "+ New" → "Empty Service"
3. Configure the service:
   - **Name**: model-trainer
   - **Source**: Connect to same GitHub repo
   - **Root Directory**: `packages/ml-service`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python training/train_models.py`

4. Add environment variables (copy from ML service):
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

5. Deploy once, wait for completion
6. Check logs to verify models were trained
7. Delete this service after training completes

The models will be saved to the ML service's persistent volume.

## Option 3: Upload Local Models (Quick Fix)

If models are already trained locally in `packages/ml-service/models/`:

1. Install Railway CLI (see Option 1)
2. Link to your ML service:
```bash
railway link
```

3. Upload models:
```bash
railway run --service ml-service mkdir -p /app/models
railway run --service ml-service ls /app/models
```

Note: This is tricky because Railway uses ephemeral filesystems. Better to retrain on Railway.

## Option 4: API Endpoint (If Available)

The ML service has a training endpoint at `/api/models/train`, but it's  not publicly accessible since the ML service is private.

You can trigger it from the backend service:

1. SSH into backend service or create a one-time script
2. Call the internal ML service:
```bash
curl -X POST http://ml-service:8080/api/models/train
```

## Recommended Approach

Use **Option 1** (Railway CLI) as it's the most straightforward:

```bash
# One-time setup
npm install -g @railway/cli
railway login
railway link  # Select your nfl-predictor project

# Train models (this will take 5-10 minutes)
railway run --service ml-service python training/train_models.py

# Verify
railway logs --service ml-service
```

After training completes, restart the ML service:
```bash
railway restart --service ml-service
```

Then refresh your mobile app - predictions should now be unique for each game!
