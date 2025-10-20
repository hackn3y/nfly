"""Utility script to run the ML data ingestion pipeline on demand."""
import argparse
import asyncio
import json
from pathlib import Path

from dotenv import load_dotenv

from services.data_service import DataService


def _load_environment() -> None:
    """Load environment variables from the local .env file if present."""
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if env_path.exists():
        load_dotenv(env_path)


async def _run_update(args: argparse.Namespace) -> dict:
    service = DataService()
    return await service.update_all(
        season=args.season,
        week=args.week,
        include_weather=not args.no_weather,
        include_odds=not args.no_odds,
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run NFL data ingestion via the ML service DataService"
    )
    parser.add_argument("--season", type=int, help="Season year to fetch")
    parser.add_argument("--week", type=int, help="Week number to fetch")
    parser.add_argument(
        "--no-weather",
        action="store_true",
        help="Skip weather enrichment even if WEATHER_API_KEY is configured",
    )
    parser.add_argument(
        "--no-odds",
        action="store_true",
        help="Skip odds ingestion even if ODDS_API_KEY is configured",
    )

    args = parser.parse_args()

    _load_environment()

    result = asyncio.run(_run_update(args))
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
