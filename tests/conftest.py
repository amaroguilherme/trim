import pytest
from app import create_app
from config import Config

class TestConfig(Config):
    TESTING = True
    RATELIMIT_ENABLED = True 
    RATELIMIT_STORAGE_URI = "memory://"
    # Disable complex validations
    WTF_CSRF_ENABLED = False

@pytest.fixture
def client():
    app = create_app()
    app.config.from_object(TestConfig)
    
    with app.test_client() as client:
        yield client