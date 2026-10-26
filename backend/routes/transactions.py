import datetime
from flask import Blueprint, request, jsonify
from database import get_db
from routes.auth import token_required
from calculations.engine import calculate_savings_rate, calculate_financial_health_score

transactions_bp = Blueprint('transactions', __name__)

VALID_CATEGORIES = [
    "Food", "Transport", "Education", "Shopping", "Bills", 
    "Healthcare", "Salary", "Investment", "Entertainment", "Freelance", "Other"
]

@transactions_bp.route('', methods=['GET'])
@token_required
def get_transactions(current_user):
    user_id = current_user['id']
    
    # Query parameters
    tx_type = request.args.get('type') # 'income', 'expense', or None
    category = request.args.get('category')
    search = request.args.get('search', '').strip()
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    sort_by = request.args.get('sort_by', 'date') # date, amount
    sort_dir = request.args.get('sort_dir', 'DESC').upper()
    if sort_dir not in ['ASC', 'DESC']:
        sort_dir = 'DESC'
    
    limit = int(request.args.get('limit', 100))
    offset = int(request.args.get('offset', 0))

    query = "SELECT * FROM transactions WHERE user_id = ?"
    params = [user_id]

    if tx_type:
        query += " AND type = ?"
        params.append(tx_type)

    if category:
        query += " AND category = ?"
        params.append(category)

    if search:
        query += " AND (description LIKE ? OR category LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    if start_date:
        query += " AND date >= ?"
        params.append(start_date)

    if end_date:
        query += " AND date <= ?"
        params.append(end_date)

    order_col = 'date' if sort_by == 'date' else 'amount'
    query += f" ORDER BY {order_col} {sort_dir}, id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        transactions = [dict(row) for row in cursor.fetchall()]

        # Total count
        count_query = "SELECT COUNT(*) as total FROM transactions WHERE user_id = ?"
        cursor.execute(count_query, [user_id])
        total_count = cursor.fetchone()['total']

    return jsonify({
        "transactions": transactions,
        "total": total_count,
        "limit": limit,
        "offset": offset
    }), 200

@transactions_bp.route('', methods=['POST'])
@token_required
def add_transaction(current_user):
    user_id = current_user['id']
    data = request.get_json() or {}

    date = data.get('date', datetime.date.today().isoformat()).strip()
    try:
        amount = float(data.get('amount', 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount specified"}), 400

    if amount <= 0:
        return jsonify({"error": "Transaction amount must be strictly greater than 0"}), 400

    category = data.get('category', 'Other').strip()
    tx_type = data.get('type', 'expense').strip().lower()
    if tx_type not in ['income', 'expense']:
        return jsonify({"error": "Type must be either 'income' or 'expense'"}), 400

    description = data.get('description', '').strip()
    payment_method = data.get('payment_method', 'UPI').strip()
    is_recurring = 1 if data.get('is_recurring') else 0

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO transactions (user_id, date, amount, category, type, description, payment_method, is_recurring)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, date, amount, category, tx_type, description, payment_method, is_recurring))
        new_id = cursor.lastrowid
        
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (new_id,))
        created_tx = dict(cursor.fetchone())

    return jsonify({"message": "Transaction added successfully", "transaction": created_tx}), 201

@transactions_bp.route('/<int:tx_id>', methods=['PUT'])
@token_required
def update_transaction(current_user, tx_id):
    user_id = current_user['id']
    data = request.get_json() or {}

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id))
        existing = cursor.fetchone()
        if not existing:
            return jsonify({"error": "Transaction not found"}), 404

        date = data.get('date', existing['date'])
        try:
            amount = float(data.get('amount', existing['amount']))
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid amount"}), 400

        if amount <= 0:
            return jsonify({"error": "Amount must be greater than 0"}), 400

        category = data.get('category', existing['category'])
        tx_type = data.get('type', existing['type']).lower()
        description = data.get('description', existing['description'])
        payment_method = data.get('payment_method', existing['payment_method'])
        is_recurring = 1 if data.get('is_recurring', existing['is_recurring']) else 0

        cursor.execute("""
            UPDATE transactions
            SET date = ?, amount = ?, category = ?, type = ?, description = ?, payment_method = ?, is_recurring = ?
            WHERE id = ? AND user_id = ?
        """, (date, amount, category, tx_type, description, payment_method, is_recurring, tx_id, user_id))

        cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
        updated_tx = dict(cursor.fetchone())

    return jsonify({"message": "Transaction updated successfully", "transaction": updated_tx}), 200

