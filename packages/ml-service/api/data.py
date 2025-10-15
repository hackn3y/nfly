from fastapi import APIRouter, HTTPException
from typing import Optional

from services.data_service import DataService
from utils.logger import logger

router = APIRouter()

@router.post("/fetch/games")
async def fetch_games(season: int, week: Optional[int] = None):
    """Fetch game data from external API"""
    try:
        service = DataService()
        result = await service.fetch_games(season, week)
        return {
            "status": "success",
            "games_fetched": result["count"],
            "season": season,
            "week": week
        }
    except Exception as e:
        logger.error(f"Error fetching games: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fetch/stats")
async def fetch_team_stats(season: int, week: Optional[int] = None):
    """Fetch team statistics"""
    try:
        service = DataService()
        result = await service.fetch_team_stats(season, week)
        return {
            "status": "success",
            "teams_updated": result["count"],
            "season": season,
            "week": week
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fetch/injuries")
async def fetch_injuries():
    """Fetch current injury reports"""
    try:
        service = DataService()
        result = await service.fetch_injuries()
        return {
            "status": "success",
            "injuries_updated": result["count"]
        }
    except Exception as e:
        logger.error(f"Error fetching injuries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fetch/odds")
async def fetch_betting_odds():
    """Fetch current betting lines"""
    try:
        service = DataService()
        result = await service.fetch_betting_odds()
        return {
            "status": "success",
            "games_updated": result["count"]
        }
    except Exception as e:
        logger.error(f"Error fetching odds: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update/all")
async def update_all_data():
    """Update all data sources (games, stats, injuries, odds)"""
    try:
        service = DataService()
        result = await service.update_all()
        return {
            "status": "success",
            "details": result
        }
    except Exception as e:
        logger.error(f"Error updating all data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
