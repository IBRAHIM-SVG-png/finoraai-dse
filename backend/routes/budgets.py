import datetime
from flask import Blueprint, request, jsonify
from database import get_db
from routes.auth import token_required
from calculations.engine import calculate_budget_utilization

budgets_bp = Blueprint('budgets', __name__)

CATEGORY_PRACTICAL_TIPS = {
    "Food": [
        "Plan weekly meal prep to curb unplanned mid-week food delivery orders.",
        "Buy pantry essentials and grains in bulk rather than frequent daily micro-purchases.",
        "Set a weekly dining out limit (e.g., maximum once per weekend)."
    ],
    "Shopping": [
        "Institute a mandatory 48-hour cooling period before buying non-essential items.",
        "Unsubscribe from promotional flash-sale newsletters and push notifications.",
        "Audit existing wardrobe/gadgets before buying replacements."
    ],
    "Transport": [
        "Consolidate errands into single trips or carpool with colleagues.",
        "Consider public transit or metro for daily fixed peak-hour commutes.",
        "Review routine vehicle maintenance and tire pressure to optimize fuel mileage."
    ],
    "Bills": [
        "Audit recurring digital subscriptions (OTT platforms, apps) and cancel unused services.",
        "Check energy-efficiency settings on cooling/heating appliances to lower power bills.",
        "Compare mobile data plans and broadband packages for better bundled rates."
    ],
    "Entertainment": [
        "Look for student/free cultural events, local library services, or community sports.",
        "Rotate streaming platform subscriptions one at a time instead of paying for 4 simultaneously."
    ],
    "Healthcare": [
        "Opt for verified generic formulations over expensive brand-name medications.",
        "Leverage annual preventive health checkups included in insurance policies."
    ],
    "Education": [
        "Utilize free open-source textbooks, MOOCs (Coursera audit, edX, MIT OCW), and local libraries."
    ],
    "Other": [
        "Track miscellaneous petty cash expenditures daily to avoid invisible leaks."
    ]
}

@budgets_bp.route('', methods=['GET'])
@token_required
def get_budgets(current_user):
    user_id = current_user['id']
    month_year = request.args.get('month_year', datetime.date.today().strftime("%Y-%m"))

    with get_db() as conn:
        cursor = conn.cursor()

        # Fetch budgets set for this month
        cursor.execute("""
            SELECT id, category, monthly_limit, month_year, created_at
            FROM budgets
            WHERE user_id = ? AND month_year = ?
            ORDER BY category ASC
        """, (user_id, month_year))
        budget_rows = cursor.fetchall()

        # Fetch actual expenses per category for this month
        cursor.execute("""
            SELECT category, SUM(amount) as actual_spent
            FROM transactions
            WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
            GROUP BY category
        """, (user_id, month_year))
        actual_spending = {row['category']: float(row['actual_spent']) for row in cursor.fetchall()}

        # Merge budget targets with actuals
        budget_items = []
        total_budget = 0.0
        total_spent = 0.0
        warning_count = 0
        exceeded_count = 0

        for b in budget_rows:
            cat = b['category']
            limit = float(b['monthly_limit'])
            spent = actual_spending.get(cat, 0.0)
            
            util = calculate_budget_utilization(spent, limit)
            total_budget += limit
            total_spent += spent

            if util['is_warning']:
                warning_count += 1
            if util['is_exceeded']:
                exceeded_count += 1

            budget_items.append({
                "id": b['id'],
                "category": cat,
                "monthly_limit": limit,
                "actual_spent": spent,
                "remaining": util['remaining'],
                "percentage": util['percentage'],
                "is_warning": util['is_warning'],
                "is_exceeded": util['is_exceeded'],
                "status": util['status'],
                "practical_tips": CATEGORY_PRACTICAL_TIPS.get(cat, CATEGORY_PRACTICAL_TIPS["Other"])
            })

    overall_util = calculate_budget_utilization(total_spent, total_budget)

    return jsonify({
        "month_year": month_year,
        "budgets": budget_items,
        "summary": {
            "total_budget": round(total_budget, 2),
            "total_spent": round(total_spent, 2),
            "total_remaining": overall_util['remaining'],
            "overall_percentage": overall_util['percentage'],
            "warning_count": warning_count,
            "exceeded_count": exceeded_count,
            "status": overall_util['status']
        }
    }), 200

@budgets_bp.route('', methods=['POST'])
@token_required
def set_or_update_budget(current_user):
    user_id = current_user['id']
    data = request.get_json() or {}

    category = data.get('category', '').strip()
    month_year = data.get('month_year', datetime.date.today().strftime("%Y-%m")).strip()
    try:
        monthly_limit = float(data.get('monthly_limit', 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid monthly limit"}), 400

    if not category:
        return jsonify({"error": "Category is required"}), 400

    if monthly_limit <= 0:
        return jsonify({"error": "Budget limit must be greater than 0"}), 400

    with get_db() as conn:
        cursor = conn.cursor()
        # Upsert budget
        cursor.execute("""
            INSERT INTO budgets (user_id, category, monthly_limit, month_year)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, category, month_year)
            DO UPDATE SET monthly_limit = excluded.monthly_limit
        """, (user_id, category, monthly_limit, month_year))
        
        cursor.execute("""
            SELECT id, category, monthly_limit, month_year, created_at
            FROM budgets
            WHERE user_id = ? AND category = ? AND month_year = ?
        """, (user_id, category, month_year))
        saved_budget = dict(cursor.fetchone())

    return jsonify({"message": "Budget saved successfully", "budget": saved_budget}), 200

@budgets_bp.route('/<int:budget_id>', methods=['DELETE'])
@token_required
def delete_budget(current_user, budget_id):
    user_id = current_user['id']
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM budgets WHERE id = ? AND user_id = ?", (budget_id, user_id))
        if not cursor.fetchone():
            return jsonify({"error": "Budget not found"}), 404

        cursor.execute("DELETE FROM budgets WHERE id = ? AND user_id = ?", (budget_id, user_id))

    return jsonify({"message": "Budget deleted successfully"}), 200
