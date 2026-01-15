from flask import current_app

def calculate_savings(context, initial_count, final_count):
    """
    Calculates the projected annual savings based on avoided transaction fees.
    Formula: (Change in Assets) * (Average Cost) * (Annual Frequency)
    """
    cost_per_order = current_app.config['COSTS'][context]
    freq = current_app.config['REBALANCE_FREQ_YEARLY']
    
    assets_removed = initial_count - final_count
    
    # If the user increased their portfolio (rare, but possible), the savings are 0.
    if assets_removed <= 0:
        return {
            "assets_removed": 0,
            "estimated_yearly_savings_usd": 0.00,
            "message": "Nenhuma redução de custos detectada."
        }

    monthly_savings = assets_removed * cost_per_order
    yearly_savings = monthly_savings * freq
    
    return {
        "assets_removed": assets_removed,
        "estimated_yearly_savings_usd": round(yearly_savings, 2),
        "calculation_logic": f"Removed {assets_removed} assets x ${cost_per_order} fee x {freq} months"
    }
