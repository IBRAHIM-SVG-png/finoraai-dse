# AI Financial Recommendation Engine
# Rule-based explainable financial intelligence based on mathematical heuristics and behavioral economics

from typing import List, Dict, Any
from datetime import datetime
import pandas as pd
import numpy as np

DISCRETIONARY_CATEGORIES = {"Shopping", "Food", "Entertainment", "Other", "Travel"}
ESSENTIAL_CATEGORIES = {"Bills", "Transport", "Education", "Healthcare", "Rent", "Groceries"}

def analyze_user_finances(
    transactions: List[Dict[str, Any]],
    budgets: List[Dict[str, Any]],
    goals: List[Dict[str, Any]],
    user_profile: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Performs comprehensive diagnostic analysis on user financial records
    and produces grounded, mathematically explainable recommendations.
    """
    if not transactions:
        return _empty_insights()

    df = pd.DataFrame(transactions)
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0.0)
    
    # Split into income and expenses
    income_df = df[df['type'] == 'income']
    expense_df = df[df['type'] == 'expense']

    total_income = float(income_df['amount'].sum())
    total_expenses = float(expense_df['amount'].sum())
    net_savings = total_income - total_expenses
    savings_rate = (net_savings / total_income * 100.0) if total_income > 0 else 0.0

    # Category Breakdown
    cat_expenses = expense_df.groupby('category')['amount'].sum().to_dict() if not expense_df.empty else {}
    sorted_categories = sorted(cat_expenses.items(), key=lambda x: x[1], reverse=True)

    # 1. Spending Pattern Analysis (50/30/20 Rule check)
    discretionary_spend = sum(amt for cat, amt in cat_expenses.items() if cat in DISCRETIONARY_CATEGORIES)
    essential_spend = sum(amt for cat, amt in cat_expenses.items() if cat in ESSENTIAL_CATEGORIES)
    
    needs_pct = (essential_spend / total_income * 100.0) if total_income > 0 else 0.0
    wants_pct = (discretionary_spend / total_income * 100.0) if total_income > 0 else 0.0

    # 2. Unnecessary / High Discretionary Expense Detection
    wasteful_insights = []
    for cat, amt in sorted_categories:
        if cat in DISCRETIONARY_CATEGORIES:
            pct_of_income = (amt / total_income * 100.0) if total_income > 0 else 0.0
            if pct_of_income > 20.0 or (cat == "Food" and pct_of_income > 18.0) or (cat == "Shopping" and pct_of_income > 15.0):
                potential_saving = round(amt * 0.25, 2)
                wasteful_insights.append({
                    "category": cat,
                    "spent": round(amt, 2),
                    "income_pct": round(pct_of_income, 1),
                    "severity": "high" if pct_of_income > 25.0 else "medium",
                    "suggestion": f"Discretionary spending on {cat} takes {round(pct_of_income, 1)}% of your income. Trimming this by 25% could liberate ₹{potential_saving:,} every month."
                })

    # Micro-transactions detection (High transaction frequency with smaller amounts)
    if not expense_df.empty and 'description' in expense_df.columns:
        micro_txs = expense_df[expense_df['amount'] < 500.0]
        if len(micro_txs) >= 10:
            micro_sum = float(micro_txs['amount'].sum())
            wasteful_insights.append({
                "category": "Frequent Small Expenses",
                "spent": round(micro_sum, 2),
                "income_pct": round((micro_sum / total_income * 100.0) if total_income > 0 else 0, 1),
                "severity": "medium",
                "suggestion": f"You made {len(micro_txs)} small purchases under ₹500 totaling ₹{round(micro_sum, 2):,}. Small recurring transactions often leak savings unnoticed."
            })

    # 3. Budget Optimization Suggestions
    budget_insights = []
    budget_map = {b['category']: float(b['monthly_limit']) for b in budgets} if budgets else {}
    for cat, spent in cat_expenses.items():
        if cat in budget_map:
            limit = budget_map[cat]
            utilization = (spent / limit) * 100.0 if limit > 0 else 100.0
            if utilization > 100.0:
                budget_insights.append({
                    "category": cat,
                    "type": "exceeded",
                    "utilization": round(utilization, 1),
                    "overspend": round(spent - limit, 2),
                    "action": f"Budget for {cat} exceeded by ₹{round(spent - limit, 2):,} ({round(utilization, 1)}% used). Freeze further non-critical spend in {cat}."
                })
            elif utilization >= 80.0:
                budget_insights.append({
                    "category": cat,
                    "type": "warning",
                    "utilization": round(utilization, 1),
                    "remaining": round(limit - spent, 2),
                    "action": f"{cat} budget has reached {round(utilization, 1)}%. Only ₹{round(limit - spent, 2):,} remains for this month."
                })
        else:
            if spent > 3000.0:
                budget_insights.append({
                    "category": cat,
                    "type": "unbudgeted",
                    "utilization": 0.0,
                    "action": f"No budget set for {cat} despite ₹{round(spent, 2):,} in spending. Setting an explicit cap will prevent unplanned leakage."
                })

    # 4. Actionable Savings Recommendations
    actionable_recommendations = []
    if savings_rate < 20.0:
        gap = round((0.20 * total_income) - net_savings, 2)
        actionable_recommendations.append({
            "title": "Achieve the 20% Healthy Savings Benchmark",
            "type": "savings_boost",
            "impact": f"+₹{max(0, gap):,}/month",
            "explanation": f"Your current savings rate is {round(savings_rate, 1)}%. Standard financial planning suggests saving at least 20% of income. Increasing your monthly savings by ₹{max(0, gap):,} will build financial resilience.",
            "priority": "High"
        })
    else:
        actionable_recommendations.append({
            "title": "Healthy Savings Discipline",
            "type": "savings_surplus",
            "impact": f"Retaining {round(savings_rate, 1)}% of income",
            "explanation": "You are maintaining a strong savings rate above the 20% baseline! Consider deploying surplus savings into SIPs or fixed deposits.",
            "priority": "Medium"
        })

    # 5. Goal-Based Saving Recommendations
    goal_insights = []
    total_monthly_goal_need = 0.0
    for g in goals:
        target = float(g.get('target_amount', 0.0))
        current = float(g.get('current_amount', 0.0))
        target_date_str = g.get('target_date', '')
        
        # Calculate months remaining
        months_left = 12
        try:
            td = datetime.strptime(target_date_str, "%Y-%m-%d")
            now = datetime.now()
            months_left = max(1, (td.year - now.year) * 12 + (td.month - now.month))
        except Exception:
            pass

        needed_monthly = max(0.0, (target - current) / months_left)
        total_monthly_goal_need += needed_monthly
        
        is_covered = net_savings >= needed_monthly
        goal_insights.append({
            "goal_title": g.get('title', 'Goal'),
            "category": g.get('category', 'General'),
            "needed_monthly": round(needed_monthly, 2),
            "months_left": months_left,
            "status": "on_track" if is_covered else "at_risk",
            "guidance": (
                f"Requires ₹{round(needed_monthly, 2):,}/mo for {months_left} months. "
                + ("Fully covered by current monthly surplus." if is_covered else f"Deficit of ₹{round(needed_monthly - net_savings, 2):,}/mo. Reallocate from discretionary spending.")
            )
        })

    # 6. Comprehensive Monthly Summary
    monthly_summary = {
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net_savings": round(net_savings, 2),
        "savings_rate_pct": round(savings_rate, 1),
        "top_expense_category": sorted_categories[0][0] if sorted_categories else "None",
        "top_category_amount": round(sorted_categories[0][1], 2) if sorted_categories else 0.0,
        "needs_vs_wants_split": {
            "needs_pct": round(needs_pct, 1),
            "wants_pct": round(wants_pct, 1),
            "savings_pct": round(savings_rate, 1)
        },
        "financial_rule_50_30_20": {
            "needs_target": 50,
            "wants_target": 30,
            "savings_target": 20,
            "adherence": "Optimal" if (needs_pct <= 55 and wants_pct <= 35 and savings_rate >= 18) else "Needs Adjustment"
        }
    }

    return {
        "monthly_summary": monthly_summary,
        "spending_patterns": {
            "category_distribution": [
                {"category": cat, "amount": round(amt, 2), "percentage": round((amt / total_expenses * 100.0), 1) if total_expenses > 0 else 0}
                for cat, amt in sorted_categories
            ],
            "discretionary_spend": round(discretionary_spend, 2),
            "essential_spend": round(essential_spend, 2)
        },
        "unnecessary_expenses": wasteful_insights,
        "budget_optimization": budget_insights,
        "actionable_recommendations": actionable_recommendations,
        "goal_recommendations": goal_insights
    }

def _empty_insights() -> Dict[str, Any]:
    return {
        "monthly_summary": {
            "total_income": 0.0,
            "total_expenses": 0.0,
            "net_savings": 0.0,
            "savings_rate_pct": 0.0,
            "top_expense_category": "None",
            "top_category_amount": 0.0,
            "needs_vs_wants_split": {"needs_pct": 0, "wants_pct": 0, "savings_pct": 0},
            "financial_rule_50_30_20": {"needs_target": 50, "wants_target": 30, "savings_target": 20, "adherence": "Awaiting Data"}
        },
        "spending_patterns": {"category_distribution": [], "discretionary_spend": 0, "essential_spend": 0},
        "unnecessary_expenses": [],
        "budget_optimization": [],
        "actionable_recommendations": [
            {
                "title": "Begin Adding Transactions",
                "type": "getting_started",
                "impact": "Unlocks AI Insights",
                "explanation": "Add your salary, daily expenses, and active goals to generate tailored financial recommendations.",
                "priority": "High"
            }
        ],
        "goal_recommendations": []
    }
