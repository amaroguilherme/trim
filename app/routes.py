from flask import Blueprint, request, jsonify, current_app
from app.services.optimizer import Engine
from app.services.market_data import download_clean_data
from app.services.finance import calculate_savings

api = Blueprint('main', __name__)

# Keeps the model in memory
optimizer_instance = None

def get_optimizer(context):
    global optimizer_instance
    if optimizer_instance is None:
        print("Initializing engine...")
        optimizer_instance = Engine(current_app.config['MODELS'][context])
    return optimizer_instance

@api.route('/api/v1/trim', methods=['POST'])
def trim_portfolio():
    data = request.get_json() or {}
    market_context = data.get('market_context', 'crypto')
    
    engine = get_optimizer(market_context)

    source_assets = data.get('source_assets', [])
    constraints = data.get('constraints', {})
    
    target_size = constraints.get('target_size', 10)
    locked_assets = set(constraints.get('locked_assets', []))

    if not source_assets:
        return jsonify({"error": "Asset list is empty."}), 400
    if len(source_assets) < target_size:
        return jsonify({"error": f"Impossible to reduce: You have {len(source_assets)} assets, but you want {target_size}."}), 400

    if market_context == 'br_stocks':
        source_assets = [
            f"{t}.SA" if not t.endswith('.SA') else t 
            for t in source_assets
        ]

    try:
        optimizable_pool = [asset for asset in source_assets if asset not in locked_assets]
        adjusted_target = target_size - len(locked_assets)
        final_selection = list(locked_assets)

        if adjusted_target > 0 and optimizable_pool:
            df_prices = download_clean_data(optimizable_pool)
            optimized_assets = engine.optimize(df_prices, adjusted_target)
            final_selection.extend(optimized_assets)
        
        if len(final_selection) > target_size:
             final_selection = final_selection[:target_size]

        to_sell = [asset for asset in source_assets if asset not in final_selection]
        savings_report = calculate_savings(market_context, len(source_assets), len(final_selection))
        
        return jsonify({
            "meta": {
                "total_input": len(source_assets),
                "target_requested": target_size
            },
            "recommendation": {
                "portfolio_trim": final_selection,
                "sell_list": to_sell
            },
            "financial_impact": savings_report
        }), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Internal error", "details": str(e)}), 500
