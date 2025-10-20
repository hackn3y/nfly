"""
ML Model Training Pipeline
Trains Random Forest, XGBoost, and Neural Network models on NFL game data
"""

import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import xgboost as xgb
from sklearn.neural_network import MLPClassifier
import sys
sys.path.append(str(Path(__file__).parent.parent))

from utils.database import get_postgres_connection
from utils.logger import logger

class NFLModelTrainer:
    """Train and evaluate NFL prediction models"""

    def __init__(self, models_dir='../models'):
        self.models_dir = Path(__file__).parent.parent / 'models'
        self.models_dir.mkdir(exist_ok=True)
        self.scaler = StandardScaler()

    def load_historical_data(self, min_season=2015):
        """Load historical game data from database"""
        logger.info(f"Loading historical data from season {min_season}...")

        conn = get_postgres_connection()
        query = """
            SELECT
                g.id,
                g.season,
                g.week,
                g.home_team_id,
                g.away_team_id,
                g.home_score,
                g.away_score,
                g.spread,
                g.over_under,
                ht.abbreviation as home_abbr,
                ht.conference as home_conf,
                ht.division as home_div,
                at.abbreviation as away_abbr,
                at.conference as away_conf,
                at.division as away_div,
                CASE WHEN g.home_score > g.away_score THEN 1 ELSE 0 END as home_won
            FROM games g
            JOIN teams ht ON g.home_team_id = ht.id
            JOIN teams at ON g.away_team_id = at.id
            WHERE g.season >= %s
              AND g.status = 'final'
              AND g.home_score IS NOT NULL
              AND g.away_score IS NOT NULL
            ORDER BY g.season, g.week, g.id
        """

        df = pd.read_sql(query, conn, params=(min_season,))
        conn.close()

        logger.info(f"Loaded {len(df)} games")
        return df

    def engineer_features(self, df):
        """Create features for ML models"""
        logger.info("Engineering features...")

        features = []
        labels = []

        for idx, game in df.iterrows():
            # Basic features
            feature_vector = [
                1,  # Home field advantage (binary)
                1 if game['home_conf'] == game['away_conf'] else 0,  # Same conference
                1 if game['home_div'] == game['away_div'] else 0,    # Division game
            ]

            # Historical performance (simplified - would use actual team stats)
            # For now, using season and week as proxy
            feature_vector.extend([
                game['season'] - 2015,  # Normalize season
                game['week'] / 18.0,    # Normalize week
            ])

            # Spread if available
            if pd.notna(game['spread']):
                feature_vector.append(float(game['spread']))
            else:
                feature_vector.append(0.0)

            # Over/under if available
            if pd.notna(game['over_under']):
                feature_vector.append(float(game['over_under']))
            else:
                feature_vector.append(45.0)  # NFL average

            features.append(feature_vector)
            labels.append(int(game['home_won']))

        X = np.array(features)
        y = np.array(labels)

        logger.info(f"Created {X.shape[1]} features for {len(X)} games")
        return X, y

    def train_random_forest(self, X_train, y_train, X_test, y_test):
        """Train Random Forest model"""
        logger.info("Training Random Forest...")

        rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1
        )

        rf_model.fit(X_train, y_train)

        # Evaluate
        train_score = rf_model.score(X_train, y_train)
        test_score = rf_model.score(X_test, y_test)

        y_pred = rf_model.predict(X_test)

        logger.info(f"Random Forest - Train: {train_score:.4f}, Test: {test_score:.4f}")
        logger.info(f"\n{classification_report(y_test, y_pred)}")

        # Save model
        model_path = self.models_dir / 'rf_model.joblib'
        joblib.dump(rf_model, model_path)
        logger.info(f"Saved Random Forest to {model_path}")

        return rf_model, test_score

    def train_xgboost(self, X_train, y_train, X_test, y_test):
        """Train XGBoost model"""
        logger.info("Training XGBoost...")

        xgb_model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1
        )

        xgb_model.fit(X_train, y_train)

        # Evaluate
        train_score = xgb_model.score(X_train, y_train)
        test_score = xgb_model.score(X_test, y_test)

        y_pred = xgb_model.predict(X_test)

        logger.info(f"XGBoost - Train: {train_score:.4f}, Test: {test_score:.4f}")
        logger.info(f"\n{classification_report(y_test, y_pred)}")

        # Save model
        model_path = self.models_dir / 'xgb_model.joblib'
        joblib.dump(xgb_model, model_path)
        logger.info(f"Saved XGBoost to {model_path}")

        return xgb_model, test_score

    def train_neural_network(self, X_train, y_train, X_test, y_test):
        """Train Neural Network model"""
        logger.info("Training Neural Network...")

        # Scale features for neural network
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        nn_model = MLPClassifier(
            hidden_layer_sizes=(64, 32, 16),
            activation='relu',
            solver='adam',
            max_iter=500,
            random_state=42,
            early_stopping=True,
            validation_fraction=0.1
        )

        nn_model.fit(X_train_scaled, y_train)

        # Evaluate
        train_score = nn_model.score(X_train_scaled, y_train)
        test_score = nn_model.score(X_test_scaled, y_test)

        y_pred = nn_model.predict(X_test_scaled)

        logger.info(f"Neural Network - Train: {train_score:.4f}, Test: {test_score:.4f}")
        logger.info(f"\n{classification_report(y_test, y_pred)}")

        # Save model and scaler
        model_path = self.models_dir / 'nn_model.joblib'
        scaler_path = self.models_dir / 'scaler.joblib'
        joblib.dump(nn_model, model_path)
        joblib.dump(self.scaler, scaler_path)
        logger.info(f"Saved Neural Network to {model_path}")
        logger.info(f"Saved Scaler to {scaler_path}")

        return nn_model, test_score

    def evaluate_ensemble(self, models, X_test, y_test):
        """Evaluate ensemble prediction"""
        logger.info("Evaluating ensemble model...")

        predictions = []

        for name, model in models.items():
            if name == 'neural_net':
                X_input = self.scaler.transform(X_test)
            else:
                X_input = X_test

            pred = model.predict(X_input)
            predictions.append(pred)

        # Weighted voting (weights from historical performance)
        weights = [0.35, 0.40, 0.25]  # RF, XGBoost, NN
        ensemble_pred = np.zeros(len(X_test))

        for pred, weight in zip(predictions, weights):
            ensemble_pred += pred * weight

        ensemble_pred = (ensemble_pred >= 0.5).astype(int)

        ensemble_score = accuracy_score(y_test, ensemble_pred)
        logger.info(f"Ensemble Accuracy: {ensemble_score:.4f}")
        logger.info(f"\n{classification_report(y_test, ensemble_pred)}")

        return ensemble_score

    def train_all_models(self):
        """Complete training pipeline"""
        logger.info("="*50)
        logger.info("Starting ML Model Training Pipeline")
        logger.info("="*50)

        # Load data
        df = self.load_historical_data(min_season=2015)

        if len(df) < 100:
            logger.error("Not enough data for training. Need at least 100 games.")
            logger.error("Run: curl -X POST http://localhost:4100/api/nfl-data/historical")
            return False

        # Engineer features
        X, y = self.engineer_features(df)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        logger.info(f"Train set: {len(X_train)}, Test set: {len(X_test)}")
        logger.info(f"Home win rate: {y.mean():.2%}")

        # Train models
        rf_model, rf_score = self.train_random_forest(X_train, y_train, X_test, y_test)
        xgb_model, xgb_score = self.train_xgboost(X_train, y_train, X_test, y_test)
        nn_model, nn_score = self.train_neural_network(X_train, y_train, X_test, y_test)

        # Evaluate ensemble
        models = {
            'random_forest': rf_model,
            'xgboost': xgb_model,
            'neural_net': nn_model
        }

        ensemble_score = self.evaluate_ensemble(models, X_test, y_test)

        # Save training metadata
        metadata = {
            'trained_at': datetime.now().isoformat(),
            'num_games': len(df),
            'num_features': X.shape[1],
            'train_size': len(X_train),
            'test_size': len(X_test),
            'scores': {
                'random_forest': float(rf_score),
                'xgboost': float(xgb_score),
                'neural_network': float(nn_score),
                'ensemble': float(ensemble_score)
            }
        }

        import json
        with open(self.models_dir / 'training_metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)

        logger.info("="*50)
        logger.info("Training Complete!")
        logger.info(f"Models saved to: {self.models_dir}")
        logger.info("="*50)

        return True

if __name__ == '__main__':
    trainer = NFLModelTrainer()
    success = trainer.train_all_models()
    sys.exit(0 if success else 1)
