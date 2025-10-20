"""
Model Evaluation and Backtesting
Test trained models on historical seasons
"""

import numpy as np
import pandas as pd
import joblib
from pathlib import Path
import sys
sys.path.append(str(Path(__file__).parent.parent))

from utils.database import get_postgres_connection
from utils.logger import logger

class ModelEvaluator:
    """Evaluate models on specific seasons/weeks"""

    def __init__(self):
        self.models_dir = Path(__file__).parent.parent / 'models'
        self.models = self._load_models()

    def _load_models(self):
        """Load all trained models"""
        models = {}

        try:
            models['random_forest'] = joblib.load(self.models_dir / 'rf_model.joblib')
            models['xgboost'] = joblib.load(self.models_dir / 'xgb_model.joblib')
            models['neural_net'] = joblib.load(self.models_dir / 'nn_model.joblib')
            models['scaler'] = joblib.load(self.models_dir / 'scaler.joblib')
            logger.info("Loaded all models successfully")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            logger.error("Run train_models.py first")

        return models

    def backtest_season(self, season, week_start=1, week_end=18):
        """Test models on a specific season"""
        logger.info(f"Backtesting season {season}, weeks {week_start}-{week_end}")

        conn = get_postgres_connection()
        query = """
            SELECT
                g.*,
                CASE WHEN g.home_score > g.away_score THEN 1 ELSE 0 END as home_won,
                ht.conference as home_conf,
                ht.division as home_div,
                at.conference as away_conf,
                at.division as away_div
            FROM games g
            JOIN teams ht ON g.home_team_id = ht.id
            JOIN teams at ON g.away_team_id = at.id
            WHERE g.season = %s
              AND g.week >= %s
              AND g.week <= %s
              AND g.status = 'final'
              AND g.home_score IS NOT NULL
            ORDER BY g.week, g.id
        """

        df = pd.read_sql(query, conn, params=(season, week_start, week_end))
        conn.close()

        if len(df) == 0:
            logger.warning(f"No games found for season {season}")
            return None

        # Feature engineering (must match training)
        features = []
        for _, game in df.iterrows():
            feature_vector = [
                1,  # Home field
                1 if game['home_conf'] == game['away_conf'] else 0,
                1 if game['home_div'] == game['away_div'] else 0,
                game['season'] - 2015,
                game['week'] / 18.0,
                float(game['spread']) if pd.notna(game['spread']) else 0.0,
                float(game['over_under']) if pd.notna(game['over_under']) else 45.0,
            ]
            features.append(feature_vector)

        X = np.array(features)
        y_true = df['home_won'].values

        # Predictions
        results = {'actual': y_true}

        # Random Forest
        rf_pred = self.models['random_forest'].predict(X)
        rf_proba = self.models['random_forest'].predict_proba(X)[:, 1]
        results['rf_pred'] = rf_pred
        results['rf_confidence'] = rf_proba

        # XGBoost
        xgb_pred = self.models['xgboost'].predict(X)
        xgb_proba = self.models['xgboost'].predict_proba(X)[:, 1]
        results['xgb_pred'] = xgb_pred
        results['xgb_confidence'] = xgb_proba

        # Neural Network
        X_scaled = self.models['scaler'].transform(X)
        nn_pred = self.models['neural_net'].predict(X_scaled)
        nn_proba = self.models['neural_net'].predict_proba(X_scaled)[:, 1]
        results['nn_pred'] = nn_pred
        results['nn_confidence'] = nn_proba

        # Ensemble
        ensemble_proba = (
            rf_proba * 0.35 +
            xgb_proba * 0.40 +
            nn_proba * 0.25
        )
        ensemble_pred = (ensemble_proba >= 0.5).astype(int)
        results['ensemble_pred'] = ensemble_pred
        results['ensemble_confidence'] = ensemble_proba

        # Calculate accuracies
        accuracies = {
            'random_forest': (rf_pred == y_true).mean(),
            'xgboost': (xgb_pred == y_true).mean(),
            'neural_net': (nn_pred == y_true).mean(),
            'ensemble': (ensemble_pred == y_true).mean()
        }

        logger.info(f"\nSeason {season} Results:")
        logger.info(f"Games: {len(df)}")
        for model, acc in accuracies.items():
            logger.info(f"{model}: {acc:.2%}")

        # Against the spread
        if 'spread' in df.columns:
            df_copy = df.copy()
            df_copy['predicted_winner'] = ensemble_pred
            df_copy['actual_spread_cover'] = (
                (df_copy['home_score'] - df_copy['away_score']) > df_copy['spread']
            ).astype(int)

            # Simplified ATS calculation
            ats_correct = (ensemble_pred == df_copy['actual_spread_cover']).sum()
            ats_accuracy = ats_correct / len(df_copy)
            logger.info(f"Against the Spread: {ats_accuracy:.2%}")

        return accuracies

    def evaluate_by_confidence(self, season=2024):
        """Evaluate accuracy at different confidence levels"""
        logger.info(f"Analyzing confidence calibration for season {season}")

        conn = get_postgres_connection()
        query = """
            SELECT g.*,
                CASE WHEN g.home_score > g.away_score THEN 1 ELSE 0 END as home_won,
                ht.conference as home_conf,
                ht.division as home_div,
                at.conference as away_conf,
                at.division as away_div
            FROM games g
            JOIN teams ht ON g.home_team_id = ht.id
            JOIN teams at ON g.away_team_id = at.id
            WHERE g.season = %s AND g.status = 'final'
            AND g.home_score IS NOT NULL
        """

        df = pd.read_sql(query, conn, params=(season,))
        conn.close()

        if len(df) == 0:
            return

        # Get predictions with confidence
        features = []
        for _, game in df.iterrows():
            feature_vector = [
                1,
                1 if game['home_conf'] == game['away_conf'] else 0,
                1 if game['home_div'] == game['away_div'] else 0,
                game['season'] - 2015,
                game['week'] / 18.0,
                float(game['spread']) if pd.notna(game['spread']) else 0.0,
                float(game['over_under']) if pd.notna(game['over_under']) else 45.0,
            ]
            features.append(feature_vector)

        X = np.array(features)
        X_scaled = self.models['scaler'].transform(X)

        # Ensemble confidence
        rf_proba = self.models['random_forest'].predict_proba(X)[:, 1]
        xgb_proba = self.models['xgboost'].predict_proba(X)[:, 1]
        nn_proba = self.models['neural_net'].predict_proba(X_scaled)[:, 1]

        confidence = (rf_proba * 0.35 + xgb_proba * 0.40 + nn_proba * 0.25)
        predictions = (confidence >= 0.5).astype(int)
        actual = df['home_won'].values

        # Analyze by confidence buckets
        confidence_buckets = [(0.5, 0.6), (0.6, 0.7), (0.7, 0.8), (0.8, 0.9), (0.9, 1.0)]

        logger.info("\nAccuracy by Confidence Level:")
        for low, high in confidence_buckets:
            mask = (confidence >= low) & (confidence < high)
            if mask.sum() > 0:
                acc = (predictions[mask] == actual[mask]).mean()
                logger.info(f"{low:.0%}-{high:.0%}: {acc:.2%} ({mask.sum()} games)")

if __name__ == '__main__':
    evaluator = ModelEvaluator()

    # Backtest recent seasons
    for season in [2022, 2023, 2024]:
        evaluator.backtest_season(season)

    # Confidence analysis
    evaluator.evaluate_by_confidence(2024)
