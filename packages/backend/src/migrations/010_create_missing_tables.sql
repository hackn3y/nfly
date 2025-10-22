-- Migration: Create missing tables for complete app functionality
-- Created: 2025-01-22

-- User devices table for push notifications
CREATE TABLE IF NOT EXISTS user_devices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  device_type VARCHAR(50) DEFAULT 'unknown',
  device_id VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(active);

-- User notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT false,
  prediction_alerts BOOLEAN DEFAULT true,
  game_start_alerts BOOLEAN DEFAULT false,
  high_confidence_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON user_notification_preferences(user_id);

-- Bankroll tracking history
CREATE TABLE IF NOT EXISTS bankroll_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_lost', 'adjustment')),
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  bet_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bankroll_user_id ON bankroll_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bankroll_created_at ON bankroll_transactions(created_at);

-- User bets tracking
CREATE TABLE IF NOT EXISTS user_bets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  bet_type VARCHAR(50) NOT NULL CHECK (bet_type IN ('moneyline', 'spread', 'total', 'prop', 'parlay')),
  pick VARCHAR(100) NOT NULL,
  odds INTEGER NOT NULL,
  stake DECIMAL(10, 2) NOT NULL,
  potential_return DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void', 'cashed_out')),
  settled_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_bets_user_id ON user_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_game_id ON user_bets(game_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_status ON user_bets(status);

-- Player props predictions
CREATE TABLE IF NOT EXISTS player_props (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_name VARCHAR(255) NOT NULL,
  player_team VARCHAR(10) NOT NULL,
  position VARCHAR(10),
  prop_type VARCHAR(50) NOT NULL CHECK (prop_type IN ('passing_yards', 'rushing_yards', 'receiving_yards', 'touchdowns', 'receptions', 'completions', 'interceptions', 'field_goals')),
  line DECIMAL(8, 2) NOT NULL,
  prediction VARCHAR(10) NOT NULL CHECK (prediction IN ('over', 'under')),
  confidence DECIMAL(5, 4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  projected_value DECIMAL(8, 2),
  actual_value DECIMAL(8, 2),
  result VARCHAR(20) CHECK (result IN ('over', 'under', 'push', 'pending')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_player_props_game_id ON player_props(game_id);
CREATE INDEX IF NOT EXISTS idx_player_props_player_name ON player_props(player_name);
CREATE INDEX IF NOT EXISTS idx_player_props_type ON player_props(prop_type);

-- Prediction history table (if not exists)
CREATE TABLE IF NOT EXISTS prediction_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  prediction VARCHAR(100) NOT NULL,
  confidence DECIMAL(5, 4),
  correct BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prediction_history_user_id ON prediction_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_history_game_id ON prediction_history(game_id);
CREATE INDEX IF NOT EXISTS idx_prediction_history_created_at ON prediction_history(created_at);

-- Injury reports table
CREATE TABLE IF NOT EXISTS injury_reports (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(255) NOT NULL,
  team VARCHAR(10) NOT NULL,
  position VARCHAR(10),
  injury_type VARCHAR(100),
  status VARCHAR(50) NOT NULL CHECK (status IN ('out', 'doubtful', 'questionable', 'probable', 'active')),
  description TEXT,
  week INTEGER NOT NULL,
  season INTEGER NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_injury_reports_team ON injury_reports(team);
CREATE INDEX IF NOT EXISTS idx_injury_reports_week_season ON injury_reports(week, season);
CREATE INDEX IF NOT EXISTS idx_injury_reports_status ON injury_reports(status);
CREATE INDEX IF NOT EXISTS idx_injury_reports_player ON injury_reports(player_name);

-- Weather conditions table
CREATE TABLE IF NOT EXISTS weather_conditions (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
  temperature INTEGER,
  conditions VARCHAR(100),
  wind_speed INTEGER,
  precipitation_chance INTEGER,
  humidity INTEGER,
  is_dome BOOLEAN DEFAULT false,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_weather_game_id ON weather_conditions(game_id);

-- Historical trends cache
CREATE TABLE IF NOT EXISTS historical_trends (
  id SERIAL PRIMARY KEY,
  home_team VARCHAR(10) NOT NULL,
  away_team VARCHAR(10) NOT NULL,
  trend_type VARCHAR(50) NOT NULL CHECK (trend_type IN ('head_to_head', 'home_away', 'recent_form', 'divisional', 'conference')),
  data JSONB NOT NULL,
  season INTEGER NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trends_teams ON historical_trends(home_team, away_team);
CREATE INDEX IF NOT EXISTS idx_trends_type ON historical_trends(trend_type);
CREATE INDEX IF NOT EXISTS idx_trends_season ON historical_trends(season);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verify_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verify_token ON email_verification_tokens(token);

-- Password reset tokens (if not exists)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);

-- Notification queue for scheduled notifications
CREATE TABLE IF NOT EXISTS notification_queue (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('email', 'push', 'both')),
  title VARCHAR(255),
  message TEXT NOT NULL,
  data JSONB,
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);

-- Add email_verified column to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='email_verified') THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add preferences column to users table if not exists (JSONB for flexible prefs)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='preferences') THEN
    ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add current_bankroll column to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='current_bankroll') THEN
    ALTER TABLE users ADD COLUMN current_bankroll DECIMAL(10, 2) DEFAULT 0.00;
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE user_devices IS 'Stores user device information for push notifications';
COMMENT ON TABLE user_notification_preferences IS 'User notification settings and preferences';
COMMENT ON TABLE bankroll_transactions IS 'Tracks all bankroll transactions and balance changes';
COMMENT ON TABLE user_bets IS 'Stores user betting history and outcomes';
COMMENT ON TABLE player_props IS 'Player prop predictions and results';
COMMENT ON TABLE injury_reports IS 'NFL injury reports and player status';
COMMENT ON TABLE weather_conditions IS 'Weather conditions for outdoor games';
COMMENT ON TABLE historical_trends IS 'Cached historical trend analysis';
COMMENT ON TABLE email_verification_tokens IS 'Email verification tokens for new signups';
COMMENT ON TABLE notification_queue IS 'Queue for scheduled push and email notifications';
