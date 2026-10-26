# Future Financial Simulator Engine
# Rigorous month-by-month forecasting with compound growth, scenario comparison, and Monte Carlo goal probability

import numpy as np
from typing import Dict, List, Any

def run_simulation(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simulates future financial trajectories over a specified duration in months.
    Distinguishes liquid cash savings from compound-invested portfolio projections.
    """
    current_savings = float(params.get('current_savings', 0.0))
    monthly_income = float(params.get('monthly_income', 0.0))
    monthly_expenses = float(params.get('monthly_expenses', 0.0))
    
    # Growth rates passed as annual percentages (e.g., 5.0 for 5% p.a.)
    annual_income_growth = float(params.get('income_growth_pct', 0.0)) / 100.0
    annual_expense_growth = float(params.get('expense_growth_pct', 0.0)) / 100.0
    annual_investment_return = float(params.get('investment_return_pct', 0.0)) / 100.0
    
    # Monthly converted compounding rates: (1 + r)^(1/12) - 1
    monthly_income_growth_rate = (1.0 + annual_income_growth)**(1.0 / 12.0) - 1.0 if annual_income_growth > -1.0 else 0.0
    monthly_expense_growth_rate = (1.0 + annual_expense_growth)**(1.0 / 12.0) - 1.0 if annual_expense_growth > -1.0 else 0.0
    monthly_inv_return_rate = (1.0 + annual_investment_return)**(1.0 / 12.0) - 1.0 if annual_investment_return > -1.0 else 0.0

    monthly_contribution = float(params.get('monthly_contribution', 0.0))
    goal_amount = float(params.get('goal_amount', 0.0))
    duration_months = int(params.get('duration_months', 12))
    planned_expenses = params.get('planned_expenses', []) # List of { "month": int, "amount": float, "description": str }

    # Map one-time expenses by month
    one_time_by_month = {}
    for item in planned_expenses:
        m = int(item.get('month', 1))
        amt = float(item.get('amount', 0.0))
        desc = item.get('description', 'One-time expense')
        if m not in one_time_by_month:
            one_time_by_month[m] = []
        one_time_by_month[m].append({"amount": amt, "description": desc})

    # Arrays for month-by-month projection
    timeline = []
    
    cash_balance = current_savings
    invested_balance = current_savings
    
    cur_income = monthly_income
    cur_expenses = monthly_expenses
    
    total_projected_income = 0.0
    total_projected_expenses = 0.0
    total_one_time_expenses = 0.0
    
    goal_reached_month_cash = None
    goal_reached_month_invested = None

    for m in range(1, duration_months + 1):
        # Apply monthly growth
        if m > 1:
            cur_income *= (1.0 + monthly_income_growth_rate)
            cur_expenses *= (1.0 + monthly_expense_growth_rate)

        # Monthly surplus
        surplus = cur_income - cur_expenses + monthly_contribution
        
        # One-time expense for this month
        one_time_list = one_time_by_month.get(m, [])
        one_time_total = sum(x["amount"] for x in one_time_list)
        total_one_time_expenses += one_time_total

        # Liquid Cash Savings Formula:
        # Ending_m = Ending_(m-1) + Income_m - Expenses_m + Contribution_m - OneTime_m
        cash_balance += (surplus - one_time_total)

        # Invested Portfolio Formula (Compounding on opening balance + net surplus):
        # Ending_m = Invested_(m-1) * (1 + r_monthly) + surplus - OneTime_m
        investment_growth_gain = invested_balance * monthly_inv_return_rate
        invested_balance = invested_balance + investment_growth_gain + surplus - one_time_total

        total_projected_income += cur_income
        total_projected_expenses += cur_expenses

        # Check goal achievement
        if goal_amount > 0:
            if goal_reached_month_cash is None and cash_balance >= goal_amount:
                goal_reached_month_cash = m
            if goal_reached_month_invested is None and invested_balance >= goal_amount:
                goal_reached_month_invested = m

        timeline.append({
            "month": m,
            "income": round(cur_income, 2),
            "expenses": round(cur_expenses, 2),
            "surplus": round(surplus, 2),
            "one_time_expense": round(one_time_total, 2),
            "one_time_items": one_time_list,
            "cash_savings": round(cash_balance, 2),
            "invested_wealth": round(invested_balance, 2),
            "goal_target": round(goal_amount, 2) if goal_amount > 0 else None
        })

    # Multi-scenario bands: Best Case, Base Case, Worst Case
    best_case_timeline = _simulate_band(
        current_savings, monthly_income, monthly_expenses,
        annual_income_growth + 0.03, max(0.0, annual_expense_growth - 0.015),
        monthly_contribution * 1.15, one_time_by_month,
        annual_investment_return + 0.02, duration_months
    )

    worst_case_timeline = _simulate_band(
        current_savings, monthly_income, monthly_expenses,
        max(0.0, annual_income_growth - 0.02), annual_expense_growth + 0.025,
        monthly_contribution * 0.8, one_time_by_month,
        max(0.0, annual_investment_return - 0.03), duration_months
    )

    # Goal Achievement Probability using Monte Carlo Simulation (1,000 iterations)
    goal_probability = None
    if goal_amount > 0:
        goal_probability = _calculate_monte_carlo_goal_probability(
            current_savings=current_savings,
            monthly_income=monthly_income,
            monthly_expenses=monthly_expenses,
            annual_income_growth=annual_income_growth,
            annual_expense_growth=annual_expense_growth,
            annual_return=annual_investment_return,
            monthly_contribution=monthly_contribution,
            one_time_by_month=one_time_by_month,
            duration_months=duration_months,
            goal_amount=goal_amount,
            num_simulations=1000
        )

    return {
        "summary": {
            "initial_savings": round(current_savings, 2),
            "final_cash_savings": round(cash_balance, 2),
            "final_invested_wealth": round(invested_balance, 2),
            "wealth_gain_from_investment": round(invested_balance - cash_balance, 2),
            "total_projected_income": round(total_projected_income, 2),
            "total_projected_expenses": round(total_projected_expenses, 2),
            "total_one_time_expenses": round(total_one_time_expenses, 2),
            "net_capital_saved": round(cash_balance - current_savings, 2),
            "goal_amount": round(goal_amount, 2) if goal_amount > 0 else None,
            "goal_reached_month_cash": goal_reached_month_cash,
            "goal_reached_month_invested": goal_reached_month_invested,
            "goal_probability_pct": goal_probability,
            "duration_months": duration_months,
            "assumptions_note": (
                "Assumptions: Ending cash savings = Starting + Net monthly surplus - One-time expenses. "
                "Invested portfolio assumes monthly compounded compounding return at stated annual rate. "
                "Investment returns are illustrative projections and not guaranteed."
            )
        },
        "timeline": timeline,
        "best_case_timeline": best_case_timeline,
        "worst_case_timeline": worst_case_timeline
    }

def _simulate_band(
    savings: float, income: float, expenses: float,
    inc_growth: float, exp_growth: float, contribution: float,
    one_time_dict: dict, inv_return: float, duration: int
) -> List[Dict[str, Any]]:
    band_points = []
    bal_cash = savings
    bal_inv = savings
    
    m_inc_rate = (1.0 + inc_growth)**(1.0 / 12.0) - 1.0 if inc_growth > -1.0 else 0.0
    m_exp_rate = (1.0 + exp_growth)**(1.0 / 12.0) - 1.0 if exp_growth > -1.0 else 0.0
    m_ret_rate = (1.0 + inv_return)**(1.0 / 12.0) - 1.0 if inv_return > -1.0 else 0.0
    
    cur_inc = income
    cur_exp = expenses

    for m in range(1, duration + 1):
        if m > 1:
            cur_inc *= (1.0 + m_inc_rate)
            cur_exp *= (1.0 + m_exp_rate)
        
        surplus = cur_inc - cur_exp + contribution
        one_time = sum(x["amount"] for x in one_time_dict.get(m, []))
        
        bal_cash += (surplus - one_time)
        bal_inv = bal_inv * (1.0 + m_ret_rate) + surplus - one_time
        
        band_points.append({
            "month": m,
            "cash_savings": round(bal_cash, 2),
            "invested_wealth": round(bal_inv, 2)
        })
    return band_points

def _calculate_monte_carlo_goal_probability(
    current_savings: float,
    monthly_income: float,
    monthly_expenses: float,
    annual_income_growth: float,
    annual_expense_growth: float,
    annual_return: float,
    monthly_contribution: float,
    one_time_by_month: dict,
    duration_months: int,
    goal_amount: float,
    num_simulations: int = 1000
) -> float:
    """
    Monte Carlo statistical model:
    Runs N stochastic trials where:
    - Monthly investment return varies with normal volatility (mean = annual_return/12, std = 0.035)
    - Monthly income growth has slight variation (mean = annual_income_growth/12, std = 0.005)
    Calculates proportion of trials where ending portfolio or cash meets or exceeds goal_amount.
    """
    if goal_amount <= 0:
        return 100.0

    success_count = 0
    np.random.seed(42) # Consistent reproducible results

    m_ret_mean = (1.0 + annual_return)**(1.0 / 12.0) - 1.0
    m_inc_mean = (1.0 + annual_income_growth)**(1.0 / 12.0) - 1.0
    m_exp_rate = (1.0 + annual_expense_growth)**(1.0 / 12.0) - 1.0

    for _ in range(num_simulations):
        bal = current_savings
        cur_inc = monthly_income
        cur_exp = monthly_expenses
        reached = False

        # Random shocks
        rand_returns = np.random.normal(m_ret_mean, 0.025, duration_months)
        rand_inc_growths = np.random.normal(m_inc_mean, 0.005, duration_months)

        for m in range(1, duration_months + 1):
            if m > 1:
                cur_inc *= (1.0 + max(-0.05, rand_inc_growths[m - 1]))
                cur_exp *= (1.0 + m_exp_rate)

            surplus = cur_inc - cur_exp + monthly_contribution
            one_time = sum(x["amount"] for x in one_time_by_month.get(m, []))
            
            # Apply stochastic return
            r = rand_returns[m - 1]
            bal = bal * (1.0 + r) + surplus - one_time

            if bal >= goal_amount:
                reached = True
                break

        if reached or bal >= goal_amount:
            success_count += 1

    prob = round((success_count / num_simulations) * 100.0, 1)
    return prob
