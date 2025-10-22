import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager

from api import predictions, models, data
from utils.logger import logger
from utils.database import init_db, close_db

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting NFL Predictor ML Service...")
    await init_db()
    logger.info("Database connections established")

    # Auto-train models if they don't exist
    from pathlib import Path
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)

    if not (models_dir / "rf_model.joblib").exists():
        logger.info("=" * 60)
        logger.info("No trained models found - training models now...")
        logger.info("This is a one-time operation that takes 5-10 minutes")
        logger.info("=" * 60)
        try:
            from services.model_service import ModelService
            model_service = ModelService()
            result = await model_service.train_models()
            logger.info("✅ Model training complete!")
            logger.info(f"Training results: {result}")
        except Exception as e:
            logger.error(f"❌ Model training failed: {e}")
            logger.warning("Will use baseline predictions until models are trained manually")
    else:
        logger.info("✅ Models found, skipping training")

    yield
    # Shutdown
    logger.info("Shutting down ML Service...")
    await close_db()

app = FastAPI(
    title="NFL Predictor ML Service",
    description="Machine Learning service for NFL game predictions",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ml-service",
        "version": "1.0.0"
    }

# Include routers
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(models.router, prefix="/api/models", tags=["models"])
app.include_router(data.router, prefix="/api/data", tags=["data"])

@app.get("/")
async def root():
    return {
        "message": "NFL Predictor ML Service",
        "version": "1.0.0",
        "endpoints": {
            "predictions": "/api/predictions",
            "models": "/api/models",
            "data": "/api/data",
            "health": "/health",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("DEBUG", "False").lower() == "true"
    )
