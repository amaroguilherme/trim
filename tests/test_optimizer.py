import pytest
import pandas as pd
import numpy as np
import torch
from unittest.mock import MagicMock, patch
from app.services.optimizer import Engine


@pytest.fixture
def mock_prices_df():
    """Generates a DataFrame of fake prices (60 days, 5 assets)."""
    dates = pd.date_range(start="2023-01-01", periods=60)
    data = np.random.uniform(10, 100, size=(60, 5))
    columns = ["PETR4", "VALE3", "WEGE3", "ITUB4", "BBAS3"]
    return pd.DataFrame(data, index=dates, columns=columns)

@pytest.fixture
def mock_engine_setup():
    """
    Mock the heavy dependencies (Torch load, QyraEngine)
    so we don't need the actual model or the binary.
    """
    with patch('app.services.optimizer.torch.load') as mock_load, \
         patch('app.services.optimizer.QyraEngine') as mock_qyra_cls, \
         patch('app.services.optimizer.os.path.exists') as mock_exists:
        
        mock_exists.return_value = True
        mock_load.return_value = {}
        
        mock_engine_instance = MagicMock()
        mock_qyra_cls.return_value = mock_engine_instance
        
        yield {
            'load': mock_load,
            'qyra_cls': mock_qyra_cls,
            'engine_instance': mock_engine_instance,
            'exists': mock_exists
        }


def test_initialization_with_model(mock_engine_setup):
    """Tests whether the engine initializes correctly when the model exists."""
    trim = Engine("fake_path.pt")
    
    assert trim.gnn is not None
    mock_engine_setup['load'].assert_called_once()
    mock_engine_setup['qyra_cls'].assert_called_once()

def test_initialization_missing_model(mock_engine_setup):
    """Tests the fallback (heuristic) when the model does not exist."""
    mock_engine_setup['exists'].return_value = False
    
    trim = Engine("fake_path.pt")
    
    # GNN must have initialized the architecture, but not loaded the weights.
    assert trim.gnn is not None 
    mock_engine_setup['load'].assert_not_called() # He didn't try to load weights.

def test_tensor_construction_shapes(mock_engine_setup, mock_prices_df):
    """Verify that _build_tensors creates matrices with the correct dimensions."""
    trim = Engine("fake_path.pt")
    x, edge_index = trim._build_tensors(mock_prices_df)
    
    # x should be [Number_of_Assets, 3 Features] -> [5, 3]
    assert x.shape == (5, 3)
    # edge_index should be [2, Number_of_Edges]
    assert edge_index.shape[0] == 2
    
    # Check if it has normalized (values ​​haven't spiked).
    assert not torch.isnan(x).any()

def test_optimize_happy_path(mock_engine_setup, mock_prices_df):
    """
    Ideal Scenario:
    1. Prepare data. 
    2. Engine solves the problem. 
    3. Returns selected assets.
    """
    trim = Engine("fake_path.pt")
    
    # Assume the solver chose assets 0 and 2 (PETR4 and WEGE3)
    # The binary vector would be [1, 0, 1, 0, 0]
    mock_solution = np.array([1, 0, 1, 0, 0])
    mock_engine_setup['engine_instance'].solve.return_value = (mock_solution, -10.5)
    
    result = trim.optimize(mock_prices_df, target_k=2)
    
    assert len(result) == 2
    assert "PETR4" in result
    assert "WEGE3" in result

def test_optimize_solver_failure(mock_engine_setup, mock_prices_df):
    """The solver crashes or returns None. We need a fallback."""
    trim = Engine("fake_path.pt")
    
    mock_engine_setup['engine_instance'].solve.return_value = (None, None)
    
    result = trim.optimize(mock_prices_df, target_k=3)
    
    # Fallback: should return the first K assets from the list.
    assert len(result) == 3
    assert result == ["PETR4", "VALE3", "WEGE3"]

def test_cardinality_mismatch(mock_engine_setup, mock_prices_df):
    """
    The user requested 2 assets, but the Solver returned 4.
    The code should trim the excess.
    """
    trim = Engine("fake_path.pt")
    
    mock_solution = np.array([1, 1, 1, 1, 0])
    mock_engine_setup['engine_instance'].solve.return_value = (mock_solution, -5.0)
    
    target_k = 2
    result = trim.optimize(mock_prices_df, target_k=target_k)
    
    assert len(result) == target_k # Must force size 2
    # Since we don't have manual scores in this mock, it sorts by the order of the returned list.

def test_constant_prices_division_by_zero(mock_engine_setup):
    """
    An asset with a constant price (standard deviation = 0). 
    Z-Score normalization would involve dividing by zero without protection.
    """
    dates = pd.date_range("2023-01-01", periods=60)
    # PETR4 fluctuates, VALE3 is constant
    data = {
        "PETR4": np.random.uniform(10, 20, 60),
        "VALE3": [50.0] * 60 
    }
    df = pd.DataFrame(data, index=dates)
    
    trim = Engine("fake_path.pt")
    
    x, _ = trim._build_tensors(df)
    
    assert not torch.isnan(x).any()
    assert not torch.isinf(x).any()

