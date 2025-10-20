from typing import Dict, List, Optional
from sqlalchemy import text

# Avoid division by zero utility
def _safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    if denominator in (0, None):
        return default
    return numerator / denominator

class FeatureEngineer:
    """Extract and engineer features for ML models"""

    def __init__(self):
        self.feature_names = []

    async def extract_features(self, game_data: Dict, session) -> List[float]:
        """Extract features from game data"""
        features: List[float] = []

        # Team statistics features
        team_stats = await self._get_team_stats(
            session,
            game_data.get("home_team_id"),
            game_data.get("away_team_id"),
            game_data
        )
        features.extend(team_stats)

        # Historical performance
        historical = await self._get_historical_features(session, game_data)
        features.extend(historical)

        # Head-to-head record
        h2h = await self._get_h2h_features(
            session,
            game_data.get("home_team_id"),
            game_data.get("away_team_id"),
            game_data.get("game_date")
        )
        features.extend(h2h)

        # Situational features
        situational = await self._get_situational_features(session, game_data)
        features.extend(situational)

        # Weather features (if available)
        if game_data.get("weather"):
            weather = self._encode_weather(game_data["weather"])
            features.extend(weather)
        else:
            features.extend([0.0, 0.0, 0.0])

        # Injury impact
        if game_data.get("injury_impact") is not None:
            injury_impact = float(game_data["injury_impact"])
        else:
            injury_impact = await self._calculate_injury_impact(session, game_data)
        features.append(injury_impact)

        # Rest days
        rest_days = await self._get_rest_days(
            session,
            game_data.get("home_team_id"),
            game_data.get("game_date")
        )
        features.append(rest_days)

        # Home field indicator (always 1 for home perspective)
        features.append(1.0)

        return features

    async def _get_team_stats(
        self,
        session,
        home_team_id: Optional[int],
        away_team_id: Optional[int],
        game_data: Dict
    ) -> List[float]:
        """Get normalized team statistics from recent results"""

        home_metrics = await self._get_recent_summary(
            session,
            home_team_id,
            game_data.get("game_date"),
            limit=5,
            season=game_data.get("season"),
            week=game_data.get("week")
        ) if home_team_id else {}

        away_metrics = await self._get_recent_summary(
            session,
            away_team_id,
            game_data.get("game_date"),
            limit=5,
            season=game_data.get("season"),
            week=game_data.get("week")
        ) if away_team_id else {}

        def normalize_off(value: Optional[float]) -> float:
            if value is None:
                return 0.5
            return min(max(value / 40.0, 0.0), 1.0)

        def normalize_def(value: Optional[float]) -> float:
            if value is None:
                return 0.5
            return min(max(1.0 - (value / 35.0), 0.0), 1.0)

        features = [
            normalize_off(home_metrics.get("avg_points_for")),
            normalize_def(home_metrics.get("avg_points_against")),
            normalize_off(away_metrics.get("avg_points_for")),
            normalize_def(away_metrics.get("avg_points_against")),
            min(max(home_metrics.get("yards_per_play", 5.5) / 8.0, 0.0), 1.0),
            min(max(away_metrics.get("yards_per_play", 5.5) / 8.0, 0.0), 1.0),
            home_metrics.get("turnover_diff_normalized", 0.5),
            away_metrics.get("turnover_diff_normalized", 0.5)
        ]

        return features

    async def _get_historical_features(self, session, game_data: Dict) -> List[float]:
        """Get historical performance features"""
        home_summary = await self._get_recent_summary(
            session,
            game_data.get("home_team_id"),
            game_data.get("game_date"),
            limit=5,
            season=game_data.get("season"),
            week=game_data.get("week")
        ) if game_data.get("home_team_id") else {}

        away_summary = await self._get_recent_summary(
            session,
            game_data.get("away_team_id"),
            game_data.get("game_date"),
            limit=5,
            season=game_data.get("season"),
            week=game_data.get("week")
        ) if game_data.get("away_team_id") else {}

        return [
            home_summary.get("win_pct", 0.5),
            away_summary.get("win_pct", 0.5),
            min(home_summary.get("avg_points_for", 22.0) / 40.0, 1.0),
            min(away_summary.get("avg_points_for", 22.0) / 40.0, 1.0),
            min(home_summary.get("avg_points_against", 22.0) / 40.0, 1.0),
            min(away_summary.get("avg_points_against", 22.0) / 40.0, 1.0),
        ]

    async def _get_h2h_features(
        self,
        session,
        home_team_id: Optional[int],
        away_team_id: Optional[int],
        game_date
    ) -> List[float]:
        """Get head-to-head history features"""

        if not home_team_id or not away_team_id:
            return [0.5, 0.0]

        result = await session.execute(
            text(
                """
                SELECT
                  CASE WHEN g.home_team_id = :home_team THEN g.home_score ELSE g.away_score END AS home_points,
                  CASE WHEN g.home_team_id = :home_team THEN g.away_score ELSE g.home_score END AS away_points
                FROM games g
                WHERE ((g.home_team_id = :home_team AND g.away_team_id = :away_team)
                     OR (g.home_team_id = :away_team AND g.away_team_id = :home_team))
                  AND g.game_date < :game_date
                  AND g.status = 'final'
                ORDER BY g.game_date DESC
                LIMIT 10
                """
            ),
            {
                "home_team": home_team_id,
                "away_team": away_team_id,
                "game_date": game_date
            }
        )

        rows = result.fetchall()
        if not rows:
            return [0.5, 0.0]

        wins = sum(1 for row in rows if (row.home_points or 0) > (row.away_points or 0))
        win_pct = wins / len(rows)
        avg_diff = _safe_divide(
            sum((row.home_points or 0) - (row.away_points or 0) for row in rows),
            len(rows)
        )

        return [win_pct, avg_diff / 20.0]

    async def _get_situational_features(self, session, game_data: Dict) -> List[float]:
        """Get situational features"""
        week = game_data.get("week", 1)
        home_team_div = game_data.get("home_division")
        away_team_div = game_data.get("away_division")
        is_divisional = bool(home_team_div and away_team_div and home_team_div == away_team_div)

        # Primetime flag estimation: treat games starting after 7:30 PM local as primetime
        game_date = game_data.get("game_date")
        is_primetime = False
        if game_date:
            is_primetime = game_date.hour >= 19

        return [
            (week or 1) / 18.0,
            1.0 if is_divisional else 0.0,
            1.0 if is_primetime else 0.0,
        ]

    def _encode_weather(self, weather: Dict) -> List[float]:
        """Encode weather conditions"""
        if not weather:
            return [0.0, 0.0, 0.0]

        temperature = weather.get("temperature")
        wind_speed = weather.get("windSpeed")
        conditions = (weather.get("conditions") or weather.get("condition") or "").lower()

        precipitation = 1.0 if any(keyword in conditions for keyword in ["rain", "snow", "storm", "showers"]) else 0.0

        temp_norm = 0.0 if temperature is None else min(max((temperature - 32) / 50.0, -1.0), 1.0)
        wind_norm = 0.0 if wind_speed is None else min(max(wind_speed / 25.0, 0.0), 1.5)

        return [temp_norm, wind_norm, precipitation]

    async def _calculate_injury_impact(self, session, game_data: Dict) -> float:
        """Calculate impact of injuries on game"""
        home_team_id = game_data.get("home_team_id")
        away_team_id = game_data.get("away_team_id")
        season = game_data.get("season")
        if not (home_team_id and away_team_id and season):
            return 0.0

        result = await session.execute(
            text(
                """
                SELECT team_id, COUNT(*) FILTER (WHERE status IN ('Out', 'IR')) AS severe,
                       COUNT(*) FILTER (WHERE status IN ('Doubtful', 'Questionable')) AS questionable
                FROM injuries
                WHERE season = :season
                  AND team_id IN (:home_id, :away_id)
                GROUP BY team_id
                """
            ),
            {
                "season": season,
                "home_id": home_team_id,
                "away_id": away_team_id
            }
        )

        rows = {row.team_id: row for row in result}
        home = rows.get(home_team_id)
        away = rows.get(away_team_id)

        def impact(row) -> float:
            if not row:
                return 0.0
            severe = row.severe or 0
            questionable = row.questionable or 0
            return min(severe * 0.2 + questionable * 0.1, 1.5)

        return impact(away) - impact(home)

    async def _get_rest_days(self, session, team_id: Optional[int], game_date) -> float:
        if not team_id or not game_date:
            return 7.0

        result = await session.execute(
            text(
                """
                SELECT game_date
                FROM games
                WHERE (home_team_id = :team_id OR away_team_id = :team_id)
                  AND game_date < :game_date
                ORDER BY game_date DESC
                LIMIT 1
                """
            ),
            {
                "team_id": team_id,
                "game_date": game_date
            }
        )

        previous = result.scalar_one_or_none()
        if not previous:
            return 7.0

        diff = (game_date - previous).days
        return float(max(diff, 3))

    async def _get_recent_summary(
        self,
        session,
        team_id: int,
        game_date,
        limit: int = 5,
        season: Optional[int] = None,
        week: Optional[int] = None
    ) -> Dict:
        if not team_id or not game_date:
            return {}

        season_val = season or (game_date.year if hasattr(game_date, "year") else None)

        result = await session.execute(
            text(
                """
                SELECT
                  g.game_date,
                  CASE WHEN g.home_team_id = :team_id THEN g.home_score ELSE g.away_score END AS points_for,
                  CASE WHEN g.home_team_id = :team_id THEN g.away_score ELSE g.home_score END AS points_against,
                  CASE WHEN g.home_team_id = :team_id THEN g.spread ELSE -g.spread END AS spread_line
                FROM games g
                WHERE (g.home_team_id = :team_id OR g.away_team_id = :team_id)
                  AND g.game_date < :game_date
                  AND g.status = 'final'
                ORDER BY g.game_date DESC
                LIMIT :limit
                """
            ),
            {
                "team_id": team_id,
                "game_date": game_date,
                "limit": limit
            }
        )

        rows = result.fetchall()
        if not rows:
            return {}

        total = len(rows)
        wins = sum(1 for row in rows if (row.points_for or 0) > (row.points_against or 0))
        avg_points_for = _safe_divide(sum(row.points_for or 0 for row in rows), total)
        avg_points_against = _safe_divide(sum(row.points_against or 0 for row in rows), total)

        yards_per_play = 5.5
        turnover_norm = 0.5

        if season_val:
            stats_result = await session.execute(
                text(
                    """
                    SELECT total_yards, turnovers
                    FROM team_stats
                    WHERE team_id = :team_id AND season = :season
                      AND (:week IS NULL OR week IS NULL OR week <= :week)
                    ORDER BY COALESCE(week, 0) DESC
                    LIMIT 1
                    """
                ),
                {
                    "team_id": team_id,
                    "season": season_val,
                    "week": week
                }
            )
            stats_row = stats_result.mappings().first()
            if stats_row:
                if stats_row.get("total_yards") is not None:
                    yards_per_play = max(
                        _safe_divide(float(stats_row.get("total_yards")), 60.0, 5.5),
                        3.5
                    )
                if stats_row.get("turnovers") is not None:
                    turnover_norm = max(min(1.0 - (float(stats_row.get("turnovers")) / 25.0), 1.0), 0.0)

        return {
            "win_pct": wins / total,
            "avg_points_for": avg_points_for,
            "avg_points_against": avg_points_against,
            "yards_per_play": yards_per_play,
            "turnover_diff_normalized": turnover_norm
        }

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
