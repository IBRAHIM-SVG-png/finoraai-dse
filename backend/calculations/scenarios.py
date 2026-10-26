# What-If Scenario Comparison Engine
# Compares multiple strategic financial choices side-by-side

from typing import Dict, Any, List
from calculations.simulator import run_simulation

def compare_what_if_scenarios(base_params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes baseline financial parameters and evaluates 5 comparative scenarios:
    1. Baseline (Current Habits)
    2. Reduce Expenses by 10%
    3. Increase Monthly Savings by 2,000 (or custom contribution boost)
    4. Increase Income by 10%
    5. Emergency Expense shock (e.g. 50,000 at month 3)
    """
    duration = int(base_params.get("duration_months", 12))
    cur_income = float(base_params.get("monthly_income", 50000.0))
    cur_expenses = float(base_params.get("monthly_expenses", 30000.0))
    cur_savings = float(base_params.get("current_savings", 50000.0))
    cur_contribution = float(base_params.get("monthly_contribution", 0.0))
    boost_savings_amt = float(base_params.get("boost_savings_amt", 2000.0))
    emergency_amt = float(base_params.get("emergency_expense_amt", 50000.0))
    
    # 1. Baseline
    sim_baseline = run_simulation(base_params)

    # 2. Reduce Expenses by 10%
    params_exp_cut = dict(base_params)
    params_exp_cut["monthly_expenses"] = cur_expenses * 0.90
    sim_exp_cut = run_simulation(params_exp_cut)

    # 3. Boost Monthly Savings
    params_boost = dict(base_params)
    params_boost["monthly_contribution"] = cur_contribution + boost_savings_amt
    sim_boost = run_simulation(params_boost)

    # 4. Increase Income by 10%
    params_inc = dict(base_params)
    params_inc["monthly_income"] = cur_income * 1.10
    sim_inc = run_simulation(params_inc)

    # 5. Emergency Shock (e.g., month 3)
    params_emergency = dict(base_params)
    emergency_month = max(1, min(3, duration))
    existing_planned = list(base_params.get("planned_expenses", []))
    existing_planned.append({
        "month": emergency_month,
        "amount": emergency_amt,
        "description": "Unforeseen Emergency Expense"
    })
    params_emergency["planned_expenses"] = existing_planned
    sim_emergency = run_simulation(params_emergency)

    # Compare key metrics
    scenarios_summary = [
        {
            "id": "baseline",
            "name": "Current Habits (Baseline)",
            "description": "Continuing with your current income, expenses, and savings pattern.",
            "final_cash": sim_baseline["summary"]["final_cash_savings"],
            "final_invested": sim_baseline["summary"]["final_invested_wealth"],
            "difference_vs_baseline": 0.0,
            "badge_color": "blue",
            "tag": "Current"
        },
        {
            "id": "reduce_expenses_10",
            "name": "Cut Expenses by 10%",
            "description": f"Trimming non-essential discretionary expenses by 10% (saving ₹{round(cur_expenses * 0.10, 0):,}/mo).",
            "final_cash": sim_exp_cut["summary"]["final_cash_savings"],
            "final_invested": sim_exp_cut["summary"]["final_invested_wealth"],
            "difference_vs_baseline": round(sim_exp_cut["summary"]["final_cash_savings"] - sim_baseline["summary"]["final_cash_savings"], 2),
            "badge_color": "emerald",
            "tag": "Recommended"
        },
        {
            "id": "increase_savings_boost",
            "name": f"+₹{int(boost_savings_amt):,} Monthly Savings",
            "description": f"Automating an extra ₹{int(boost_savings_amt):,} transfer into your savings/investment pot each month.",
            "final_cash": sim_boost["summary"]["final_cash_savings"],
            "final_invested": sim_boost["summary"]["final_invested_wealth"],
            "difference_vs_baseline": round(sim_boost["summary"]["final_cash_savings"] - sim_baseline["summary"]["final_cash_savings"], 2),
            "badge_color": "cyan",
            "tag": "High Impact"
        },
        {
            "id": "increase_income_10",
            "name": "Increase Income by 10%",
            "description": f"Boosting earning through upskilling, promotion, or freelance work (adds ₹{round(cur_income * 0.10, 0):,}/mo).",
            "final_cash": sim_inc["summary"]["final_cash_savings"],
            "final_invested": sim_inc["summary"]["final_invested_wealth"],
            "difference_vs_baseline": round(sim_inc["summary"]["final_cash_savings"] - sim_baseline["summary"]["final_cash_savings"], 2),
            "badge_color": "violet",
            "tag": "Earning Focus"
        },
        {
            "id": "emergency_shock",
            "name": f"Emergency Expense (-₹{int(emergency_amt):,})",
            "description": f"Simulating resilience against an unplanned ₹{int(emergency_amt):,} medical or repair emergency in Month {emergency_month}.",
            "final_cash": sim_emergency["summary"]["final_cash_savings"],
            "final_invested": sim_emergency["summary"]["final_invested_wealth"],
            "difference_vs_baseline": round(sim_emergency["summary"]["final_cash_savings"] - sim_baseline["summary"]["final_cash_savings"], 2),
            "badge_color": "rose",
            "tag": "Stress Test"
        }
    ]

    # Combine month-by-month trajectory for Recharts
    comparison_chart_data = []
    for m in range(duration):
        month_num = m + 1
        comparison_chart_data.append({
            "month": f"M{month_num}",
            "month_num": month_num,
            "Baseline": sim_baseline["timeline"][m]["cash_savings"],
            "Cut_Expenses_10pct": sim_exp_cut["timeline"][m]["cash_savings"],
            "Extra_Savings_Boost": sim_boost["timeline"][m]["cash_savings"],
            "Income_Plus_10pct": sim_inc["timeline"][m]["cash_savings"],
            "Emergency_Shock": sim_emergency["timeline"][m]["cash_savings"]
        })

    return {
        "duration_months": duration,
        "scenarios": scenarios_summary,
        "chart_data": comparison_chart_data
    }
