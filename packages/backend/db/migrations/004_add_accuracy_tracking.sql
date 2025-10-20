-- Add accuracy tracking fields to predictions table
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS result VARCHAR(20);
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS actual_winner INTEGER REFERENCES teams(id);
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS actual_margin INTEGER;

-- Add accuracy stats to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_predictions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS correct_predictions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accuracy_rate DECIMAL(5,2) DEFAULT 0;

-- Create model_stats table for tracking model performance
CREATE TABLE IF NOT EXISTS model_stats (
  id SERIAL PRIMARY KEY,
  model_type VARCHAR(50) UNIQUE NOT NULL,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 0,
  avg_confidence DECIMAL(5,4) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transparency dashboard view
CREATE OR REPLACE VIEW v_transparency_stats AS
SELECT
  prediction_type,
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE is_correct = true) as correct_predictions,
  ROUND(
    CAST(COUNT(*) FILTER (WHERE is_correct = true) AS DECIMAL) /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as accuracy_rate,
  AVG(confidence_score) as avg_confidence,
  CASE
    WHEN AVG(confidence_score) >= 0.75 THEN 'High Trust'
    WHEN AVG(confidence_score) >= 0.65 THEN 'Medium Trust'
    ELSE 'Low Trust'
  END as trust_level
FROM predictions
WHERE result IS NOT NULL
GROUP BY prediction_type;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_result ON predictions(result);
CREATE INDEX IF NOT EXISTS idx_predictions_is_correct ON predictions(is_correct);
CREATE INDEX IF NOT EXISTS idx_predictions_created_date ON predictions(DATE(created_at));

-- Add comments
COMMENT ON COLUMN predictions.result IS 'Prediction result: correct, incorrect, or NULL if game not finished';
COMMENT ON COLUMN predictions.is_correct IS 'Whether prediction was correct';
COMMENT ON COLUMN predictions.actual_winner IS 'The actual winning team';
COMMENT ON COLUMN predictions.actual_margin IS 'Actual point margin';
COMMENT ON TABLE model_stats IS 'Tracks overall performance of each prediction model';
COMMENT ON VIEW v_transparency_stats IS 'Public transparency dashboard statistics';