def test_input_empty_validation(mock_engine_setup):
    """Invalid input must be handled."""
    trim = Engine("fake_path.pt")
    
    empty_df = pd.DataFrame()

    with pytest.raises(Exception): 
        # We expect it to break or return a controlled error during tensor creation.
        trim.optimize(empty_df, target_k=5)

def test_target_k_larger_than_assets(mock_engine_setup, mock_prices_df):
    """
    Scenario: The user sends 5 assets but requests to select 10.
    Expected: Return all 5 (it should not invent or create assets).
    """
    trim = Engine("fake.pt")

    mock_solution = np.ones(5) 
    mock_engine_setup['engine_instance'].solve.return_value = (mock_solution, -1.0)
    
    result = trim.optimize(mock_prices_df, target_k=10)
    
    assert len(result) == 5
    assert set(result) == set(mock_prices_df.columns)

def test_zero_price_handling(mock_engine_setup):
    """
    Scenario: Asset with price 0.0 (data error or bankruptcy).
    This causes division by zero in the return calculation and Log(0) = -Inf.
    """
    dates = pd.date_range("2023-01-01", periods=60)
    data = {
        "GOOD": np.random.uniform(10, 20, 60),
        "BAD_ZERO": [10.0] * 59 + [0.0] # Caiu para zero no último dia
    }
    df = pd.DataFrame(data, index=dates)
    
    trim = Engine("fake.pt")
    
    # _build_tensors should generate valid tensors (without NaNs that would break the network).
    x, _ = trim._build_tensors(df)
    
    assert x.shape == (2, 3) 

def test_extreme_short_history(mock_engine_setup):
    """
    Scenario: The API returned only 2 days of history (the minimum to calculate 1 return). 
    We usually expects 60, but it shouldn't crash with less.
    """
    dates = pd.date_range("2023-01-01", periods=3) # Apenas 3 dias
    df = pd.DataFrame(np.random.rand(3, 5), index=dates, columns=["A","B","C","D","E"])
    
    trim = Engine("fake.pt")
    
    # Solver returns anything
    mock_engine_setup['engine_instance'].solve.return_value = (np.ones(5), 0)
    
    try:
        result = trim.optimize(df, target_k=2)
        assert len(result) > 0
    except Exception as e:
        pytest.fail(f"It crashed with a short history.: {e}")

def test_corrupt_model_file(mock_engine_setup):
    """
    Scenario: The model exists, but is corrupted . 
    torch.load will throw an exception. The system should fall back.
    """
    trim = Engine("corrupt.pt")
    
    mock_engine_setup['load'].side_effect = RuntimeError("Invalid magic number")
    
    assert trim.gnn is not None

def test_data_with_nans_holes(mock_engine_setup):
    """
    Scenario: Historical data with gaps (NaNs) in the middle. 
    Common in cases involving different holidays between countries.
    """
    dates = pd.date_range("2023-01-01", periods=60)
    df = pd.DataFrame(np.random.uniform(10, 20, (60, 3)), columns=["A", "B", "C"], index=dates)
    
    df.iloc[10:15, 1] = np.nan 
    
    trim = Engine("fake.pt")
    
    x, edge_index = trim._build_tensors(df)
    
    assert x.shape[0] == 3
    assert not torch.isnan(x).any()

def test_perfect_correlation_singularity(mock_engine_setup):
    """
    Scenario: All assets are identical (Correlation = 1.0 everywhere). 
    This creates a fully connected adjacency matrix.
    """
    dates = pd.date_range("2023-01-01", periods=60)
    arr = np.random.uniform(10, 20, 60)
    # Create 5 assets with exactly the same data.
    data = {f"ASSET_{i}": arr for i in range(5)}
    df = pd.DataFrame(data, index=dates)
    
    trim = Engine("fake.pt")
    
    x, edge_index = trim._build_tensors(df)
    
    assert edge_index.shape[1] > 0

def test_single_asset_portfolio(mock_engine_setup):
    """
    Scenario: User sends 1 asset and requests target 1.
    """
    dates = pd.date_range("2023-01-01", periods=60)
    df = pd.DataFrame({"SOLO": np.random.rand(60)}, index=dates)
    
    trim = Engine("fake.pt")
    mock_engine_setup['engine_instance'].solve.return_value = (np.array([1]), -0.5)
    
    result = trim.optimize(df, target_k=1)
    
    assert result == ["SOLO"]
    # Check if edge creation did not fail (correlation of 1 asset returns 1x1 or empty).
    x, edge_index = trim._build_tensors(df)
    assert x.shape == (1, 3)
    # The edge index can be empty (no neighbors).
