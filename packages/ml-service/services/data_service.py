import json
import os
from datetime import datetime, timezone
from typing import Dict, Optional, Tuple

import aiohttp
from aiohttp import ClientResponseError, ClientTimeout
from sqlalchemy import text

from utils.database import SessionLocal
from utils.logger import logger


class DataService:
    """Service for fetching and persisting external NFL data"""

    def __init__(self):
        self.espn_base_url = "https://site.api.espn.com/apis/site/v2/sports/football/nfl"
        self.core_base_url = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl"
        self.odds_api_key = os.getenv("ODDS_API_KEY")
        self.weather_api_key = os.getenv("WEATHER_API_KEY")
        self.weather_cache: Dict[str, Dict] = {}
        self.http_timeout = ClientTimeout(total=25)

    async def fetch_games(
        self,
        season: Optional[int] = None,
        week: Optional[int] = None,
        *,
        include_weather: bool = True,
        session=None
    ) -> Dict:
        """Fetch and persist game schedule and odds from ESPN"""

        if session is None:
            async with SessionLocal() as db_session:
                return await self.fetch_games(
                    season,
                    week,
                    include_weather=include_weather,
                    session=db_session
                )

        season_val, week_val = season, week
        if season_val is None or week_val is None:
            season_val, week_val = await self._get_current_context()

        logger.info(f"Fetching games for season {season_val}, week {week_val}")

        scoreboard_url = (
            f"{self.espn_base_url}/scoreboard?seasontype=2&dates={season_val}&week={week_val}"
        )

        try:
            async with aiohttp.ClientSession(timeout=self.http_timeout) as http:
                scoreboard = await self._fetch_json(http, scoreboard_url)

                events = scoreboard.get("events", [])
                if not events:
                    logger.warning("No events returned from ESPN scoreboard")

                team_map = await self._load_team_map(session)
                inserted = 0
                updated = 0

                for event in events:
                    competition = (event.get("competitions") or [{}])[0]
                    home_team = self._get_competitor(competition, "home")
                    away_team = self._get_competitor(competition, "away")

                    if not home_team or not away_team:
                        logger.warning("Skipping event without home/away team: %s", event.get("id"))
                        continue

                    game_date = self._parse_game_date(event.get("date"))
                    venue = competition.get("venue", {}) or {}
                    venue_name = venue.get("fullName")
                    venue_city = (venue.get("address") or {}).get("city")
                    venue_state = (venue.get("address") or {}).get("state")

                    weather_data = None
                    if include_weather and self.weather_api_key and venue_city:
                        weather_data = await self._fetch_weather(venue_city, venue_state)

                    odds = (competition.get("odds") or [])
                    spread = None
                    over_under = None
                    if odds:
                        spread = odds[0].get("details")
                        over_under = odds[0].get("overUnder")

                    home_abbr = (home_team.get("team") or {}).get("abbreviation")
                    away_abbr = (away_team.get("team") or {}).get("abbreviation")
                    home_team_id = team_map.get(home_abbr.upper()) if home_abbr else None
                    away_team_id = team_map.get(away_abbr.upper()) if away_abbr else None

                    if not home_team_id or not away_team_id:
                        logger.warning(
                            "Team mapping missing for %s vs %s - ensure teams table is populated",
                            home_abbr,
                            away_abbr
                        )

                    params = {
                        "espn_game_id": event.get("id"),
                        "season": season_val,
                        "week": week_val,
                        "game_type": self._map_season_type(scoreboard.get("season", {}).get("type")),
                        "home_team_id": home_team_id,
                        "away_team_id": away_team_id,
                        "home_team": (home_team.get("team") or {}).get("displayName"),
                        "away_team": (away_team.get("team") or {}).get("displayName"),
                        "home_score": self._safe_int(home_team.get("score")),
                        "away_score": self._safe_int(away_team.get("score")),
                        "game_date": game_date,
                        "venue": venue_city,
                        "venue_name": venue_name,
                        "status": self._map_game_status((event.get("status") or {}).get("type", {}).get("name")),
                        "spread": self._parse_spread(spread),
                        "over_under": self._safe_float(over_under),
                        "weather_conditions": weather_data,
                        "attendance": competition.get("attendance"),
                    }

                    result = await session.execute(
                        text(
                            """
                            INSERT INTO games (
                                espn_game_id, season, week, game_type,
                                home_team_id, away_team_id,
                                home_team, away_team,
                                home_score, away_score,
                                game_date, venue, venue_name,
                                status, spread, over_under,
                                weather_conditions, attendance,
                                updated_at
                            ) VALUES (
                                :espn_game_id, :season, :week, :game_type,
                                :home_team_id, :away_team_id,
                                :home_team, :away_team,
                                :home_score, :away_score,
                                :game_date, :venue, :venue_name,
                                :status, :spread, :over_under,
                                CAST(:weather_conditions AS JSONB), :attendance,
                                NOW()
                            )
                            ON CONFLICT (espn_game_id)
                            DO UPDATE SET
                                season = EXCLUDED.season,
                                week = EXCLUDED.week,
                                game_type = EXCLUDED.game_type,
                                home_team_id = COALESCE(EXCLUDED.home_team_id, games.home_team_id),
                                away_team_id = COALESCE(EXCLUDED.away_team_id, games.away_team_id),
                                home_team = EXCLUDED.home_team,
                                away_team = EXCLUDED.away_team,
                                home_score = EXCLUDED.home_score,
                                away_score = EXCLUDED.away_score,
                                game_date = EXCLUDED.game_date,
                                venue = EXCLUDED.venue,
                                venue_name = EXCLUDED.venue_name,
                                status = EXCLUDED.status,
                                spread = EXCLUDED.spread,
                                over_under = EXCLUDED.over_under,
                                weather_conditions = EXCLUDED.weather_conditions,
                                attendance = EXCLUDED.attendance,
                                updated_at = NOW()
                            RETURNING (xmax = 0) AS inserted
                            """
                        ),
                        {
                            **params,
                            "weather_conditions": json.dumps(params["weather_conditions"]) if params["weather_conditions"] else None,
                        }
                    )

                    row = result.first()
                    if row and row.inserted:
                        inserted += 1
                    else:
                        updated += 1

                await session.commit()

                logger.info(
                    "Games persisted - fetched: %s, new: %s, updated: %s",
                    len(events),
                    inserted,
                    updated
                )

                return {
                    "season": season_val,
                    "week": week_val,
                    "fetched": len(events),
                    "inserted": inserted,
                    "updated": updated,
                }

        except Exception as exc:
            logger.error(f"Error fetching games: {exc}")
            raise

    async def fetch_team_stats(
        self,
        season: Optional[int] = None,
        week: Optional[int] = None,
        *,
        session=None
    ) -> Dict:
        """Fetch team statistics and upsert into database"""

        if session is None:
            async with SessionLocal() as db_session:
                return await self.fetch_team_stats(season, week, session=db_session)

        season_val = season or (await self._get_current_context())[0]
        logger.info(f"Fetching team stats for season {season_val}, week {week}")

        async with aiohttp.ClientSession(timeout=self.http_timeout) as http:
            teams_data = await self._fetch_json(http, f"{self.espn_base_url}/teams")
            teams = (((teams_data.get("sports") or []) or [{}])[0].get("leagues") or [])
            if teams:
                teams = (teams[0].get("teams") or [])
            else:
                teams = []

            team_map = await self._load_team_map(session)
            inserted = 0
            updated = 0

            for entry in teams:
                team_info = entry.get("team") or {}
                abbreviation = (team_info.get("abbreviation") or "").upper()
                db_team_id = team_map.get(abbreviation)

                if not db_team_id:
                    continue

                record_summary = self._parse_record(team_info.get("record"))
                stats_endpoint = None
                for link in team_info.get("links", []):
                    if link.get("rel") and "statistics" in link.get("rel"):
                        stats_endpoint = link.get("href")
                        break

                totals = {}
                if stats_endpoint:
                    query_delim = "&" if "?" in stats_endpoint else "?"
                    stats_url = f"{stats_endpoint}{query_delim}season={season_val}"
                    if week:
                        stats_url = f"{stats_url}&week={week}&type=2"

                    try:
                        stats_payload = await self._fetch_json(http, stats_url)
                        totals = self._extract_team_totals(stats_payload)
                    except Exception as stats_error:
                        logger.debug("Unable to fetch stats for %s: %s", abbreviation, stats_error)

                params = {
                    "team_id": db_team_id,
                    "season": season_val,
                    "week": week,
                    "wins": record_summary.get("wins"),
                    "losses": record_summary.get("losses"),
                    "ties": record_summary.get("ties"),
                    "points_for": totals.get("pointsFor"),
                    "points_against": totals.get("pointsAgainst"),
                    "total_yards": totals.get("yardsPerGame"),
                    "passing_yards": totals.get("passingYardsPerGame"),
                    "rushing_yards": totals.get("rushingYardsPerGame"),
                    "turnovers": totals.get("turnovers"),
                    "sacks": totals.get("sacks"),
                    "third_down_pct": totals.get("thirdDownPct"),
                    "red_zone_pct": totals.get("redZonePct"),
                    "time_of_possession": totals.get("timeOfPossession"),
                }

                result = await session.execute(
                    text(
                        """
                        INSERT INTO team_stats (
                            team_id, season, week, wins, losses, ties,
                            points_for, points_against,
                            total_yards, passing_yards, rushing_yards,
                            turnovers, sacks, third_down_pct, red_zone_pct,
                            time_of_possession, updated_at
                        ) VALUES (
                            :team_id, :season, :week, :wins, :losses, :ties,
                            :points_for, :points_against,
                            :total_yards, :passing_yards, :rushing_yards,
                            :turnovers, :sacks, :third_down_pct, :red_zone_pct,
                            :time_of_possession, NOW()
                        )
                        ON CONFLICT (team_id, season, week)
                        DO UPDATE SET
                            wins = EXCLUDED.wins,
                            losses = EXCLUDED.losses,
                            ties = EXCLUDED.ties,
                            points_for = EXCLUDED.points_for,
                            points_against = EXCLUDED.points_against,
                            total_yards = EXCLUDED.total_yards,
                            passing_yards = EXCLUDED.passing_yards,
                            rushing_yards = EXCLUDED.rushing_yards,
                            turnovers = EXCLUDED.turnovers,
                            sacks = EXCLUDED.sacks,
                            third_down_pct = EXCLUDED.third_down_pct,
                            red_zone_pct = EXCLUDED.red_zone_pct,
                            time_of_possession = EXCLUDED.time_of_possession,
                            updated_at = NOW()
                        RETURNING (xmax = 0) AS inserted
                        """
                    ),
                    params,
                )

                row = result.first()
                if row and row.inserted:
                    inserted += 1
                else:
                    updated += 1

            await session.commit()

            logger.info(
                "Team stats persisted - processed: %s, new: %s, updated: %s",
                inserted + updated,
                inserted,
                updated
            )

            return {
                "season": season_val,
                "week": week,
                "processed": inserted + updated,
                "inserted": inserted,
                "updated": updated,
            }

    async def fetch_injuries(self, season: Optional[int] = None, *, session=None) -> Dict:
        """Fetch injury reports and refresh injury table"""

        if session is None:
            async with SessionLocal() as db_session:
                return await self.fetch_injuries(season, session=db_session)

        season_val = season or (await self._get_current_context())[0]
        logger.info("Fetching NFL injury reports")

        async with aiohttp.ClientSession(timeout=self.http_timeout) as http:
            injuries_payload = await self._fetch_json(http, f"{self.espn_base_url}/injuries")
            teams = injuries_payload.get("injuries") or injuries_payload.get("teams") or []

            team_map = await self._load_team_map(session)
            processed = 0
            await session.execute(text("DELETE FROM injuries WHERE season = :season"), {"season": season_val})

            for team_entry in teams:
                team_info = team_entry.get("team") or {}
                abbreviation = (team_info.get("abbreviation") or "").upper()
                team_id = team_map.get(abbreviation)
                if not team_id:
                    continue

                for injury in team_entry.get("injuries", []):
                    athlete = injury.get("athlete") or {}
                    params = {
                        "player_name": athlete.get("displayName"),
                        "team_id": team_id,
                        "position": athlete.get("position", {}).get("abbreviation"),
                        "injury_type": (injury.get("details") or {}).get("detail") or injury.get("type"),
                        "status": (injury.get("status") or {}).get("type"),
                        "week": injury.get("week"),
                        "season": season_val,
                    }

                    await session.execute(
                        text(
                            """
                            INSERT INTO injuries (
                                player_name, team_id, position,
                                injury_type, status, week, season
                            ) VALUES (
                                :player_name, :team_id, :position,
                                :injury_type, :status, :week, :season
                            )
                            """
                        ),
                        params,
                    )
                    processed += 1

            await session.commit()

            logger.info("Injury reports refreshed: %s records", processed)

            return {
                "season": season_val,
                "processed": processed,
            }

    async def fetch_betting_odds(
        self,
        season: Optional[int] = None,
        week: Optional[int] = None,
        *,
        session=None
    ) -> Dict:
        """Fetch betting odds from The Odds API (if configured)"""

        if not self.odds_api_key:
            logger.info("Skipping odds fetch - ODDS_API_KEY not configured")
            return {"processed": 0, "message": "API key not configured"}

        if session is None:
            async with SessionLocal() as db_session:
                return await self.fetch_betting_odds(season, week, session=db_session)

        season_val, week_val = season, week
        if season_val is None or week_val is None:
            season_val, week_val = await self._get_current_context()

        odds_url = (
            "https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/"
            f"?regions=us&markets=spreads,totals,h2h&oddsFormat=american&dateFormat=iso&apiKey={self.odds_api_key}"
        )

        async with aiohttp.ClientSession(timeout=self.http_timeout) as http:
            odds_payload = await self._fetch_json(http, odds_url)
            if not isinstance(odds_payload, list):
                logger.warning("Unexpected odds payload received")
                return {"processed": 0, "message": "invalid_payload"}

            processed = 0

            for event in odds_payload:
                home_team_name = event.get("home_team")
                away_team_name = event.get("away_team")
                commence_time = self._parse_game_date(event.get("commence_time"))

                if not (home_team_name and away_team_name and commence_time):
                    continue

                game_row = await session.execute(
                    text(
                        """
                        SELECT id FROM games
                        WHERE LOWER(home_team) = LOWER(:home_team)
                          AND LOWER(away_team) = LOWER(:away_team)
                          AND ABS(EXTRACT(EPOCH FROM (game_date - :game_date))) < 86400
                        LIMIT 1
                        """
                    ),
                    {
                        "home_team": home_team_name,
                        "away_team": away_team_name,
                        "game_date": commence_time,
                    },
                )
                game = game_row.first()
                if not game:
                    continue

                spreads = self._extract_market(event, "spreads")
                totals = self._extract_market(event, "totals")
                moneyline = self._extract_market(event, "h2h")

                for book in event.get("bookmakers", []):
                    book_key = book.get("key")
                    lines = {
                        "spread": spreads.get(book_key) if spreads else None,
                        "total": totals.get(book_key) if totals else None,
                        "moneyline": moneyline.get(book_key) if moneyline else None,
                    }

                    await session.execute(
                        text(
                            """
                            INSERT INTO betting_lines (
                                game_id, sportsbook, home_spread, away_spread,
                                over_under, home_moneyline, away_moneyline, timestamp
                            ) VALUES (
                                :game_id, :sportsbook, :home_spread, :away_spread,
                                :over_under, :home_moneyline, :away_moneyline, NOW()
                            )
                            """
                        ),
                        {
                            "game_id": game.id,
                            "sportsbook": book_key,
                            "home_spread": self._safe_float((lines["spread"] or {}).get("home")),
                            "away_spread": self._safe_float((lines["spread"] or {}).get("away")),
                            "over_under": self._safe_float((lines["total"] or {}).get("line")),
                            "home_moneyline": self._safe_int((lines["moneyline"] or {}).get("home")),
                            "away_moneyline": self._safe_int((lines["moneyline"] or {}).get("away")),
                        },
                    )
                    processed += 1

            await session.commit()

            logger.info("Betting odds persisted: %s rows", processed)

            return {
                "season": season_val,
                "week": week_val,
                "processed": processed,
            }

    async def update_all(
        self,
        season: Optional[int] = None,
        week: Optional[int] = None,
        *,
        include_weather: bool = True,
        include_odds: bool = True
    ) -> Dict:
        """Update all configured data feeds"""

        async with SessionLocal() as session:
            season_val, week_val = season, week
            if season_val is None or week_val is None:
                season_val, week_val = await self._get_current_context()

            games_result = await self.fetch_games(
                season_val,
                week_val,
                include_weather=include_weather,
                session=session
            )

            stats_result = await self.fetch_team_stats(
                season_val,
                week_val,
                session=session
            )

            injuries_result = await self.fetch_injuries(
                season_val,
                session=session
            )

            odds_result = {"processed": 0}
            if include_odds:
                odds_result = await self.fetch_betting_odds(
                    season_val,
                    week_val,
                    session=session
                )

            logger.info(
                "Data update complete for season %s week %s",
                season_val,
                week_val
            )

            return {
                "season": season_val,
                "week": week_val,
                "games": games_result,
                "team_stats": stats_result,
                "injuries": injuries_result,
                "odds": odds_result,
            }

    async def _fetch_json(self, http: aiohttp.ClientSession, url: str) -> Dict:
        """Helper to fetch JSON with error handling"""

        try:
            async with http.get(url) as response:
                response.raise_for_status()
                return await response.json()
        except ClientResponseError as error:
            logger.error("HTTP %s when fetching %s", error.status, url)
            raise

    async def _get_current_context(self) -> Tuple[int, int]:
        """Lookup current season/week from ESPN scoreboard"""

        async with aiohttp.ClientSession(timeout=self.http_timeout) as http:
            payload = await self._fetch_json(http, f"{self.espn_base_url}/scoreboard")
            season = (payload.get("season") or {}).get("year")
            week = (payload.get("week") or {}).get("number")

            if not season or not week:
                now = datetime.now()
                return now.year, 1

            return season, week

    async def _load_team_map(self, session) -> Dict[str, int]:
        """Return mapping of team abbreviation to database ID"""

        result = await session.execute(text("SELECT id, abbreviation FROM teams"))
        return {row.abbreviation.upper(): row.id for row in result}

    def _get_competitor(self, competition: Dict, home_away: str) -> Optional[Dict]:
        for competitor in competition.get("competitors", []):
            if competitor.get("homeAway") == home_away:
                return competitor
        return None

    def _parse_game_date(self, iso_date: Optional[str]) -> Optional[datetime]:
        if not iso_date:
            return None
        try:
            # Parse and convert to naive datetime (no timezone) for PostgreSQL
            dt = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
            # Convert to UTC and remove timezone info
            return dt.astimezone(timezone.utc).replace(tzinfo=None)
        except ValueError:
            return None

    def _map_season_type(self, season_type: Optional[int]) -> str:
        mapping = {
            1: "preseason",
            2: "regular",
            3: "playoff",
            4: "superbowl",
        }
        return mapping.get(season_type, "regular")

    def _map_game_status(self, espn_status: Optional[str]) -> str:
        """Map ESPN status codes to database status values"""
        if not espn_status:
            return "scheduled"

        # ESPN uses uppercase status names like STATUS_FINAL, STATUS_IN_PROGRESS, etc.
        status_lower = espn_status.lower()

        # Map ESPN statuses to our database values
        status_mapping = {
            "status_final": "final",
            "status_in_progress": "in_progress",
            "status_scheduled": "scheduled",
            "status_postponed": "postponed",
            "status_canceled": "canceled",
            "status_cancelled": "canceled",  # British spelling
            "final": "final",
            "in_progress": "in_progress",
            "scheduled": "scheduled",
            "postponed": "postponed",
            "canceled": "canceled",
        }

        return status_mapping.get(status_lower, "scheduled")

    def _parse_record(self, record_payload: Optional[Dict]) -> Dict[str, Optional[int]]:
        summary = {
            "wins": None,
            "losses": None,
            "ties": None,
        }
        if not record_payload:
            return summary

        items = record_payload.get("items", [])
        overall = None
        for item in items:
            if item.get("type") in ("total", "overall"):
                overall = item
                break
        if not overall and items:
            overall = items[0]

        if overall:
            stats = overall.get("stats", [])
            for stat in stats:
                name = stat.get("name")
                if name == "wins":
                    summary["wins"] = self._safe_int(stat.get("value"))
                elif name == "losses":
                    summary["losses"] = self._safe_int(stat.get("value"))
                elif name == "ties":
                    summary["ties"] = self._safe_int(stat.get("value"))

            if summary["wins"] is None and overall.get("summary"):
                parts = overall["summary"].split("-")
                if len(parts) >= 2:
                    summary["wins"] = self._safe_int(parts[0])
                    summary["losses"] = self._safe_int(parts[1])
                if len(parts) == 3:
                    summary["ties"] = self._safe_int(parts[2])

        return summary

    def _extract_team_totals(self, payload: Dict) -> Dict[str, Optional[float]]:
        totals = {}
        if not payload:
            return totals

        splits = payload.get("splits", {})
        categories = splits.get("categories", [])
        for category in categories:
            for stat in category.get("stats", []):
                name = stat.get("name")
                totals[name] = self._safe_float(stat.get("value"))
        return totals

    async def _fetch_weather(self, city: str, state: Optional[str]) -> Optional[Dict]:
        if not self.weather_api_key:
            return None

        key = f"{city},{state}".lower()
        cached = self.weather_cache.get(key)
        if cached and (datetime.utcnow() - cached["timestamp"]).seconds < 3600:
            return cached["data"]

        query = city
        if state:
            query = f"{city},{state},US"

        url = (
            "https://api.openweathermap.org/data/2.5/weather"
            f"?q={query}&appid={self.weather_api_key}&units=imperial"
        )

        async with aiohttp.ClientSession(timeout=self.http_timeout) as http:
            try:
                payload = await self._fetch_json(http, url)
            except Exception as weather_error:
                logger.debug("Weather fetch failed for %s: %s", query, weather_error)
                return None

        weather = {
            "temperature": payload.get("main", {}).get("temp"),
            "humidity": payload.get("main", {}).get("humidity"),
            "conditions": (payload.get("weather") or [{}])[0].get("description"),
            "windSpeed": payload.get("wind", {}).get("speed"),
        }

        self.weather_cache[key] = {
            "timestamp": datetime.utcnow(),
            "data": weather,
        }

        return weather

    def _extract_market(self, event: Dict, market_key: str) -> Dict[str, Dict]:
        markets = {}
        for bookmaker in event.get("bookmakers", []):
            for market in bookmaker.get("markets", []):
                if market.get("key") == market_key:
                    markets[bookmaker.get("key")] = self._parse_market_lines(market_key, market)
        return markets

    def _parse_market_lines(self, market_key: str, market: Dict) -> Dict:
        if market_key == "spreads":
                    outcomes = market.get("outcomes") or []
                    home = next((o for o in outcomes if o.get("type") == "home"), None)
                    away = next((o for o in outcomes if o.get("type") == "away"), None)
                    return {
                        "home": self._safe_float(home.get("point")) if home else None,
                        "away": self._safe_float(away.get("point")) if away else None,
                    }
        if market_key == "totals":
            outcomes = market.get("outcomes") or []
            if len(outcomes) >= 1:
                return {"line": self._safe_float(outcomes[0].get("point"))}
        if market_key == "h2h":
            outcomes = market.get("outcomes") or []
            home = next((o for o in outcomes if o.get("type") == "home"), None)
            away = next((o for o in outcomes if o.get("type") == "away"), None)
            return {
                "home": self._safe_int(home.get("price")) if home else None,
                "away": self._safe_int(away.get("price")) if away else None,
            }
        return {}

    def _parse_spread(self, spread_text: Optional[str]) -> Optional[float]:
        if spread_text is None:
            return None
        try:
            parts = spread_text.split()
            numeric = next((p for p in parts if self._is_number(p)), None)
            return float(numeric) if numeric else None
        except Exception:
            return None

    def _is_number(self, value: str) -> bool:
        try:
            float(value)
            return True
        except Exception:
            return False

    def _safe_int(self, value) -> Optional[int]:
        try:
            return int(value) if value is not None else None
        except (TypeError, ValueError):
            return None

    def _safe_float(self, value) -> Optional[float]:
        try:
            return float(value) if value is not None else None
        except (TypeError, ValueError):
            return None

