from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List
import json

from services.model_service import ModelService
from utils.database import get_redis
from utils.logger import logger

router = APIRouter()

class ModelStats(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    total_predictions: int
    correct_predictions: int

@router.get("/stats")
async def get_model_stats():
    """Get performance statistics for all models"""
    try:
        redis = get_redis()
        cache_key = "ml:model:stats"

        # Try cache
        if redis:
            cached = await redis.get(cache_key)
            if cached:
                logger.info("Returning cached model stats")
                return json.loads(cached)

        # Get fresh stats
        service = ModelService()
        stats = await service.get_model_stats()

        # Cache for 1 hour
        if redis:
            await redis.setex(cache_key, 3600, json.dumps(stats))

        return stats
    except Exception as e:
        logger.error(f"Error getting model stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/info")
async def get_model_info():
    """Get information about available models"""
    return {
        "models": [
            {
                "name": "Random Forest",
                "version": "1.0.0",
                "description": "Ensemble learning model for game outcome prediction",
                "features": ["team stats", "player performance", "historical data"]
            },
            {
                "name": "XGBoost",
                "version": "1.0.0",
                "description": "Gradient boosting model optimized for NFL predictions",
                "features": ["team stats", "advanced metrics", "opponent strength"]
            },
            {
                "name": "Neural Network",
                "version": "1.0.0",
                "description": "Deep learning model for pattern recognition",
                "features": ["team stats", "player data", "weather", "injuries"]
            },
            {
                "name": "Ensemble",
                "version": "1.0.0",
                "description": "Combines all models with weighted voting",
                "features": ["all features from individual models"]
            }
        ]
    }

@router.post("/train")
async def trigger_training():
    """Trigger model retraining (admin endpoint)"""
    try:
        service = ModelService()
        result = await service.train_models()
        return {
            "status": "success",
            "message": "Model training initiated",
            "details": result
        }
    except Exception as e:
        logger.error(f"Error triggering training: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feature-importance")
async def get_feature_importance():
    """Get feature importance for the models"""
    try:
        service = ModelService()
        importance = await service.get_feature_importance()
        return importance
    except Exception as e:
        logger.error(f"Error getting feature importance: {e}")
        raise HTTPException(status_code=500, detail=str(e))
