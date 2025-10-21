-- Performance Optimization Migration
-- Adds composite indexes, partial indexes, and query optimizations

-- Composite index for common prediction queries (user + game)
CREATE INDEX IF NOT EXISTS idx_predictions_user_game ON predictions(user_id, game_id);

-- Index for prediction history queries (ordered by created_at)
CREATE INDEX IF NOT EXISTS idx_predictions_user_created ON predictions(user_id, created_at DESC);

-- Index for accuracy tracking queries
CREATE INDEX IF NOT EXISTS idx_predictions_correct ON predictions(prediction_correct) WHERE prediction_correct IS NOT NULL;

-- Composite index for games by status and date (for upcoming games queries)
CREATE INDEX IF NOT EXISTS idx_games_status_date ON games(status, game_date);

-- Index for current season games
CREATE INDEX IF NOT EXISTS idx_games_season_status ON games(season, status);

-- Composite index for team stats lookups
CREATE INDEX IF NOT EXISTS idx_team_stats_lookup ON team_stats(team_id, season, week);

-- Index for player stats queries by season/week
CREATE INDEX IF NOT EXISTS idx_player_stats_season_week ON player_stats(season, week);

-- Index for injury status queries (active injuries)
CREATE INDEX IF NOT EXISTS idx_injuries_status ON injuries(status, season, week) WHERE status IN ('Out', 'Doubtful', 'Questionable');

-- Index for betting lines timestamp (latest odds)
CREATE INDEX IF NOT EXISTS idx_betting_lines_timestamp ON betting_lines(game_id, timestamp DESC);

-- Index for user subscription queries
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier, subscription_status) WHERE is_active = true;

-- Index for user favorites lookups
CREATE INDEX IF NOT EXISTS idx_user_favorites_team ON user_favorites(team_id);

-- Index for model performance tracking
CREATE INDEX IF NOT EXISTS idx_model_performance_season ON model_performance(model_name, season, week);

-- Index for stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Add updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at on tables that don't have them
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_predictions_updated_at ON predictions;
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_stats_updated_at ON team_stats;
CREATE TRIGGER update_team_stats_updated_at BEFORE UPDATE ON team_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_injuries_updated_at ON injuries;
CREATE TRIGGER update_injuries_updated_at BEFORE UPDATE ON injuries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON INDEX idx_predictions_user_game IS 'Optimizes user-specific game prediction lookups';
COMMENT ON INDEX idx_games_status_date IS 'Optimizes queries for upcoming/scheduled games';
COMMENT ON INDEX idx_users_subscription IS 'Optimizes subscription tier filtering for active users';
