from flask import Blueprint, request, jsonify
from database import get_db
from routes.auth import token_required
from calculations.ai_engine import analyze_user_finances

ai_bp = Blueprint('ai_assistant', __name__)

@ai_bp.route('/insights', methods=['GET'])
@token_required
def get_ai_insights(current_user):
    user_id = current_user['id']

    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Fetch transactions
        cursor.execute("""
            SELECT id, date, amount, category, type, description, payment_method
            FROM transactions
            WHERE user_id = ?
            ORDER BY date DESC
        """, (user_id,))
        transactions = [dict(row) for row in cursor.fetchall()]

        # 2. Fetch current budgets
        cursor.execute("""
            SELECT id, category, monthly_limit, month_year
            FROM budgets
            WHERE user_id = ?
        """, (user_id,))
        budgets = [dict(row) for row in cursor.fetchall()]

        # 3. Fetch goals
        cursor.execute("""
            SELECT id, title, category, target_amount, current_amount, target_date, status
            FROM financial_goals
            WHERE user_id = ?
        """, (user_id,))
        goals = [dict(row) for row in cursor.fetchall()]

    insights = analyze_user_finances(transactions, budgets, goals, current_user)
    return jsonify({"success": True, "data": insights}), 200

@ai_bp.route('/ask', methods=['POST'])
@token_required
def ask_ai_advisor(current_user):
    data = request.get_json() or {}
    question = data.get('question', '').strip()
    
    if not question:
        return jsonify({"error": "Please provide a question"}), 400

    user_id = current_user['id']
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_inc,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_exp
            FROM transactions
            WHERE user_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
        """, (user_id,))
        row = cursor.fetchone()
        inc = float(row['total_inc'])
        exp = float(row['total_exp'])
        surplus = inc - exp
        savings_rate = (surplus / inc * 100.0) if inc > 0 else 0.0

        cursor.execute("""
            SELECT category, SUM(amount) as cat_spent
            FROM transactions
            WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
            GROUP BY category
            ORDER BY cat_spent DESC
            LIMIT 3
        """, (user_id,))
        top_cats = [dict(r) for r in cursor.fetchall()]

    # Intelligent grounded response generation
    q_lower = question.lower()
    
    if "save" in q_lower or "savings" in q_lower or "how much" in q_lower:
        advice = (
            f"Based on your current monthly records, your income is ₹{inc:,.2f} and expenses are ₹{exp:,.2f}, "
            f"giving a net monthly savings surplus of ₹{surplus:,.2f} (Savings Rate: {round(savings_rate, 1)}%). "
        )
        if savings_rate < 20:
            target_20 = inc * 0.20
            diff = target_20 - surplus
            advice += f"To reach the recommended 20% savings threshold, target saving ₹{round(target_20, 2):,} per month (an increase of ₹{round(diff, 2):,})."
        else:
            advice += "You are meeting the healthy 20%+ savings benchmark! We recommend allocating 70% of this surplus toward active goals and 30% into an emergency buffer."
            
    elif "budget" in q_lower or "cut" in q_lower or "reduce" in q_lower:
        if top_cats:
            cat_list = ", ".join([f"{c['category']} (₹{c['cat_spent']:,.0f})" for c in top_cats])
            top_cat = top_cats[0]
            cut_potential = top_cat['cat_spent'] * 0.15
            advice = (
                f"Your highest spending categories this month are {cat_list}. "
                f"If you optimize {top_cat['category']} by 15%, you could free up ₹{round(cut_potential, 2):,} monthly without severely affecting your lifestyle."
            )
        else:
            advice = "You have very few logged expenses this month. Start by establishing hard budget limits in Food, Shopping, and Transport."

    elif "invest" in q_lower or "future" in q_lower or "return" in q_lower:
        advice = (
            f"With your monthly surplus of ₹{surplus:,.2f}, compound investing can dramatically accelerate wealth creation. "
            "For instance, investing ₹5,000 monthly in a diversified index fund or SIP yielding an assumed 10% annual return could grow to approx ₹10.3 Lakhs in 10 years, compared to ₹6 Lakhs in liquid cash. "
            "Please note: Market investments carry risk and returns are variable."
        )

    elif "emergency" in q_lower or "health" in q_lower:
        target_emergency = exp * 6
        advice = (
            f"A standard emergency fund should cover 3 to 6 months of essential living expenses (approximately ₹{round(target_emergency, 2):,} based on your monthly outflow). "
            "Keep this fund in a high-yield liquid savings account or short-term fixed deposit for immediate liquidity."
        )

    else:
        top_cat_name = top_cats[0]['category'] if top_cats else "Discretionary"
        advice = (
            f"Looking at your overall financial profile: Your monthly inflow is ₹{inc:,.0f} and outflow is ₹{exp:,.0f} (Net: ₹{surplus:,.0f}). "
            f"Your primary expense driver is {top_cat_name}. Maintaining a strict 50/30/20 budget division (50% Needs, 30% Wants, 20% Savings) will keep you financially secure."
        )

    return jsonify({
        "question": question,
        "answer": advice,
        "context": {
            "monthly_income": inc,
            "monthly_expenses": exp,
            "net_surplus": surplus,
            "savings_rate_pct": round(savings_rate, 1)
        }
    }), 200
