from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import json

from fastapi.encoders import jsonable_encoder

from services.prediction_service import PredictionService
from utils.database import get_redis
from utils.logger import logger

router = APIRouter()

class PredictionResponse(BaseModel):
    game_id: int
    season: Optional[int]
    week: Optional[int]
    game_date: Optional[datetime]
    home_team: str
    away_team: str
    home_abbr: Optional[str]
    away_abbr: Optional[str]
    predicted_winner: str
    predicted_score: dict
    confidence: float
    spread_prediction: float
    over_under_prediction: float
    key_factors: List[str]
    gematria_insights: Optional[dict] = None
    injuries: Optional[Dict[str, Any]] = None
    weather: Optional[Dict[str, Any]] = None
    venue: Optional[Dict[str, Any]] = None
    model_breakdown: Optional[Dict[str, Any]] = None

class ParlayRequest(BaseModel):
    game_ids: List[int]
    max_selections: int = 5
    target_odds: Optional[float] = None

@router.get("/upcoming", response_model=List[PredictionResponse])
async def get_upcoming_predictions():
    """Get predictions for all upcoming games"""
    try:
        redis = get_redis()
        cache_key = "ml:predictions:upcoming"

        # Try cache
        if redis:
            cached = await redis.get(cache_key)
            if cached:
                logger.info("Returning cached upcoming predictions")
                return json.loads(cached)

        # Generate predictions
        service = PredictionService()
        predictions = await service.get_upcoming_predictions()

        # Cache for 30 minutes
        if redis:
            await redis.setex(cache_key, 1800, json.dumps(jsonable_encoder(predictions)))

        return predictions
    except Exception as e:
        logger.error(f"Error getting upcoming predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/game/{game_id}", response_model=PredictionResponse)
async def get_game_prediction(game_id: int):
    """Get detailed prediction for a specific game"""
    try:
        redis = get_redis()
        cache_key = f"ml:prediction:game:{game_id}"

        # Try cache
        if redis:
            cached = await redis.get(cache_key)
            if cached:
                logger.info(f"Returning cached prediction for game {game_id}")
                return json.loads(cached)

        # Generate prediction
        service = PredictionService()
        prediction = await service.predict_game(game_id)

        # Cache for 15 minutes
        if redis:
            await redis.setex(cache_key, 900, json.dumps(jsonable_encoder(prediction)))

        return prediction
    except Exception as e:
        logger.error(f"Error predicting game {game_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weekly")
async def get_weekly_predictions(week: int, season: int):
    """Get predictions for a specific week"""
    try:
        service = PredictionService()
        predictions = await service.get_weekly_predictions(week, season)
        return predictions
    except Exception as e:
        logger.error(f"Error getting weekly predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/parlay")
async def optimize_parlay(request: ParlayRequest):
    """Optimize parlay selections based on predictions"""
    try:
        service = PredictionService()
        optimized = await service.optimize_parlay(
            request.game_ids,
            request.max_selections,
            request.target_odds
        )
        return optimized
    except Exception as e:
        logger.error(f"Error optimizing parlay: {e}")
        raise HTTPException(status_code=500, detail=str(e))
