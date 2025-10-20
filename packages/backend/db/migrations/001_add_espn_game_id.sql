-- Add ESPN game ID column to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS espn_game_id VARCHAR(50) UNIQUE;

-- Add spread and over_under columns
ALTER TABLE games ADD COLUMN IF NOT EXISTS spread DECIMAL(5,2);
ALTER TABLE games ADD COLUMN IF NOT EXISTS over_under DECIMAL(5,2);

-- Add venue_name column (separate from venue)
ALTER TABLE games ADD COLUMN IF NOT EXISTS venue_name VARCHAR(200);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_games_espn_id ON games(espn_game_id);
