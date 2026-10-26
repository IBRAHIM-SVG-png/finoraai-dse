# Financial Calculation Engine

from datetime import datetime, date
import math

def calculate_savings_rate(income: float, expenses: float) -> float:
    """
    Calculates the savings rate as a percentage: ((income - expenses) / income) * 100
    Handles edge cases when income <= 0.
    """
    if income <= 0:
        return 0.0
    savings = income - expenses
    rate = (savings / income) * 100.0
    return round(max(-100.0, min(100.0, rate)), 2)

def calculate_budget_utilization(actual_spent: float, monthly_limit: float) -> dict:
    """
    Computes budget utilization percentage and alert flags:
    - 80% threshold warning
    - 100% threshold exceeded
    """
    if monthly_limit <= 0:
        percentage = 100.0 if actual_spent > 0 else 0.0
    else:
        percentage = (actual_spent / monthly_limit) * 100.0
        
    remaining = monthly_limit - actual_spent
    is_warning = percentage >= 80.0 and percentage < 100.0
    is_exceeded = percentage >= 100.0
    
    return {
        "monthly_limit": round(monthly_limit, 2),
        "actual_spent": round(actual_spent, 2),
        "remaining": round(remaining, 2),
        "percentage": round(percentage, 1),
        "is_warning": is_warning,
        "is_exceeded": is_exceeded,
        "status": "exceeded" if is_exceeded else ("warning" if is_warning else "healthy")
    }

def calculate_financial_health_score(
    monthly_income: float,
    monthly_expenses: float,
    total_savings: float,
    budget_adherence_pct: float = 100.0,
    goals_on_track_ratio: float = 1.0
) -> dict:
    """
    Calculates an explainable financial health score from 0 to 100.
    Components:
    1. Savings Rate Score (Max 35 pts): 20%+ savings rate gets full points.
    2. Emergency Runway Score (Max 25 pts): Savings / Expenses >= 6 months gets full points.
    3. Budget Adherence Score (Max 20 pts): Staying within monthly budgets.
    4. Goal Progress Score (Max 20 pts): Progress and on-track ratio for user goals.
    """
    # 1. Savings rate component (35 pts)
    savings_rate = calculate_savings_rate(monthly_income, monthly_expenses)
    if savings_rate >= 30:
        savings_score = 35.0
    elif savings_rate >= 20:
        savings_score = 30.0
    elif savings_rate >= 10:
        savings_score = 20.0
    elif savings_rate > 0:
        savings_score = 10.0
    else:
        savings_score = 0.0

    # 2. Emergency runway component (25 pts)
    # Target: 6 months of living expenses in savings
    if monthly_expenses > 0:
        runway_months = total_savings / monthly_expenses
    else:
        runway_months = 6.0 if total_savings > 0 else 0.0

    if runway_months >= 6.0:
        runway_score = 25.0
    elif runway_months >= 3.0:
        runway_score = 18.0
    elif runway_months >= 1.0:
        runway_score = 10.0
    elif runway_months > 0:
        runway_score = 5.0
    else:
        runway_score = 0.0

    # 3. Budget adherence component (20 pts)
    # adherence_pct: 100 means within budget, >100 means over budget
    if budget_adherence_pct <= 80:
        budget_score = 20.0
    elif budget_adherence_pct <= 95:
        budget_score = 17.0
    elif budget_adherence_pct <= 100:
        budget_score = 14.0
    elif budget_adherence_pct <= 115:
        budget_score = 7.0
    else:
        budget_score = 2.0

    # 4. Goals on-track component (20 pts)
    goal_score = round(min(1.0, max(0.0, goals_on_track_ratio)) * 20.0, 1)

    total_score = round(savings_score + runway_score + budget_score + goal_score)
    total_score = max(0, min(100, total_score))

    if total_score >= 85:
        grade = "Excellent"
        status_color = "emerald"
        summary = "Your financial position is robust with strong savings, healthy runway, and disciplined spending."
    elif total_score >= 70:
        grade = "Good"
        status_color = "blue"
        summary = "Solid financial foundation. Focus on optimizing non-essential expenses and boosting emergency buffer."
    elif total_score >= 50:
        grade = "Fair"
        status_color = "amber"
        summary = "Moderate financial stability. Budget overruns or low savings rate need attention."
    else:
        grade = "Needs Attention"
        status_color = "rose"
        summary = "High expense ratio or depleted savings buffer. Immediate budget adjustments recommended."

    return {
        "score": total_score,
        "grade": grade,
        "status_color": status_color,
        "summary": summary,
        "runway_months": round(runway_months, 1),
        "breakdown": {
            "savings_rate_score": {"points": savings_score, "max": 35, "label": f"Savings Rate ({savings_rate}%)"},
            "emergency_runway_score": {"points": runway_score, "max": 25, "label": f"Emergency Runway ({round(runway_months, 1)} mos)"},
            "budget_adherence_score": {"points": budget_score, "max": 20, "label": f"Budget Discipline ({round(budget_adherence_pct, 1)}% used)"},
            "goal_progress_score": {"points": goal_score, "max": 20, "label": "Goals on Track"}
        }
    }

def calculate_goal_required_savings(target_amount: float, current_amount: float, target_date_str: str) -> dict:
    """
    Computes months remaining and required monthly savings to achieve a goal.
    Alerts if target date has passed or monthly requirement is unfeasible.
    """
    today = date.today()
    try:
        target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        target_date = today

    months_remaining = (target_date.year - today.year) * 12 + (target_date.month - today.month)
    if target_date.day < today.day and months_remaining > 0:
        months_remaining = max(1, months_remaining)

    remaining_amount = max(0.0, target_amount - current_amount)
    progress_pct = round((current_amount / target_amount) * 100.0, 1) if target_amount > 0 else 100.0

    if remaining_amount <= 0:
        required_monthly = 0.0
        status = "achieved"
    elif months_remaining <= 0:
        required_monthly = remaining_amount
        status = "at_risk"
    else:
        required_monthly = remaining_amount / months_remaining
        status = "active"

    return {
        "target_amount": round(target_amount, 2),
        "current_amount": round(current_amount, 2),
        "remaining_amount": round(remaining_amount, 2),
        "months_remaining": max(0, months_remaining),
        "required_monthly": round(required_monthly, 2),
        "progress_percentage": min(100.0, progress_pct),
        "status": status
    }
