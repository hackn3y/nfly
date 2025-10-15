import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import xgboost as xgb
import joblib
from pathlib import Path
from typing import Dict, List

from utils.logger import logger

class ModelService:
    """Service for model training and evaluation"""

    def __init__(self):
        self.models_dir = Path(__file__).parent.parent / "models"
        self.models_dir.mkdir(exist_ok=True)

    async def get_model_stats(self) -> Dict:
        """Get performance statistics for all models"""
        # TODO: Query actual performance from database
        # Placeholder stats
        return {
            "current_season": {
                "random_forest": {
                    "accuracy": 0.67,
                    "precision": 0.68,
                    "recall": 0.66,
                    "f1_score": 0.67,
                    "total_predictions": 150,
                    "correct_predictions": 101
                },
                "xgboost": {
                    "accuracy": 0.69,
                    "precision": 0.70,
                    "recall": 0.68,
                    "f1_score": 0.69,
                    "total_predictions": 150,
                    "correct_predictions": 104
                },
                "neural_net": {
                    "accuracy": 0.64,
                    "precision": 0.65,
                    "recall": 0.63,
                    "f1_score": 0.64,
                    "total_predictions": 150,
                    "correct_predictions": 96
                },
                "ensemble": {
                    "accuracy": 0.71,
                    "precision": 0.72,
                    "recall": 0.70,
                    "f1_score": 0.71,
                    "total_predictions": 150,
                    "correct_predictions": 107
                }
            },
            "all_time": {
                "ensemble": {
                    "accuracy": 0.68,
                    "total_predictions": 2547,
                    "correct_predictions": 1732
                }
            }
        }

    async def train_models(self) -> Dict:
        """Train all ML models"""
        logger.info("Starting model training...")

        try:
            # Load training data
            X, y = await self._load_training_data()

            if X is None or len(X) == 0:
                logger.warning("No training data available")
                return {"status": "error", "message": "No training data"}

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

            results = {}

            # Train Random Forest
            logger.info("Training Random Forest...")
            rf_model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            rf_model.fit(X_train, y_train)
            rf_acc = accuracy_score(y_test, rf_model.predict(X_test))
            joblib.dump(rf_model, self.models_dir / "rf_model.joblib")
            results["random_forest"] = {"accuracy": float(rf_acc)}
            logger.info(f"Random Forest trained: {rf_acc:.3f} accuracy")

            # Train XGBoost
            logger.info("Training XGBoost...")
            xgb_model = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42
            )
            xgb_model.fit(X_train, y_train)
            xgb_acc = accuracy_score(y_test, xgb_model.predict(X_test))
            joblib.dump(xgb_model, self.models_dir / "xgb_model.joblib")
            results["xgboost"] = {"accuracy": float(xgb_acc)}
            logger.info(f"XGBoost trained: {xgb_acc:.3f} accuracy")

            # TODO: Train Neural Network with TensorFlow

            logger.info("Model training completed")
            return {
                "status": "success",
                "models_trained": list(results.keys()),
                "results": results
            }

        except Exception as e:
            logger.error(f"Error training models: {e}")
            return {"status": "error", "message": str(e)}

    async def get_feature_importance(self) -> Dict:
        """Get feature importance from models"""
        try:
            rf_path = self.models_dir / "rf_model.joblib"

            if not rf_path.exists():
                return {"error": "Model not trained yet"}

            rf_model = joblib.load(rf_path)

            # Get feature names
            from services.feature_engineering import FeatureEngineer
            fe = FeatureEngineer()
            feature_names = fe.get_feature_names()

            # Get importances
            importances = rf_model.feature_importances_
            feature_imp = [
                {"feature": name, "importance": float(imp)}
                for name, imp in zip(feature_names, importances)
            ]

            # Sort by importance
            feature_imp.sort(key=lambda x: x["importance"], reverse=True)

            return {
                "model": "random_forest",
                "features": feature_imp[:15]  # Top 15
            }

        except Exception as e:
            logger.error(f"Error getting feature importance: {e}")
            return {"error": str(e)}

    async def _load_training_data(self):
        """Load historical game data for training"""
        # TODO: Query database for historical games with outcomes
        # For now, generate synthetic data for testing

        logger.warning("Using synthetic training data - replace with real data")

        n_samples = 1000
        n_features = 25

        # Generate random features
        X = np.random.rand(n_samples, n_features)

        # Generate outcomes (home team wins)
        # Slightly bias towards home team
        y = (X[:, 0] + X[:, 4] + np.random.rand(n_samples) * 0.5 > 1.0).astype(int)

        return X, y
