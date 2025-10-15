-- NFL Predictor Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'canceling', 'past_due', 'canceled')),
    stripe_customer_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(10) UNIQUE NOT NULL,
    city VARCHAR(100),
    conference VARCHAR(10) CHECK (conference IN ('AFC', 'NFC')),
    division VARCHAR(10) CHECK (division IN ('North', 'South', 'East', 'West')),
    stadium VARCHAR(100),
    head_coach VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    season INTEGER NOT NULL,
    week INTEGER NOT NULL,
    game_type VARCHAR(20) DEFAULT 'regular' CHECK (game_type IN ('preseason', 'regular', 'playoff', 'superbowl')),
    home_team_id INTEGER REFERENCES teams(id),
    away_team_id INTEGER REFERENCES teams(id),
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    game_date TIMESTAMP NOT NULL,
    venue VARCHAR(100),
    home_coach VARCHAR(100),
    away_coach VARCHAR(100),
    weather_conditions JSONB,
    attendance INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'final', 'postponed', 'canceled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(home_team_id, away_team_id, game_date)
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id INTEGER REFERENCES games(id),
    user_id UUID REFERENCES users(id),
    model_version VARCHAR(50),
    predicted_winner VARCHAR(100) NOT NULL,
    predicted_home_score DECIMAL(5,2),
    predicted_away_score DECIMAL(5,2),
    confidence DECIMAL(5,2),
    spread_prediction DECIMAL(5,2),
    over_under_prediction DECIMAL(5,2),
    ml_features JSONB,
    gematria_analysis JSONB,
    actual_winner VARCHAR(100),
    prediction_correct BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team statistics table
CREATE TABLE IF NOT EXISTS team_stats (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    season INTEGER NOT NULL,
    week INTEGER,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    points_for INTEGER DEFAULT 0,
    points_against INTEGER DEFAULT 0,
    total_yards DECIMAL(10,2),
    passing_yards DECIMAL(10,2),
    rushing_yards DECIMAL(10,2),
    turnovers INTEGER DEFAULT 0,
    sacks INTEGER DEFAULT 0,
    third_down_pct DECIMAL(5,2),
    red_zone_pct DECIMAL(5,2),
    time_of_possession INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, season, week)
);

