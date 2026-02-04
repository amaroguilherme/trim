import os

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="memory://"
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
    
    RATELIMIT_DEFAULT = "200 per day, 50 per hour"
    RATELIMIT_HEADERS_ENABLED = True
