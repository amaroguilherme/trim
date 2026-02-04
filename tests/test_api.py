import pytest
from unittest.mock import patch

def test_rate_limit_trim_portfolio(client):
    endpoint = '/api/v1/trim'

    payload = {
        "market_context": "crypto",
        "source_assets": ["BTC", "ETH"],
        "constraints": {"target_size": 1}
    }

    with patch('app.routes.get_optimizer') as mock_engine:
        
        for i in range(5):
            response = client.post(endpoint, json=payload)
            assert response.status_code != 429

        response = client.post(endpoint, json=payload)
        
        assert response.status_code == 429