-- Player stats table
CREATE TABLE IF NOT EXISTS player_stats (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(100) NOT NULL,
    team_id INTEGER REFERENCES teams(id),
    position VARCHAR(10),
    season INTEGER NOT NULL,
    week INTEGER,
    passing_yards INTEGER DEFAULT 0,
    passing_tds INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    rushing_yards INTEGER DEFAULT 0,
    rushing_tds INTEGER DEFAULT 0,
    receiving_yards INTEGER DEFAULT 0,
    receiving_tds INTEGER DEFAULT 0,
    receptions INTEGER DEFAULT 0,
    tackles INTEGER DEFAULT 0,
    sacks DECIMAL(5,1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Injuries table
CREATE TABLE IF NOT EXISTS injuries (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(100) NOT NULL,
    team_id INTEGER REFERENCES teams(id),
    position VARCHAR(10),
    injury_type VARCHAR(100),
    status VARCHAR(20) CHECK (status IN ('Out', 'Doubtful', 'Questionable', 'Probable', 'IR')),
    week INTEGER,
    season INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Betting lines table
CREATE TABLE IF NOT EXISTS betting_lines (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id),
    sportsbook VARCHAR(50),
    home_spread DECIMAL(5,2),
    away_spread DECIMAL(5,2),
    over_under DECIMAL(5,2),
    home_moneyline INTEGER,
    away_moneyline INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, team_id)
);

-- Model performance tracking
CREATE TABLE IF NOT EXISTS model_performance (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(50) NOT NULL,
    model_version VARCHAR(50),
    season INTEGER NOT NULL,
    week INTEGER,
    total_predictions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    accuracy DECIMAL(5,2),
    avg_confidence DECIMAL(5,2),
    metrics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gematria cache (for frequently accessed calculations)
CREATE TABLE IF NOT EXISTS gematria_cache (
    id SERIAL PRIMARY KEY,
    text VARCHAR(255) NOT NULL,
    method VARCHAR(20) NOT NULL,
    value INTEGER NOT NULL,
    reduced_value INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(text, method)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_season_week ON games(season, week);
CREATE INDEX idx_predictions_game ON predictions(game_id);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_team_stats_team_season ON team_stats(team_id, season);
CREATE INDEX idx_betting_lines_game ON betting_lines(game_id);
CREATE INDEX idx_gematria_text ON gematria_cache(text, method);

-- Insert sample NFL teams
INSERT INTO teams (name, abbreviation, city, conference, division, stadium) VALUES
('Arizona Cardinals', 'ARI', 'Arizona', 'NFC', 'West', 'State Farm Stadium'),
('Atlanta Falcons', 'ATL', 'Atlanta', 'NFC', 'South', 'Mercedes-Benz Stadium'),
('Baltimore Ravens', 'BAL', 'Baltimore', 'AFC', 'North', 'M&T Bank Stadium'),
('Buffalo Bills', 'BUF', 'Buffalo', 'AFC', 'East', 'Highmark Stadium'),
('Carolina Panthers', 'CAR', 'Carolina', 'NFC', 'South', 'Bank of America Stadium'),
('Chicago Bears', 'CHI', 'Chicago', 'NFC', 'North', 'Soldier Field'),
('Cincinnati Bengals', 'CIN', 'Cincinnati', 'AFC', 'North', 'Paycor Stadium'),
('Cleveland Browns', 'CLE', 'Cleveland', 'AFC', 'North', 'Cleveland Browns Stadium'),
('Dallas Cowboys', 'DAL', 'Dallas', 'NFC', 'East', 'AT&T Stadium'),
('Denver Broncos', 'DEN', 'Denver', 'AFC', 'West', 'Empower Field at Mile High'),
('Detroit Lions', 'DET', 'Detroit', 'NFC', 'North', 'Ford Field'),
('Green Bay Packers', 'GB', 'Green Bay', 'NFC', 'North', 'Lambeau Field'),
('Houston Texans', 'HOU', 'Houston', 'AFC', 'South', 'NRG Stadium'),
('Indianapolis Colts', 'IND', 'Indianapolis', 'AFC', 'South', 'Lucas Oil Stadium'),
('Jacksonville Jaguars', 'JAX', 'Jacksonville', 'AFC', 'South', 'TIAA Bank Field'),
('Kansas City Chiefs', 'KC', 'Kansas City', 'AFC', 'West', 'GEHA Field at Arrowhead Stadium'),
('Las Vegas Raiders', 'LV', 'Las Vegas', 'AFC', 'West', 'Allegiant Stadium'),
('Los Angeles Chargers', 'LAC', 'Los Angeles', 'AFC', 'West', 'SoFi Stadium'),
('Los Angeles Rams', 'LAR', 'Los Angeles', 'NFC', 'West', 'SoFi Stadium'),
('Miami Dolphins', 'MIA', 'Miami', 'AFC', 'East', 'Hard Rock Stadium'),
('Minnesota Vikings', 'MIN', 'Minnesota', 'NFC', 'North', 'U.S. Bank Stadium'),
('New England Patriots', 'NE', 'New England', 'AFC', 'East', 'Gillette Stadium'),
('New Orleans Saints', 'NO', 'New Orleans', 'NFC', 'South', 'Caesars Superdome'),
('New York Giants', 'NYG', 'New York', 'NFC', 'East', 'MetLife Stadium'),
('New York Jets', 'NYJ', 'New York', 'AFC', 'East', 'MetLife Stadium'),
('Philadelphia Eagles', 'PHI', 'Philadelphia', 'NFC', 'East', 'Lincoln Financial Field'),
('Pittsburgh Steelers', 'PIT', 'Pittsburgh', 'AFC', 'North', 'Acrisure Stadium'),
('San Francisco 49ers', 'SF', 'San Francisco', 'NFC', 'West', 'Levi''s Stadium'),
('Seattle Seahawks', 'SEA', 'Seattle', 'NFC', 'West', 'Lumen Field'),
('Tampa Bay Buccaneers', 'TB', 'Tampa Bay', 'NFC', 'South', 'Raymond James Stadium'),
('Tennessee Titans', 'TEN', 'Tennessee', 'AFC', 'South', 'Nissan Stadium'),
('Washington Commanders', 'WAS', 'Washington', 'NFC', 'East', 'FedExField')
ON CONFLICT (abbreviation) DO NOTHING;
