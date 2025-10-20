-- Add email notification preferences to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_summary BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS game_alerts BOOLEAN DEFAULT false;

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_email_notif ON users(email_notifications);

-- Add comments
COMMENT ON COLUMN users.email_notifications IS 'Whether user wants to receive any emails';
COMMENT ON COLUMN users.weekly_summary IS 'Whether user wants weekly prediction summary emails';
COMMENT ON COLUMN users.game_alerts IS 'Whether user wants alerts before games start';
