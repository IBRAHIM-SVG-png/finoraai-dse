import datetime
from flask import Blueprint, request, jsonify
from database import get_db
from routes.auth import token_required
from calculations.engine import calculate_goal_required_savings

goals_bp = Blueprint('goals', __name__)

@goals_bp.route('', methods=['GET'])
@token_required
def get_goals(current_user):
    user_id = current_user['id']

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, user_id, title, category, target_amount, current_amount, target_date, priority, notes, status, created_at
            FROM financial_goals
            WHERE user_id = ?
            ORDER BY target_date ASC, priority DESC
        """, (user_id,))
        raw_goals = cursor.fetchall()

        # Get user's current monthly savings rate to check feasibility
        today_month = datetime.date.today().strftime("%Y-%m")
        cursor.execute("""
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as monthly_surplus
            FROM transactions
            WHERE user_id = ? AND strftime('%Y-%m', date) = ?
        """, (user_id, today_month))
        surplus_row = cursor.fetchone()
        monthly_surplus = max(0.0, float(surplus_row['monthly_surplus'])) if surplus_row else 0.0

        goals_list = []
        total_target_all = 0.0
        total_saved_all = 0.0

        for row in raw_goals:
            g = dict(row)
            metrics = calculate_goal_required_savings(g['target_amount'], g['current_amount'], g['target_date'])
            
            # Risk determination: if required monthly savings exceeds current monthly surplus, flag risk
            is_at_risk = metrics['status'] == 'at_risk' or (metrics['required_monthly'] > monthly_surplus and metrics['remaining_amount'] > 0)
            status = 'achieved' if metrics['remaining_amount'] <= 0 else ('at_risk' if is_at_risk else 'active')

            g['metrics'] = metrics
            g['status'] = status
            g['is_at_risk'] = is_at_risk
            g['feasibility_note'] = (
                "Goal achieved!" if status == 'achieved'
                else ("Target date overdue or required savings exceeds monthly surplus." if is_at_risk
                else f"On track: Requires ₹{round(metrics['required_monthly'], 2):,}/mo.")
            )

            total_target_all += g['target_amount']
            total_saved_all += g['current_amount']
            goals_list.append(g)

    overall_progress = round((total_saved_all / total_target_all * 100.0), 1) if total_target_all > 0 else 100.0

    return jsonify({
        "goals": goals_list,
        "summary": {
            "total_goals": len(goals_list),
            "achieved_count": sum(1 for x in goals_list if x['status'] == 'achieved'),
            "at_risk_count": sum(1 for x in goals_list if x['is_at_risk']),
            "total_target_amount": round(total_target_all, 2),
            "total_current_amount": round(total_saved_all, 2),
            "overall_progress_pct": overall_progress,
            "monthly_surplus_available": round(monthly_surplus, 2)
        }
    }), 200

@goals_bp.route('', methods=['POST'])
@token_required
def create_goal(current_user):
    user_id = current_user['id']
    data = request.get_json() or {}

    title = data.get('title', '').strip()
    category = data.get('category', 'Other').strip()
    target_date = data.get('target_date', '').strip()
    priority = data.get('priority', 'Medium').strip()
    notes = data.get('notes', '').strip()

    try:
        target_amount = float(data.get('target_amount', 0))
        current_amount = float(data.get('current_amount', 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid target or current amount"}), 400

    if not title:
        return jsonify({"error": "Goal title is required"}), 400

    if target_amount <= 0:
        return jsonify({"error": "Target amount must be greater than 0"}), 400

    if not target_date:
        return jsonify({"error": "Target date is required"}), 400

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO financial_goals (user_id, title, category, target_amount, current_amount, target_date, priority, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, title, category, target_amount, current_amount, target_date, priority, notes))
        goal_id = cursor.lastrowid
        
        cursor.execute("SELECT * FROM financial_goals WHERE id = ?", (goal_id,))
        created = dict(cursor.fetchone())

    return jsonify({"message": "Financial goal created successfully", "goal": created}), 201

@goals_bp.route('/<int:goal_id>', methods=['PUT'])
@token_required
def update_goal(current_user, goal_id):
    user_id = current_user['id']
    data = request.get_json() or {}

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM financial_goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
        existing = cursor.fetchone()
        if not existing:
            return jsonify({"error": "Goal not found"}), 404

        title = data.get('title', existing['title']).strip()
        category = data.get('category', existing['category']).strip()
        target_date = data.get('target_date', existing['target_date']).strip()
        priority = data.get('priority', existing['priority']).strip()
        notes = data.get('notes', existing['notes']).strip()

        try:
            target_amount = float(data.get('target_amount', existing['target_amount']))
            current_amount = float(data.get('current_amount', existing['current_amount']))
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid amount values"}), 400

        cursor.execute("""
            UPDATE financial_goals
            SET title = ?, category = ?, target_amount = ?, current_amount = ?, target_date = ?, priority = ?, notes = ?
            WHERE id = ? AND user_id = ?
        """, (title, category, target_amount, current_amount, target_date, priority, notes, goal_id, user_id))

        cursor.execute("SELECT * FROM financial_goals WHERE id = ?", (goal_id,))
        updated = dict(cursor.fetchone())

    return jsonify({"message": "Goal updated successfully", "goal": updated}), 200

@goals_bp.route('/<int:goal_id>/deposit', methods=['POST'])
@token_required
def add_goal_deposit(current_user, goal_id):
    user_id = current_user['id']
    data = request.get_json() or {}
    try:
        deposit_amount = float(data.get('amount', 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid deposit amount"}), 400

    if deposit_amount <= 0:
        return jsonify({"error": "Deposit amount must be greater than 0"}), 400

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM financial_goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
        existing = cursor.fetchone()
        if not existing:
            return jsonify({"error": "Goal not found"}), 404

        new_total = float(existing['current_amount']) + deposit_amount
        status = 'achieved' if new_total >= float(existing['target_amount']) else existing['status']

        cursor.execute("""
            UPDATE financial_goals
            SET current_amount = ?, status = ?
            WHERE id = ? AND user_id = ?
        """, (new_total, status, goal_id, user_id))

        cursor.execute("SELECT * FROM financial_goals WHERE id = ?", (goal_id,))
        updated = dict(cursor.fetchone())

    return jsonify({"message": f"Successfully deposited ₹{deposit_amount:,} toward goal!", "goal": updated}), 200

@goals_bp.route('/<int:goal_id>', methods=['DELETE'])
@token_required
def delete_goal(current_user, goal_id):
    user_id = current_user['id']
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM financial_goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
        if not cursor.fetchone():
            return jsonify({"error": "Goal not found"}), 404

        cursor.execute("DELETE FROM financial_goals WHERE id = ? AND user_id = ?", (goal_id, user_id))

    return jsonify({"message": "Goal deleted successfully"}), 200
