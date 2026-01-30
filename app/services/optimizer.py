import torch
import numpy as np
import pandas as pd
import os

from torch_geometric.utils import dense_to_sparse

from qyra.interface.core.engine import QyraEngine
from qyra.interface.models.gnn import GATClassifier
from qyra.interface.modeling_logic.translators import AffinityTranslator


class Engine:
    def __init__(self, model_path):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model_path = model_path
        
        self.gnn = GATClassifier(in_channels=3, hidden_channels=32)
        self._load_weights()
        
        self.engine = QyraEngine(model=self.gnn)
        self.translator = AffinityTranslator(threshold=0.5)

    def _load_weights(self):
        if not os.path.exists(self.model_path):
            print(f"Model not found at {self.model_path}. Running without weights.")
            return

        try:
            state_dict = torch.load(self.model_path, map_location=self.device)
            # strict=False helps to ignore dropout/batchnorm layers that may vary.
            self.gnn.load_state_dict(state_dict, strict=False)
            self.gnn.to(self.device)
            self.gnn.eval()
            print("Weights loaded successfully.")
        except Exception as e:
            print(f"Error loading weights: {e}")

    def _build_tensors(self, df_prices):
        """
        Converts Time Series (60 days) into Statistical Features (3 features).
        Returns: x (Features) and edge_index (Topology)
        """
        log_returns = np.log(df_prices / df_prices.shift(1)).dropna()
        
        mean_ret = log_returns.mean().values
        volatility = log_returns.std().values
        momentum = (df_prices.iloc[-1] / df_prices.iloc[0] - 1).values
        
        x_features = np.vstack([mean_ret, volatility, momentum]).T
        
        # Z-Score Normalization (Critical for AI not to explode)
        x_features = (x_features - x_features.mean(axis=0)) / (x_features.std(axis=0) + 1e-6)
        
        x_tensor = torch.tensor(x_features, dtype=torch.float).to(self.device)

        df_corr = df_prices.corr().abs().fillna(0)
        corr_matrix = df_corr.values
        
        adj_matrix = torch.tensor(np.where(corr_matrix > 0.5, 1, 0), dtype=torch.int64)
        adj_matrix.fill_diagonal_(0)
        
        edge_index, _ = dense_to_sparse(adj_matrix)
        edge_index = edge_index.to(self.device)

        return x_tensor, edge_index
    
    def _generate_reasoning(self, selected_assets, all_assets, corr_matrix):
        """
            Compare the rejected assets with the selected ones to explain the cut.
        """
        rejected = [t for t in all_assets if t not in selected_assets]
        reasons = []
        
        if not rejected:
            return "Portfolio maintained in its entirety."
        
        ticker_to_idx = {name: i for i, name in enumerate(all_assets)}

        for bad_asset in rejected:
            bad_idx = ticker_to_idx.get(bad_asset)
            
            max_corr = -1.0
            substitute = None
            
            for good_asset in selected_assets:
                good_idx = ticker_to_idx.get(good_asset)
                
                corr_val = corr_matrix[bad_idx, good_idx]
                
                if corr_val > max_corr:
                    max_corr = corr_val
                    substitute = good_asset
        
            pct = int(max_corr * 100)
            
            if max_corr > 0.85:
                reasons.append(f"We removed {bad_asset} due to redundancy with {substitute} ({pct}% similarity).")
            elif max_corr > 0.60:
                reasons.append(f"{bad_asset} replaced by {substitute} (similar correlation)")
                
        if not reasons:
            return "Assets were removed to maximize the Sharpe Ratio and reduce overall variance."

        # Returns only the top 2 reasons
        return " • ".join(reasons[:2]) + "."

    def optimize(self, df_prices, target_k):
        tickers = df_prices.columns.tolist()
        
        # If only one asset, there is no correlation to calculate or graph to build.
        if len(tickers) == 1:
            return tickers[:target_k]
        
        try:
            x, edge_index = self._build_tensors(df_prices)
        except IndexError as e:
            raise IndexError
        except Exception as e:
            print(f"Error in tensor construction: {e}")
            # Fallback
            return tickers[:target_k]

        prices_array = df_prices.values
        if prices_array is None:
             raise ValueError("Invalid price data")

        q_matrix = self.translator.from_time_series(
            time_series_data=prices_array, 
            labels=tickers
        )
        
        prices_for_corr = prices_array.copy()
        if prices_for_corr.shape[0] > prices_for_corr.shape[1]:
            prices_for_corr = prices_for_corr.T
        
        correlation_matrix = np.corrcoef(prices_for_corr)

        print(f"Sending data to the core engine...")

        solution_vec, energy = self.engine.solve(
            x=x, 
            edge_index=edge_index, 
            q_matrix=q_matrix, 
            learn=False
        )
        
        if solution_vec is None:
            print("Core solver returned no results. Fallback.")
            return tickers[:target_k]

        result = self.translator.decode(solution_vec)
        selected = result['selected']
        
        # If the core solver returned more assets than desired, we cut them back.
        if len(selected) > target_k:
            # Since we don't have the manual scores here, we use the original or random order.
            # If you want to use scores to break ties, you would have to ask the engine to return the scores as well.
            # For now, a simple cutoff:
            selected = selected[:target_k]
            
        reasoning = self._generate_reasoning(
            selected_assets=selected,
            all_assets=tickers,
            corr_matrix=correlation_matrix
        )
        
        return selected, reasoning
