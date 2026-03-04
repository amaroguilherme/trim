import yfinance as yf
import pandas as pd
from flask import current_app

def download_clean_data(tickers):
    """
    Downloads market data and ensures the exact format for GNN (60 days).
    Returns a clean DataFrame or throws an error.
    """
    if not tickers:
        return pd.DataFrame()

    print(f"Downloading {len(tickers)} assets (Window: 6 months)...")
    
    # Reduce by 6 months to ensure a safety margin against holidays
    # auto_adjust=True adjusts for dividends and splits
    df = yf.download(tickers, period="6mo", progress=False, auto_adjust=True)['Close']
    
    # Handling the case where only one asset is received
    if isinstance(df, pd.Series):
        df = df.to_frame(name=tickers[0])

    df = df.fillna(method='ffill').fillna(method='bfill')

    required_days = current_app.config['MIN_HISTORY_DAYS']
    
    if len(df) < required_days:
        raise ValueError(f"Insufficient historical data. Received: {len(df)} days. Required: {required_days}+.")

    df_clean = df.tail(required_days)
    
    print(f"Data ready. Final shape: {df_clean.shape}")
    return df_clean
