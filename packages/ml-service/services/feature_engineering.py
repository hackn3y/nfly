import pandas as pd
import numpy as np
from typing import Dict, List
from utils.logger import logger

class FeatureEngineer:
    """Extract and engineer features for ML models"""

    def __init__(self):
        self.feature_names = []

    async def extract_features(self, game_data: Dict) -> List[float]:
        """Extract features from game data"""
        features = []

        # Team statistics features
        team_stats = await self._get_team_stats(
            game_data.get("home_team"),
            game_data.get("away_team")
        )
        features.extend(team_stats)

        # Historical performance
        historical = await self._get_historical_features(game_data)
        features.extend(historical)

        # Head-to-head record
        h2h = await self._get_h2h_features(
            game_data.get("home_team"),
            game_data.get("away_team")
        )
        features.extend(h2h)

        # Situational features
        situational = self._get_situational_features(game_data)
        features.extend(situational)

        # Weather features (if available)
        if game_data.get("weather"):
            weather = self._encode_weather(game_data["weather"])
            features.extend(weather)
        else:
            features.extend([0, 0, 0])  # Placeholder

        # Injury impact
        injury_impact = await self._calculate_injury_impact(game_data)
        features.append(injury_impact)

        # Rest days
        rest_days = game_data.get("rest_days", 7)
        features.append(rest_days)

        # Home field advantage
        features.append(1)  # 1 for home team perspective

        return features

    async def _get_team_stats(self, home_team: str, away_team: str) -> List[float]:
        """Get team statistics"""
        # TODO: Query actual team stats from database
        # Placeholder: offensive and defensive ratings
        return [
            0.5,  # home offensive rating
            0.5,  # home defensive rating
            0.5,  # away offensive rating
            0.5,  # away defensive rating
            0.5,  # home yards per play
            0.5,  # away yards per play
            0.5,  # home turnover diff
            0.5,  # away turnover diff
        ]

    async def _get_historical_features(self, game_data: Dict) -> List[float]:
        """Get historical performance features"""
        # TODO: Calculate from historical data
        return [
            0.5,  # home win percentage last 5 games
            0.5,  # away win percentage last 5 games
            0.5,  # home average points scored
            0.5,  # away average points scored
            0.5,  # home average points allowed
            0.5,  # away average points allowed
        ]

    async def _get_h2h_features(self, home_team: str, away_team: str) -> List[float]:
        """Get head-to-head history features"""
        # TODO: Query H2H history
        return [
            0.5,  # home team win rate in H2H
            0.5,  # average point diff in H2H
        ]

    def _get_situational_features(self, game_data: Dict) -> List[float]:
        """Get situational features"""
        week = game_data.get("week", 1)
        is_divisional = game_data.get("is_divisional", False)
        is_primetime = game_data.get("is_primetime", False)

        return [
            week / 18.0,  # normalize week
            1.0 if is_divisional else 0.0,
            1.0 if is_primetime else 0.0,
        ]

    def _encode_weather(self, weather_str: str) -> List[float]:
        """Encode weather conditions"""
        # TODO: Parse and encode weather
        # Placeholder: temperature, wind speed, precipitation
        return [0.5, 0.5, 0.0]

    async def _calculate_injury_impact(self, game_data: Dict) -> float:
        """Calculate impact of injuries on game"""
        # TODO: Weight injuries by player importance
        return 0.0  # Placeholder

    def get_feature_names(self) -> List[str]:
        """Get names of all features"""
        return [
            "home_off_rating", "home_def_rating",
            "away_off_rating", "away_def_rating",
            "home_ypp", "away_ypp",
            "home_turnover_diff", "away_turnover_diff",
            "home_win_pct_l5", "away_win_pct_l5",
            "home_avg_pts_scored", "away_avg_pts_scored",
            "home_avg_pts_allowed", "away_avg_pts_allowed",
            "h2h_home_win_rate", "h2h_avg_diff",
            "week_normalized", "is_divisional", "is_primetime",
            "temperature", "wind_speed", "precipitation",
            "injury_impact", "rest_days", "is_home"
        ]
