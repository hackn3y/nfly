"""
Pytest configuration and fixtures for ML Service tests
"""

import pytest
import os
from unittest.mock import Mock, AsyncMock
from fastapi.testclient import TestClient

# Set test environment variables
os.environ['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test_db'
os.environ['REDIS_URL'] = 'redis://localhost:6379/1'
os.environ['DEBUG'] = 'false'

@pytest.fixture
def mock_db_connection():
    """Mock database connection"""
    mock_conn = AsyncMock()
    mock_conn.fetchone = AsyncMock(return_value=None)
    mock_conn.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock()
    return mock_conn

@pytest.fixture
def mock_redis():
    """Mock Redis client"""
    mock_redis = Mock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.set = AsyncMock()
    mock_redis.delete = AsyncMock()
    return mock_redis

@pytest.fixture
def test_game_data():
    """Sample game data for testing"""
    return {
        'id': 1,
        'home_team': 'Kansas City Chiefs',
        'away_team': 'Buffalo Bills',
        'season': 2025,
        'week': 10,
        'game_date': '2025-01-20T18:00:00Z',
        'home_team_id': 12,
        'away_team_id': 2
    }

@pytest.fixture
def test_team_stats():
    """Sample team statistics for testing"""
    return {
        'team_id': 12,
        'wins': 10,
        'losses': 3,
        'points_for': 350,
        'points_against': 280,
        'passing_yards': 4500,
        'rushing_yards': 1800,
        'turnovers': 12
    }

@pytest.fixture
def test_prediction_response():
    """Sample prediction response"""
    return {
        'game_id': 1,
        'predicted_winner': 'Kansas City Chiefs',
        'predicted_home_score': 28.5,
        'predicted_away_score': 24.2,
        'confidence': 0.72,
        'spread_prediction': -4.3,
        'over_under_prediction': 52.7,
        'model_version': 'v1.0'
    }

@pytest.fixture
def client():
    """FastAPI test client"""
    from app import app
    return TestClient(app)
