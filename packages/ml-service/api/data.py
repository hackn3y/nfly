from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.data_service import DataService
from utils.logger import logger

router = APIRouter()


class UpdateRequest(BaseModel):
    season: Optional[int] = None
    week: Optional[int] = None
    include_weather: bool = True
    include_odds: bool = True

@router.post("/fetch/games")
async def fetch_games(season: Optional[int] = None, week: Optional[int] = None):
    """Fetch game data from external API"""
    try:
        service = DataService()
        result = await service.fetch_games(season, week)
        return {
            "status": "success",
            "season": result.get("season"),
            "week": result.get("week"),
            "games_fetched": result.get("fetched"),
            "games_inserted": result.get("inserted"),
            "games_updated": result.get("updated"),
            "season": result.get("season"),
            "week": result.get("week")
        }
    except Exception as e:
        logger.error(f"Error fetching games: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fetch/stats")
async def fetch_team_stats(season: Optional[int] = None, week: Optional[int] = None):
    """Fetch team statistics"""
    try:
        service = DataService()
        result = await service.fetch_team_stats(season, week)
        return {
            "status": "success",
            "season": result.get("season"),
            "week": result.get("week"),
            "teams_updated": result.get("processed"),
            "season": result.get("season"),
            "week": result.get("week")
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
            "season": result.get("season"),
            "injuries_updated": result.get("processed")
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
            "season": result.get("season"),
            "week": result.get("week"),
            "entries_created": result.get("processed"),
            "message": result.get("message")
        }
    except Exception as e:
        logger.error(f"Error fetching odds: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update/all")
async def update_all_data(payload: UpdateRequest = UpdateRequest()):
    """Update all data sources (games, stats, injuries, odds)"""
    try:
        service = DataService()
        result = await service.update_all(
            season=payload.season,
            week=payload.week,
            include_weather=payload.include_weather,
            include_odds=payload.include_odds
        )
        return {
            "status": "success",
            "details": result
        }
    except Exception as e:
        logger.error(f"Error updating all data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
