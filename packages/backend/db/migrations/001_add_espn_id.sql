-- Add espn_game_id column to games table
ALTER TABLE games
ADD COLUMN IF NOT EXISTS espn_game_id VARCHAR(50) UNIQUE;

-- Add venue_name column if it doesn't exist
ALTER TABLE games
ADD COLUMN IF NOT EXISTS venue_name VARCHAR(200);

-- Add spread and over_under columns if they don't exist
ALTER TABLE games
ADD COLUMN IF NOT EXISTS spread DECIMAL(5,2);

ALTER TABLE games
ADD COLUMN IF NOT EXISTS over_under DECIMAL(5,2);

-- Create index on espn_game_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_games_espn_id ON games(espn_game_id);

-- Create index on season and week for faster queries
CREATE INDEX IF NOT EXISTS idx_games_season_week ON games(season, week);

COMMENT ON COLUMN games.espn_game_id IS 'ESPN API game identifier';
COMMENT ON COLUMN games.spread IS 'Point spread (negative = home team favored)';
COMMENT ON COLUMN games.over_under IS 'Over/under total points line';
