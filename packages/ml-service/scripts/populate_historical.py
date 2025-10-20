"""
Populate database with historical NFL data for ML training.
This script fetches data from ESPN for multiple seasons and weeks.
"""
import asyncio
import sys
import logging
from pathlib import Path

from dotenv import load_dotenv
from services.data_service import DataService

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment
env_path = Path(__file__).resolve().parents[1] / ".env"
if env_path.exists():
    load_dotenv(env_path)

async def populate_season(service: DataService, season: int, start_week: int = 1, end_week: int = 18):
    """Populate data for a single season."""
    logger.info(f"Starting season {season} (weeks {start_week}-{end_week})")

    total_games = 0
    for week in range(start_week, end_week + 1):
        try:
            logger.info(f"Fetching {season} Week {week}...")
            result = await service.update_all(
                season=season,
                week=week,
                include_weather=False,  # Skip weather for historical data
                include_odds=False  # Skip odds for historical data
            )

            games_count = result.get('games', {}).get('inserted', 0) + result.get('games', {}).get('updated', 0)
            total_games += games_count
            logger.info(f"  ✓ Week {week}: {games_count} games")

            # Small delay to avoid overwhelming the API
            await asyncio.sleep(2)

        except Exception as e:
            logger.error(f"  ✗ Week {week} failed: {e}")
            continue

    logger.info(f"Season {season} complete: {total_games} total games\n")
    return total_games

async def main():
    """Main function to populate historical data."""
    logger.info("=" * 60)
    logger.info("NFL Historical Data Population")
    logger.info("=" * 60)

    # Define seasons to fetch (2015-2024)
    seasons = list(range(2015, 2025))

    logger.info(f"Will fetch {len(seasons)} seasons: {seasons[0]}-{seasons[-1]}")
    logger.info(f"Estimated time: {len(seasons) * 18 * 2 / 60:.1f} minutes")
    logger.info("=" * 60)

    proceed = input("\nProceed with data population? (y/n): ")
    if proceed.lower() != 'y':
        logger.info("Aborted by user")
        return

    service = DataService()
    grand_total = 0

    for season in seasons:
        try:
            total = await populate_season(service, season)
            grand_total += total
        except Exception as e:
            logger.error(f"Season {season} failed completely: {e}")
            continue

    logger.info("=" * 60)
    logger.info(f"COMPLETE! Total games populated: {grand_total}")
    logger.info("=" * 60)
    logger.info("\nNext steps:")
    logger.info("1. Verify data: curl http://localhost:4100/api/nfl-data/games/2024/8")
    logger.info("2. Train models: python training/train_models.py")
    logger.info("=" * 60)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\nInterrupted by user")
        sys.exit(0)
