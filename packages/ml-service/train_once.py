#!/usr/bin/env python3
"""
One-time script to train ML models on Railway.
Run this once to train the models, then the ML service will use them.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from training.train_models import NFLModelTrainer
from utils.logger import logger

def main():
    logger.info("=" * 60)
    logger.info("Starting one-time model training on Railway")
    logger.info("=" * 60)

    try:
        trainer = NFLModelTrainer()

        logger.info("Loading training data from database...")
        trainer.load_training_data(min_season=2020)

        logger.info("Training all models (this will take 5-10 minutes)...")
        results = trainer.train_all_models()

        logger.info("=" * 60)
        logger.info("Training Results:")
        for model_name, metrics in results.items():
            logger.info(f"  {model_name}: Accuracy = {metrics.get('accuracy', 'N/A')}")
        logger.info("=" * 60)

        logger.info("✅ Model training complete!")
        logger.info("Models saved to /app/models/")
        logger.info("You can now restart the ML service to use the trained models.")

        return 0

    except Exception as e:
        logger.error(f"❌ Training failed: {e}", exc_info=True)
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
