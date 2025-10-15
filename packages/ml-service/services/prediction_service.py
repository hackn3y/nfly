import numpy as np
import pandas as pd
from typing import List, Dict, Optional
import joblib
from pathlib import Path

from services.feature_engineering import FeatureEngineer
from services.gematria_service import GematriaService
from utils.logger import logger

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
        # TODO: Query database for upcoming games
        # For now, return mock data
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
        # Get game data
        game_data = await self._get_game_data(game_id)

        # Extract features
        features = await self.feature_engineer.extract_features(game_data)

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
            # Weight models by historical accuracy
            weights = {"random_forest": 0.35, "xgboost": 0.40, "neural_net": 0.25}
            home_votes = sum(
                weights.get(name, 0.33)
                for name, pred in predictions.items()
                if pred["winner"] == "home"
            )

            predicted_winner = game_data["home_team"] if home_votes >= 0.5 else game_data["away_team"]
            overall_confidence = np.mean(list(confidences.values()))
        else:
            # Fallback: simple heuristic
            predicted_winner = game_data["home_team"]
            overall_confidence = 0.55

        # Get gematria analysis
        gematria_insights = await self.gematria_service.analyze_game(game_data)

        # Calculate score predictions
        predicted_scores = self._predict_scores(game_data, features)

        # Determine key factors
        key_factors = self._identify_key_factors(features, game_data)

        return {
            "game_id": game_id,
            "home_team": game_data["home_team"],
            "away_team": game_data["away_team"],
            "predicted_winner": predicted_winner,
            "predicted_score": predicted_scores,
            "confidence": float(overall_confidence),
            "spread_prediction": predicted_scores["spread"],
            "over_under_prediction": predicted_scores["total"],
            "key_factors": key_factors,
            "gematria_insights": gematria_insights,
            "model_breakdown": predictions
        }

    async def get_weekly_predictions(self, week: int, season: int) -> List[Dict]:
        """Get predictions for a specific week"""
        # TODO: Query games for specific week/season
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

    def _predict_scores(self, game_data: Dict, features: List) -> Dict:
        """Predict final scores and spread"""
        # Simplified score prediction
        home_score = 24.5  # Average NFL score
        away_score = 21.0

        # Adjust based on team strength (would use actual features)
        # This is a placeholder

        return {
            "home": round(home_score, 1),
            "away": round(away_score, 1),
            "spread": round(home_score - away_score, 1),
            "total": round(home_score + away_score, 1)
        }

    def _identify_key_factors(self, features: List, game_data: Dict) -> List[str]:
        """Identify key factors influencing the prediction"""
        factors = []

        # Placeholder key factors
        factors.append("Home field advantage")
        factors.append("Recent team performance trends")
        factors.append("Head-to-head history")

        # Add weather if significant
        if game_data.get("weather"):
            factors.append(f"Weather: {game_data['weather']}")

        # Add injuries if significant
        if game_data.get("injuries_count", 0) > 2:
            factors.append("Multiple key injuries")

        return factors[:5]  # Top 5 factors

    async def _get_upcoming_games_from_db(self) -> List[Dict]:
        """Fetch upcoming games from database"""
        # TODO: Implement actual database query
        # Placeholder mock data
        return [
            {
                "id": 1,
                "home_team": "Kansas City Chiefs",
                "away_team": "Buffalo Bills",
                "game_date": "2025-10-20"
            }
        ]

    async def _get_game_data(self, game_id: int) -> Dict:
        """Fetch game data from database"""
        # TODO: Implement actual database query
        return {
            "id": game_id,
            "home_team": "Kansas City Chiefs",
            "away_team": "Buffalo Bills",
            "game_date": "2025-10-20",
            "venue": "Arrowhead Stadium",
            "weather": "Clear, 72°F"
        }

    async def _get_weekly_games(self, week: int, season: int) -> List[Dict]:
        """Fetch games for a specific week"""
        # TODO: Implement actual database query
        return []
