import os

class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    
    MODEL_PATH = os.path.join(BASE_DIR, 'app/models/trim_crypto_base_model.pt') #TODO: MOVE IT TO HUGGING FACE HUB
    
    MIN_HISTORY_DAYS = 60  
    
    # Financial parameters for estimating savings
    TRANSACTION_COST_USD = 2.00  # Average cost per order (Fee + Spread + Gas)
    REBALANCE_FREQ_YEARLY = 12   # Adjustment frequency (Monthly)