@transactions_bp.route('/<int:tx_id>', methods=['DELETE'])
@token_required
def delete_transaction(current_user, tx_id):
    user_id = current_user['id']
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id))
        if not cursor.fetchone():
            return jsonify({"error": "Transaction not found"}), 404

        cursor.execute("DELETE FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id))

    return jsonify({"message": "Transaction deleted successfully"}), 200

@transactions_bp.route('/summary', methods=['GET'])
@token_required
def get_dashboard_summary(current_user):
    user_id = current_user['id']
    today = datetime.date.today()
    current_month_str = today.strftime("%Y-%m")
    current_year_str = str(today.year)

    with get_db() as conn:
        cursor = conn.cursor()

        # All-time Total Balance
        cursor.execute("""
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
            FROM transactions WHERE user_id = ?
        """, (user_id,))
        all_time = cursor.fetchone()
        all_time_income = float(all_time['total_income'])
        all_time_expenses = float(all_time['total_expenses'])
        total_balance = all_time_income - all_time_expenses

        # Current Month Stats
        cursor.execute("""
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as month_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as month_expenses
            FROM transactions 
            WHERE user_id = ? AND strftime('%Y-%m', date) = ?
        """, (user_id, current_month_str))
        monthly = cursor.fetchone()
        month_income = float(monthly['month_income'])
        month_expenses = float(monthly['month_expenses'])
        month_savings = month_income - month_expenses
        savings_rate = calculate_savings_rate(month_income, month_expenses)

        # Current Year Stats
        cursor.execute("""
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as year_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as year_expenses
            FROM transactions 
            WHERE user_id = ? AND strftime('%Y', date) = ?
        """, (user_id, current_year_str))
        yearly = cursor.fetchone()
        year_income = float(yearly['year_income'])
        year_expenses = float(yearly['year_expenses'])

        # Monthly Spending by Category (Current Month)
        cursor.execute("""
            SELECT category, SUM(amount) as total
            FROM transactions
            WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
            GROUP BY category
            ORDER BY total DESC
        """, (user_id, current_month_str))
        category_spending = [dict(row) for row in cursor.fetchall()]

        # Budget Utilization for current month
        cursor.execute("""
            SELECT COALESCE(SUM(monthly_limit), 0) as total_budget
            FROM budgets
            WHERE user_id = ? AND month_year = ?
        """, (user_id, current_month_str))
        budget_row = cursor.fetchone()
        total_monthly_budget = float(budget_row['total_budget'])
        budget_utilization_pct = round((month_expenses / total_monthly_budget * 100.0), 1) if total_monthly_budget > 0 else 0.0

        # Recent 6 transactions
        cursor.execute("""
            SELECT * FROM transactions
            WHERE user_id = ?
            ORDER BY date DESC, id DESC
            LIMIT 6
        """, (user_id,))
        recent_transactions = [dict(row) for row in cursor.fetchall()]

        # Past 6 Months Cash Flow Trend (for bar/line chart)
        cursor.execute("""
            SELECT 
                strftime('%Y-%m', date) as month_period,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
            FROM transactions
            WHERE user_id = ? AND date >= date('now', '-5 months', 'start of month')
            GROUP BY month_period
            ORDER BY month_period ASC
        """, (user_id,))
        monthly_trend = [dict(row) for row in cursor.fetchall()]

        # Goals count & completion
        cursor.execute("""
            SELECT 
                COUNT(*) as total_goals,
                COALESCE(SUM(CASE WHEN current_amount >= target_amount THEN 1 ELSE 0 END), 0) as achieved_goals
            FROM financial_goals
            WHERE user_id = ?
        """, (user_id,))
        goals_stat = cursor.fetchone()
        total_goals = goals_stat['total_goals']
        achieved_goals = goals_stat['achieved_goals']
        goal_ratio = (achieved_goals / total_goals) if total_goals > 0 else 1.0

        # Financial Health Score
        health = calculate_financial_health_score(
            monthly_income=month_income if month_income > 0 else (all_time_income / 6 if all_time_income > 0 else 0),
            monthly_expenses=month_expenses if month_expenses > 0 else (all_time_expenses / 6 if all_time_expenses > 0 else 0),
            total_savings=max(0.0, total_balance),
            budget_adherence_pct=budget_utilization_pct if total_monthly_budget > 0 else 85.0,
            goals_on_track_ratio=goal_ratio
        )

    return jsonify({
        "metrics": {
            "total_balance": round(total_balance, 2),
            "monthly_income": round(month_income, 2),
            "monthly_expenses": round(month_expenses, 2),
            "monthly_savings": round(month_savings, 2),
            "savings_rate_pct": savings_rate,
            "total_savings": round(max(0.0, total_balance), 2),
            "total_monthly_budget": round(total_monthly_budget, 2),
            "budget_utilization_pct": budget_utilization_pct,
            "yearly_income": round(year_income, 2),
            "yearly_expenses": round(year_expenses, 2)
        },
        "health_score": health,
        "recent_transactions": recent_transactions,
        "category_spending": category_spending,
        "monthly_trend": monthly_trend
    }), 200
