import csv
import io
import datetime
from flask import Blueprint, request, jsonify, Response
from database import get_db
from routes.auth import token_required

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/analytics', methods=['GET'])
@token_required
def get_reports_analytics(current_user):
    user_id = current_user['id']
    timeframe = request.args.get('timeframe', 'month') # 'week', 'month', 'year'
    
    today = datetime.date.today()
    
    if timeframe == 'week':
        start_date = (today - datetime.timedelta(days=7)).isoformat()
    elif timeframe == 'year':
        start_date = (today - datetime.timedelta(days=365)).isoformat()
    else: # month
        start_date = (today - datetime.timedelta(days=30)).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()

        # Inflow / Outflow in period
        cursor.execute("""
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as period_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as period_expenses
            FROM transactions
            WHERE user_id = ? AND date >= ?
        """, (user_id, start_date))
        flow = cursor.fetchone()
        income = float(flow['period_income'])
        expenses = float(flow['period_expenses'])
        savings = income - expenses
        savings_rate = round((savings / income * 100.0), 1) if income > 0 else 0.0

        # Category Breakdown
        cursor.execute("""
            SELECT category, SUM(amount) as total, COUNT(*) as tx_count
            FROM transactions
            WHERE user_id = ? AND type = 'expense' AND date >= ?
            GROUP BY category
            ORDER BY total DESC
        """, (user_id, start_date))
        category_breakdown = [dict(row) for row in cursor.fetchall()]

        # Payment Methods Breakdown
        cursor.execute("""
            SELECT payment_method, SUM(amount) as total, COUNT(*) as count
            FROM transactions
            WHERE user_id = ? AND date >= ?
            GROUP BY payment_method
            ORDER BY total DESC
        """, (user_id, start_date))
        payment_methods = [dict(row) for row in cursor.fetchall()]

        # Daily Trend for charts
        cursor.execute("""
            SELECT 
                date,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
            FROM transactions
            WHERE user_id = ? AND date >= ?
            GROUP BY date
            ORDER BY date ASC
        """, (user_id, start_date))
        daily_trend = [dict(row) for row in cursor.fetchall()]

    return jsonify({
        "timeframe": timeframe,
        "start_date": start_date,
        "summary": {
            "period_income": round(income, 2),
            "period_expenses": round(expenses, 2),
            "period_savings": round(savings, 2),
            "savings_rate_pct": savings_rate
        },
        "category_breakdown": category_breakdown,
        "payment_methods": payment_methods,
        "trend": daily_trend
    }), 200

@reports_bp.route('/export-csv', methods=['GET'])
@token_required
def export_transactions_csv(current_user):
    user_id = current_user['id']
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT date, type, category, amount, description, payment_method, is_recurring
            FROM transactions
            WHERE user_id = ?
            ORDER BY date DESC, id DESC
        """, (user_id,))
        transactions = cursor.fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Type", "Category", "Amount", "Description", "Payment Method", "Is Recurring"])

    for tx in transactions:
        writer.writerow([
            tx['date'],
            tx['type'].capitalize(),
            tx['category'],
            tx['amount'],
            tx['description'],
            tx['payment_method'],
            "Yes" if tx['is_recurring'] else "No"
        ])

    csv_data = output.getvalue()
    filename = f"finance_transactions_{current_user['username']}_{datetime.date.today().strftime('%Y%m%d')}.csv"

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    )
