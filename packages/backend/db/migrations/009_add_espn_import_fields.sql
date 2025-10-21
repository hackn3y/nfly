-- Migration 009: Add ESPN Import Fields
-- Adds additional fields needed for full ESPN season import

-- Add ESPN ID to teams table if not exists
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS espn_id VARCHAR(50) UNIQUE;

-- Add additional team fields from ESPN
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS short_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS nickname VARCHAR(100),
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS color VARCHAR(10),
ADD COLUMN IF NOT EXISTS alternate_color VARCHAR(10),
ADD COLUMN IF NOT EXISTS logo VARCHAR(500);

-- Rename espn_game_id to espn_id for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'espn_game_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'espn_id'
  ) THEN
    ALTER TABLE games RENAME COLUMN espn_game_id TO espn_id;
  END IF;
END $$;

-- Add espn_id if it doesn't exist at all
ALTER TABLE games
ADD COLUMN IF NOT EXISTS espn_id VARCHAR(50) UNIQUE;

-- Add additional game fields from ESPN API
ALTER TABLE games
ADD COLUMN IF NOT EXISTS home_abbreviation VARCHAR(10),
ADD COLUMN IF NOT EXISTS away_abbreviation VARCHAR(10),
ADD COLUMN IF NOT EXISTS venue_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS venue_state VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_indoor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS weather_temperature INTEGER,
ADD COLUMN IF NOT EXISTS weather_conditions VARCHAR(200),
ADD COLUMN IF NOT EXISTS odds_provider VARCHAR(100),
ADD COLUMN IF NOT EXISTS broadcast_network VARCHAR(100);

-- Rename venue_name to venue for consistency (if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'venue_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'venue'
  ) THEN
    ALTER TABLE games RENAME COLUMN venue_name TO venue;
  END IF;
END $$;

-- Add venue if it doesn't exist
ALTER TABLE games
ADD COLUMN IF NOT EXISTS venue VARCHAR(200);

-- Add model_breakdown to predictions for storing model ensemble details
ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS model_breakdown JSONB;

-- Create indexes for ESPN imports
CREATE INDEX IF NOT EXISTS idx_teams_espn_id ON teams(espn_id);
CREATE INDEX IF NOT EXISTS idx_games_espn_id ON games(espn_id);
CREATE INDEX IF NOT EXISTS idx_games_abbreviations ON games(home_abbreviation, away_abbreviation);

-- Comments
COMMENT ON COLUMN teams.espn_id IS 'ESPN API team identifier';
COMMENT ON COLUMN teams.short_name IS 'Short display name from ESPN';
COMMENT ON COLUMN teams.nickname IS 'Team nickname from ESPN';
COMMENT ON COLUMN teams.location IS 'City/location from ESPN';

COMMENT ON COLUMN games.espn_id IS 'ESPN API game identifier';
COMMENT ON COLUMN games.home_abbreviation IS 'Home team abbreviation';
COMMENT ON COLUMN games.away_abbreviation IS 'Away team abbreviation';
COMMENT ON COLUMN games.is_indoor IS 'Whether game is played indoors';
COMMENT ON COLUMN games.weather_temperature IS 'Game time temperature in Fahrenheit';
COMMENT ON COLUMN games.broadcast_network IS 'TV network broadcasting the game';

COMMENT ON COLUMN predictions.model_breakdown IS 'JSON breakdown of individual model predictions';
