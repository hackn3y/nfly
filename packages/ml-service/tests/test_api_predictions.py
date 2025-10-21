"""
Tests for prediction API endpoints
"""

import pytest
from unittest.mock import patch, AsyncMock
from fastapi import status


@pytest.mark.unit
class TestPredictionsAPI:
    """Test prediction API endpoints"""

    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "healthy"
        assert response.json()["service"] == "ml-service"

    def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "endpoints" in data
        assert "/api/predictions" in data["endpoints"]["predictions"]

    @patch('services.prediction_service.PredictionService.get_upcoming_predictions')
    async def test_get_upcoming_predictions_success(self, mock_service, client, test_prediction_response):
        """Test getting upcoming game predictions"""
        mock_service.return_value = [test_prediction_response]

        response = client.get("/api/predictions/upcoming")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    @patch('services.prediction_service.PredictionService.get_upcoming_predictions')
    async def test_get_upcoming_predictions_empty(self, mock_service, client):
        """Test getting upcoming predictions when none exist"""
        mock_service.return_value = []

        response = client.get("/api/predictions/upcoming")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    @patch('services.prediction_service.PredictionService.get_game_prediction')
    async def test_get_game_prediction_success(self, mock_service, client, test_prediction_response):
        """Test getting prediction for specific game"""
        mock_service.return_value = test_prediction_response

        response = client.get("/api/predictions/game/1")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["game_id"] == 1
        assert "predicted_winner" in data
        assert "confidence" in data

    @patch('services.prediction_service.PredictionService.get_game_prediction')
    async def test_get_game_prediction_not_found(self, mock_service, client):
        """Test getting prediction for non-existent game"""
        mock_service.return_value = None

        response = client.get("/api/predictions/game/999")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch('services.prediction_service.PredictionService.get_weekly_predictions')
    async def test_get_weekly_predictions(self, mock_service, client, test_prediction_response):
        """Test getting weekly predictions"""
        mock_service.return_value = [test_prediction_response]

        response = client.get("/api/predictions/weekly?season=2025&week=10")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

    @patch('services.prediction_service.PredictionService.optimize_parlay')
    async def test_optimize_parlay(self, mock_service, client):
        """Test parlay optimization"""
        mock_parlay = {
            'games': [1, 2, 3],
            'total_confidence': 0.85,
            'expected_payout': 5.2,
            'picks': [
                {'game_id': 1, 'pick': 'Chiefs -3.5', 'confidence': 0.72},
                {'game_id': 2, 'pick': 'Bills ML', 'confidence': 0.68},
                {'game_id': 3, 'pick': 'Over 48.5', 'confidence': 0.75}
            ]
        }
        mock_service.return_value = mock_parlay

        response = client.post("/api/predictions/parlay", json={
            'game_ids': [1, 2, 3],
            'min_confidence': 0.65
        })

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'picks' in data
        assert len(data['picks']) == 3

    def test_optimize_parlay_invalid_input(self, client):
        """Test parlay optimization with invalid input"""
        response = client.post("/api/predictions/parlay", json={
            'game_ids': []  # Empty list
        })

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.integration
class TestPredictionServiceIntegration:
    """Integration tests for prediction service"""

    @patch('utils.database.get_db_connection')
    @patch('services.model_service.ModelService.predict')
    async def test_full_prediction_pipeline(self, mock_predict, mock_db, test_game_data, test_team_stats):
        """Test complete prediction pipeline"""
        from services.prediction_service import PredictionService

        # Mock database
        mock_conn = AsyncMock()
        mock_conn.fetchone.return_value = test_game_data
        mock_conn.fetchall.return_value = [test_team_stats]
        mock_db.return_value.__aenter__.return_value = mock_conn

        # Mock model prediction
        mock_predict.return_value = {
            'home_score': 28.5,
            'away_score': 24.2,
            'confidence': 0.72
        }

        service = PredictionService()
        result = await service.get_game_prediction(1)

        assert result is not None
        assert 'predicted_winner' in result
        assert 'confidence' in result
        assert result['confidence'] > 0.5

    @patch('utils.database.get_redis_client')
    async def test_prediction_caching(self, mock_redis):
        """Test that predictions are cached"""
        from services.prediction_service import PredictionService
        import json

        cached_prediction = {
            'game_id': 1,
            'predicted_winner': 'Chiefs',
            'confidence': 0.75
        }

        # Mock Redis to return cached data
        mock_redis_client = AsyncMock()
        mock_redis_client.get.return_value = json.dumps(cached_prediction)
        mock_redis.return_value = mock_redis_client

        service = PredictionService()
        result = await service.get_game_prediction(1)

        # Should return cached result
        assert result == cached_prediction
        mock_redis_client.get.assert_called_once()
