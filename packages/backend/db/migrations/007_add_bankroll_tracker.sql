-- Bankroll Tracker Migration
-- Creates tables for tracking bets and bankroll history

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  bet_type VARCHAR(50) NOT NULL, -- 'spread', 'moneyline', 'over_under', 'parlay', 'prop'
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  odds DECIMAL(10, 2) NOT NULL,
  potential_win DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'won', 'lost', 'push', 'cancelled'
  result DECIMAL(10, 2) DEFAULT 0, -- Actual win/loss amount (negative for loss)

  -- Bet details
  pick TEXT NOT NULL, -- e.g., "Chiefs -3.5", "Over 45.5", "Parlay: Chiefs ML + Bills ML"
  confidence_score DECIMAL(5, 2), -- ML confidence score if available
  notes TEXT,

  -- Timestamps
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bankroll history table
CREATE TABLE IF NOT EXISTS bankroll_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL,
  change_amount DECIMAL(10, 2) NOT NULL, -- Positive for wins/deposits, negative for losses/withdrawals
  change_type VARCHAR(20) NOT NULL, -- 'bet_won', 'bet_lost', 'deposit', 'withdrawal', 'adjustment'
  bet_id UUID REFERENCES bets(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add initial bankroll to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bankroll DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS initial_bankroll DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bankroll_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_game_id ON bets(game_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_placed_at ON bets(placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bankroll_history_user_id ON bankroll_history(user_id);
CREATE INDEX IF NOT EXISTS idx_bankroll_history_created_at ON bankroll_history(created_at DESC);

-- Create trigger to update bankroll on bet settlement
CREATE OR REPLACE FUNCTION update_bankroll_on_bet_settlement()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status changed to won, lost, or push
  IF NEW.status IN ('won', 'lost', 'push') AND OLD.status = 'pending' THEN
    -- Update user's bankroll
    UPDATE users
    SET bankroll = bankroll + NEW.result,
        bankroll_updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;

    -- Record in bankroll history
    INSERT INTO bankroll_history (user_id, balance, change_amount, change_type, bet_id)
    SELECT
      NEW.user_id,
      u.bankroll,
      NEW.result,
      CASE
        WHEN NEW.status = 'won' THEN 'bet_won'
        WHEN NEW.status = 'lost' THEN 'bet_lost'
        ELSE 'bet_push'
      END,
      NEW.id
    FROM users u WHERE u.id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bankroll_on_bet_settlement
  AFTER UPDATE ON bets
  FOR EACH ROW
  EXECUTE FUNCTION update_bankroll_on_bet_settlement();

-- Create function to get user bankroll stats
CREATE OR REPLACE FUNCTION get_user_bankroll_stats(p_user_id UUID)
RETURNS TABLE (
  current_balance DECIMAL(10, 2),
  total_bets BIGINT,
  total_wagered DECIMAL(10, 2),
  total_won BIGINT,
  total_lost BIGINT,
  total_pending BIGINT,
  win_rate DECIMAL(5, 2),
  profit_loss DECIMAL(10, 2),
  roi DECIMAL(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.bankroll,
    COUNT(b.id)::BIGINT,
    COALESCE(SUM(b.amount), 0),
    COUNT(CASE WHEN b.status = 'won' THEN 1 END)::BIGINT,
    COUNT(CASE WHEN b.status = 'lost' THEN 1 END)::BIGINT,
    COUNT(CASE WHEN b.status = 'pending' THEN 1 END)::BIGINT,
    CASE
      WHEN COUNT(CASE WHEN b.status IN ('won', 'lost') THEN 1 END) > 0
      THEN (COUNT(CASE WHEN b.status = 'won' THEN 1 END)::DECIMAL / COUNT(CASE WHEN b.status IN ('won', 'lost') THEN 1 END)::DECIMAL * 100)
      ELSE 0
    END,
    COALESCE(SUM(b.result), 0),
    CASE
      WHEN COALESCE(SUM(CASE WHEN b.status IN ('won', 'lost') THEN b.amount END), 0) > 0
      THEN (COALESCE(SUM(b.result), 0) / SUM(CASE WHEN b.status IN ('won', 'lost') THEN b.amount END) * 100)
      ELSE 0
    END
  FROM users u
  LEFT JOIN bets b ON u.id = b.user_id
  WHERE u.id = p_user_id
  GROUP BY u.id, u.bankroll;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE bets IS 'Stores user betting history and outcomes';
COMMENT ON TABLE bankroll_history IS 'Tracks all changes to user bankroll over time';
COMMENT ON FUNCTION get_user_bankroll_stats IS 'Returns comprehensive bankroll statistics for a user';
