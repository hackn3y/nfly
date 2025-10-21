import numpy as np
import pandas as pd
from typing import List, Dict, Optional
import joblib
from pathlib import Path

from sqlalchemy import text

from services.feature_engineering import FeatureEngineer
from services.gematria_service import GematriaService
from utils.logger import logger
from utils.database import SessionLocal

class PredictionService:
    """Service for generating NFL game predictions"""

    def __init__(self):
        self.models_dir = Path(__file__).parent.parent / "models"
        self.models_dir.mkdir(exist_ok=True)
        self.feature_engineer = FeatureEngineer()
        self.gematria_service = GematriaService()
        self.models = self._load_models()

    def _load_models(self):
        """Load trained ML models"""
        models = {}
        model_files = {
            "random_forest": "rf_model.joblib",
            "xgboost": "xgb_model.joblib",
            "neural_net": "nn_model.joblib"
        }

        for name, filename in model_files.items():
            model_path = self.models_dir / filename
            if model_path.exists():
                try:
                    models[name] = joblib.load(model_path)
                    logger.info(f"Loaded model: {name}")
                except Exception as e:
                    logger.warning(f"Could not load {name}: {e}")
            else:
                logger.warning(f"Model file not found: {filename}")

        # If no models loaded, use placeholder
        if not models:
            logger.warning("No trained models found, will use baseline predictions")

        return models

    async def get_upcoming_predictions(self) -> List[Dict]:
        """Get predictions for all upcoming games"""
        upcoming_games = await self._get_upcoming_games_from_db()

        predictions = []
        for game in upcoming_games:
            try:
                prediction = await self.predict_game(game['id'])
                predictions.append(prediction)
            except Exception as e:
                logger.error(f"Error predicting game {game['id']}: {e}")

        return predictions

    async def predict_game(self, game_id: int) -> Dict:
        """Generate detailed prediction for a specific game"""
        async with SessionLocal() as session:
            game_data = await self._get_game_data(session, game_id)

            if not game_data:
                raise ValueError(f"Game {game_id} not found")

            # Extract features
            features = await self.feature_engineer.extract_features(game_data, session)

            # Get predictions from each model
            predictions = {}
            confidences = {}

            if self.models:
                for model_name, model in self.models.items():
                    try:
                        pred_proba = model.predict_proba([features])[0]
                        predictions[model_name] = {
                            "winner": "home" if pred_proba[1] > 0.5 else "away",
                            "confidence": float(max(pred_proba))
                        }
                        confidences[model_name] = float(max(pred_proba))
                    except Exception as e:
                        logger.error(f"Error with {model_name}: {e}")

            # Ensemble prediction (weighted average)
            if predictions:
                weights = {"random_forest": 0.35, "xgboost": 0.40, "neural_net": 0.25}
                home_votes = sum(
                    weights.get(name, 0.33)
                    for name, pred in predictions.items()
                    if pred["winner"] == "home"
                )

                predicted_side = "home" if home_votes >= 0.5 else "away"
                predicted_winner = game_data["home_team"] if predicted_side == "home" else game_data["away_team"]
                overall_confidence = float(np.mean(list(confidences.values()))) if confidences else 0.6
            else:
                # Fallback: simple heuristic using average points
                home_points = game_data.get("home_recent", {}).get("avg_points_for", 24)
                away_points = game_data.get("away_recent", {}).get("avg_points_for", 21)
                predicted_side = "home" if home_points >= away_points else "away"
                predicted_winner = game_data["home_team"] if predicted_side == "home" else game_data["away_team"]
                overall_confidence = 0.56 if predicted_side == "home" else 0.52

            # Get gematria analysis
            gematria_insights = await self.gematria_service.analyze_game(game_data)

            # Calculate score predictions
            predicted_scores = self._predict_scores(game_data)

            # Determine key factors
            key_factors = self._identify_key_factors(game_data)

            return {
                "game_id": game_id,
                "season": game_data.get("season"),
                "week": game_data.get("week"),
                "game_date": game_data.get("game_date"),
                "home_team": game_data["home_team"],
                "away_team": game_data["away_team"],
                "home_abbr": game_data.get("home_abbr"),
                "away_abbr": game_data.get("away_abbr"),
                "predicted_winner": predicted_winner,
                "predicted_score": predicted_scores,
                "confidence": float(overall_confidence),
                "spread_prediction": predicted_scores["spread"],
                "over_under_prediction": predicted_scores["total"],
                "key_factors": key_factors,
                "gematria_insights": gematria_insights,
                "model_breakdown": predictions,
                "injuries": game_data.get("injuries"),
                "weather": game_data.get("weather"),
                "venue": game_data.get("venue")
            }

    async def get_weekly_predictions(self, week: int, season: int) -> List[Dict]:
        """Get predictions for a specific week"""
        games = await self._get_weekly_games(week, season)

        predictions = []
        for game in games:
            try:
                prediction = await self.predict_game(game['id'])
                predictions.append(prediction)
            except Exception as e:
                logger.error(f"Error predicting game {game['id']}: {e}")

        return predictions

    async def optimize_parlay(
        self,
        game_ids: List[int],
        max_selections: int = 5,
        target_odds: Optional[float] = None
    ) -> Dict:
        """Optimize parlay selections based on confidence and odds"""
        predictions = []

        for game_id in game_ids:
            pred = await self.predict_game(game_id)
            predictions.append(pred)

        # Sort by confidence
        sorted_preds = sorted(predictions, key=lambda x: x["confidence"], reverse=True)

        # Select top N by confidence
        selected = sorted_preds[:max_selections]

        # Calculate combined odds (simplified)
        combined_confidence = np.prod([p["confidence"] for p in selected])
        estimated_odds = 1 / combined_confidence if combined_confidence > 0 else 1

        return {
            "selections": selected,
            "num_picks": len(selected),
            "combined_confidence": float(combined_confidence),
            "estimated_odds": float(estimated_odds),
            "recommended": combined_confidence > 0.6
        }

    def _predict_scores(self, game_data: Dict) -> Dict:
        """Predict final scores and spread using recent averages"""
        home_recent = game_data.get("home_recent", {})
        away_recent = game_data.get("away_recent", {})

        home_points = home_recent.get("avg_points_for", 24.0)
        away_points = away_recent.get("avg_points_for", 22.0)

        # Adjust for injury impact (negative value favors home team)
        injury_adj = game_data.get("injury_impact") or 0.0
        home_points = max(home_points + injury_adj, 10.0)
        away_points = max(away_points - injury_adj, 10.0)

        # Adjust for weather (heavy precipitation / high wind -> lower total)
        weather = game_data.get("weather") or {}
        precipitation_flag = weather.get("precipitation", 0.0)
        wind_speed = weather.get("windSpeed")
        weather_penalty = 0.0
        if precipitation_flag:
            weather_penalty += 2.5
        if wind_speed and wind_speed > 15:
            weather_penalty += (wind_speed - 15) * 0.2

        total_points = max(home_points + away_points - weather_penalty, 34.0)
        spread = home_points - away_points

        return {
            "home": round(home_points, 1),
            "away": round(total_points - home_points, 1),
            "spread": round(spread, 1),
            "total": round(total_points, 1)
        }

    def _identify_key_factors(self, game_data: Dict) -> List[str]:
        """Identify key factors influencing the prediction"""
        factors: List[str] = []

        home_recent = game_data.get("home_recent") or {}
        away_recent = game_data.get("away_recent") or {}
        h2h = game_data.get("h2h") or {}

        if home_recent.get("win_pct") is not None:
            factors.append(
                f"Home last 5 games: {int(home_recent['win_pct'] * 100)}% wins"
            )
        if away_recent.get("win_pct") is not None:
            factors.append(
                f"Away last 5 games: {int(away_recent['win_pct'] * 100)}% wins"
            )
        if h2h.get("win_pct") is not None:
            factors.append(
                f"Head-to-head home win rate: {int(h2h['win_pct'] * 100)}%"
            )
        if h2h.get("avg_diff") is not None:
            factors.append(
                f"Avg H2H margin: {round(h2h['avg_diff'], 1)} pts"
            )

        weather = game_data.get("weather")
        if weather and (weather.get("windSpeed") or weather.get("temperature") is not None):
            factors.append(
                f"Weather impact: {str(weather.get('conditions', 'clear')).title()}"
            )

        injury_impact = game_data.get("injury_impact")
        if injury_impact and abs(injury_impact) >= 0.3:
            focus = "home" if injury_impact > 0 else "away"
            factors.append(f"Injury edge favors {focus}")

        return factors[:5]

    async def _get_upcoming_games_from_db(self) -> List[Dict]:
        """Fetch upcoming games from database"""
        async with SessionLocal() as session:
            result = await session.execute(
                text(
                    """
                    SELECT id, home_team, away_team, game_date, season, week
                    FROM games
                                        WHERE game_date >= NOW() - INTERVAL '4 hours'
                                            AND status NOT IN (
                                                'final', 'STATUS_FINAL',
                                                'postponed', 'STATUS_POSTPONED',
                                                'canceled', 'STATUS_CANCELED'
                                            )
                    ORDER BY game_date ASC
                    LIMIT 20
                    """
                )
            )

            return [dict(row) for row in result.mappings().all()]

    async def _get_game_data(self, session, game_id: int) -> Dict:
        """Fetch game data from database"""
        result = await session.execute(
            text(
                """
                SELECT
                  g.*, ht.abbreviation AS home_abbr, ht.conference AS home_conference,
                  ht.division AS home_division,
                  at.abbreviation AS away_abbr, at.conference AS away_conference,
                  at.division AS away_division
                FROM games g
                LEFT JOIN teams ht ON g.home_team_id = ht.id
                LEFT JOIN teams at ON g.away_team_id = at.id
                WHERE g.id = :game_id
                LIMIT 1
                """
            ),
            {"game_id": game_id}
        )

        row = result.mappings().first()
        if not row:
            return {}

        injuries_result = await session.execute(
            text(
                """
                SELECT team_id,
                       COUNT(*) FILTER (WHERE status IN ('Out', 'IR')) AS severe,
                       COUNT(*) FILTER (WHERE status IN ('Questionable', 'Doubtful')) AS questionable
                FROM injuries
                WHERE season = :season AND team_id IN (:home_id, :away_id)
                GROUP BY team_id
                """
            ),
            {
                "season": row.season,
                "home_id": row.home_team_id,
                "away_id": row.away_team_id
            }
        )
        injury_map = {}
        for rec in injuries_result.mappings():
            injury_map[rec["team_id"]] = {
                "severe": rec["severe"] or 0,
                "questionable": rec["questionable"] or 0,
                "total": (rec["severe"] or 0) + (rec["questionable"] or 0)
            }

        home_recent = await self.feature_engineer._get_recent_summary(
            session,
            row.home_team_id,
            row.game_date,
            limit=5,
            season=row.season,
            week=row.week
        ) if row.home_team_id else {}

        away_recent = await self.feature_engineer._get_recent_summary(
            session,
            row.away_team_id,
            row.game_date,
            limit=5,
            season=row.season,
            week=row.week
        ) if row.away_team_id else {}

        h2h = await self.feature_engineer._get_h2h_features(
            session,
            row.home_team_id,
            row.away_team_id,
            row.game_date
        )

        h2h_summary = {
            "win_pct": h2h[0] if h2h else None,
            "avg_diff": (h2h[1] * 20.0) if h2h else None
        }

        def _impact(details: Dict) -> float:
            if not details:
                return 0.0
            severe = details.get("severe", 0)
            questionable = details.get("questionable", 0)
            impact_val = min(severe * 0.2 + questionable * 0.1, 1.5)
            details["impact"] = impact_val
            return impact_val

        injury_impact = _impact(injury_map.get(row.away_team_id)) - _impact(injury_map.get(row.home_team_id))

        weather = row.weather_conditions or {}
        if isinstance(weather, dict):
            conditions = (weather.get("conditions") or weather.get("condition") or "").lower()
            weather = {**weather}
            weather.setdefault("conditions", conditions)
            weather["precipitation"] = 1.0 if any(
                keyword in conditions for keyword in ["rain", "snow", "storm", "showers"]
            ) else 0.0
        else:
            weather = {}

        game_data = {
            "id": row.id,
            "season": row.season,
            "week": row.week,
            "game_date": row.game_date,
            "home_team": row.home_team,
            "away_team": row.away_team,
            "home_team_id": row.home_team_id,
            "away_team_id": row.away_team_id,
            "home_abbr": row.home_abbr,
            "away_abbr": row.away_abbr,
            "spread": row.spread,
            "over_under": row.over_under,
            "status": row.status,
            "venue": {
                "name": row.venue_name,
                "city": row.venue
            },
            "weather": weather,
            "home_division": row.home_division,
            "away_division": row.away_division,
            "injuries": {
                "home": injury_map.get(row.home_team_id, {}),
                "away": injury_map.get(row.away_team_id, {})
            },
            "injury_impact": injury_impact,
            "home_recent": home_recent,
            "away_recent": away_recent,
            "h2h": h2h_summary
        }

        return game_data

    async def _get_weekly_games(self, week: int, season: int) -> List[Dict]:
        """Fetch games for a specific week (including completed games)"""
        async with SessionLocal() as session:
            result = await session.execute(
                text(
                    """
                    SELECT id, home_team, away_team, game_date, season, week, status
                    FROM games
                    WHERE season = :season AND week = :week
                    AND status NOT IN ('postponed', 'STATUS_POSTPONED', 'canceled', 'STATUS_CANCELED')
                    ORDER BY game_date ASC
                    """
                ),
                {"season": season, "week": week}
            )

            return [dict(row) for row in result.mappings().all()]
