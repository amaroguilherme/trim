import os

from dotenv import load_dotenv

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from app.services.security import get_identity

load_dotenv()

limiter = Limiter(
    key_func=get_identity,
    default_limits=["200 per day", "50 per hour"]
)

class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    
    MODELS = {
        'crypto': os.path.join(BASE_DIR, 'app/models/trim_crypto_base_model.pt'),
        'br_stocks': os.path.join(BASE_DIR, 'app/models/production/trim_dividend_base_model.pt')
    } #TODO: MOVE IT TO HUGGING FACE HUB
    
    MIN_HISTORY_DAYS = 60  
    
    # Financial parameters for estimating savings
    COSTS = {
        'crypto': 2.00,    # USD (Spread + Gas)
        'br_stocks': 0.50  # USD (Corretagem Zero na maioria + Emolumentos B3)
    }
    TRANSACTION_COST_USD = 2.00  # Average cost per order (Fee + Spread + Gas)
    REBALANCE_FREQ_YEARLY = 12   # Adjustment frequency (Monthly)
    
    INTERNAL_API_SECRET = os.getenv('INTERNAL_API_SECRET')
    
    is_dev = os.getenv('DEVELOPMENT') == 'True'
    ALLOW_DIRECT_ACCESS = is_dev or os.getenv('ALLOW_DIRECT_ACCESS') == 'True'

    RATELIMIT_STORAGE_URI = "memory://"
    RATELIMIT_STRATEGY = "fixed-window"
    RATELIMIT_HEADERS_ENABLED = True
    
    RATELIMIT_DEFAULT = "200 per day, 50 per hour"
    RATELIMIT_HEADERS_ENABLED = True
