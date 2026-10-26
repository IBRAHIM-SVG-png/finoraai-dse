import json
from flask import Blueprint, request, jsonify
from database import get_db
from routes.auth import token_required
from calculations.simulator import run_simulation
from calculations.scenarios import compare_what_if_scenarios

simulation_bp = Blueprint('simulation', __name__)

@simulation_bp.route('/run', methods=['POST'])
@token_required
def simulate_future(current_user):
    data = request.get_json() or {}
    
    # Extract parameters with safe defaults
    params = {
        "current_savings": float(data.get("current_savings", 0.0)),
        "monthly_income": float(data.get("monthly_income", 0.0)),
        "monthly_expenses": float(data.get("monthly_expenses", 0.0)),
        "income_growth_pct": float(data.get("income_growth_pct", 0.0)),
        "expense_growth_pct": float(data.get("expense_growth_pct", 0.0)),
        "monthly_contribution": float(data.get("monthly_contribution", 0.0)),
        "planned_expenses": data.get("planned_expenses", []),
        "goal_amount": float(data.get("goal_amount", 0.0)),
        "investment_return_pct": float(data.get("investment_return_pct", 0.0)),
        "duration_months": int(data.get("duration_months", 12))
    }

    try:
        results = run_simulation(params)
        return jsonify({"success": True, "data": results}), 200
    except Exception as e:
        return jsonify({"error": f"Simulation failed: {str(e)}"}), 500

@simulation_bp.route('/what-if', methods=['POST'])
@token_required
def run_what_if(current_user):
    data = request.get_json() or {}
    params = {
        "current_savings": float(data.get("current_savings", 50000.0)),
        "monthly_income": float(data.get("monthly_income", 50000.0)),
        "monthly_expenses": float(data.get("monthly_expenses", 30000.0)),
        "income_growth_pct": float(data.get("income_growth_pct", 0.0)),
        "expense_growth_pct": float(data.get("expense_growth_pct", 0.0)),
        "monthly_contribution": float(data.get("monthly_contribution", 0.0)),
        "investment_return_pct": float(data.get("investment_return_pct", 6.0)),
        "duration_months": int(data.get("duration_months", 12)),
        "boost_savings_amt": float(data.get("boost_savings_amt", 2000.0)),
        "emergency_expense_amt": float(data.get("emergency_expense_amt", 50000.0)),
        "planned_expenses": data.get("planned_expenses", [])
    }

    try:
        comparison = compare_what_if_scenarios(params)
        return jsonify({"success": True, "data": comparison}), 200
    except Exception as e:
        return jsonify({"error": f"What-If comparison failed: {str(e)}"}), 500

@simulation_bp.route('/scenarios', methods=['GET'])
@token_required
def get_saved_scenarios(current_user):
    user_id = current_user['id']
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, user_id, name, current_savings, monthly_income, monthly_expenses,
                   income_growth_pct, expense_growth_pct, monthly_contribution,
                   planned_expenses_json, goal_amount, investment_return_pct, duration_months, created_at
            FROM simulation_scenarios
            WHERE user_id = ?
            ORDER BY id DESC
        """, (user_id,))
        rows = cursor.fetchall()

        scenarios = []
        for r in rows:
            item = dict(r)
            try:
                item['planned_expenses'] = json.loads(item.get('planned_expenses_json') or '[]')
            except Exception:
                item['planned_expenses'] = []
            scenarios.append(item)

    return jsonify({"scenarios": scenarios}), 200

@simulation_bp.route('/save', methods=['POST'])
@token_required
def save_scenario(current_user):
    user_id = current_user['id']
    data = request.get_json() or {}

    name = data.get('name', 'My Simulation Scenario').strip()
    current_savings = float(data.get('current_savings', 0.0))
    monthly_income = float(data.get('monthly_income', 0.0))
    monthly_expenses = float(data.get('monthly_expenses', 0.0))
    income_growth_pct = float(data.get('income_growth_pct', 0.0))
    expense_growth_pct = float(data.get('expense_growth_pct', 0.0))
    monthly_contribution = float(data.get('monthly_contribution', 0.0))
    planned_expenses = data.get('planned_expenses', [])
    goal_amount = float(data.get('goal_amount', 0.0))
    investment_return_pct = float(data.get('investment_return_pct', 0.0))
    duration_months = int(data.get('duration_months', 12))

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO simulation_scenarios (
                user_id, name, current_savings, monthly_income, monthly_expenses,
                income_growth_pct, expense_growth_pct, monthly_contribution,
                planned_expenses_json, goal_amount, investment_return_pct, duration_months
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, name, current_savings, monthly_income, monthly_expenses,
            income_growth_pct, expense_growth_pct, monthly_contribution,
            json.dumps(planned_expenses), goal_amount, investment_return_pct, duration_months
        ))
        scenario_id = cursor.lastrowid

    return jsonify({"message": "Scenario saved successfully", "scenario_id": scenario_id}), 201

@simulation_bp.route('/scenarios/<int:scenario_id>', methods=['DELETE'])
@token_required
def delete_saved_scenario(current_user, scenario_id):
    user_id = current_user['id']
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM simulation_scenarios WHERE id = ? AND user_id = ?", (scenario_id, user_id))
    return jsonify({"message": "Scenario removed"}), 200
