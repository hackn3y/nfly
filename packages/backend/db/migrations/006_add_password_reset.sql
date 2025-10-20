-- Add password reset fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Add comments
COMMENT ON COLUMN users.reset_token IS 'Hashed password reset token';
COMMENT ON COLUMN users.reset_token_expiry IS 'When the reset token expires';
