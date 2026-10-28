"""
Financial Math Engine Tests (Savings rate, budget utilization, health score, simulation).
"""
import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_dir = str(Path(__file__).resolve().parent.parent / "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import unittest
from calculations.engine import (
    calculate_savings_rate,
    calculate_budget_utilization,
    calculate_financial_health_score,
    calculate_goal_required_savings
)
from calculations.simulator import run_simulation
from calculations.scenarios import compare_what_if_scenarios


class TestFinancialCalculations(unittest.TestCase):

    def test_savings_rate(self):
        # 60,000 income, 36,000 expense -> 40%
        self.assertEqual(calculate_savings_rate(60000, 36000), 40.0)
        # 0 income -> 0%
        self.assertEqual(calculate_savings_rate(0, 1000), 0.0)
        # Expenses exceed income -> clamped/negative
        rate = calculate_savings_rate(50000, 60000)
        self.assertEqual(rate, -20.0)

    def test_budget_utilization(self):
        # Normal (50%)
        res1 = calculate_budget_utilization(5000, 10000)
        self.assertEqual(res1["percentage"], 50.0)
        self.assertFalse(res1["is_warning"])
        self.assertFalse(res1["is_exceeded"])

        # Warning threshold (85%)
        res2 = calculate_budget_utilization(8500, 10000)
        self.assertEqual(res2["percentage"], 85.0)
        self.assertTrue(res2["is_warning"])
        self.assertFalse(res2["is_exceeded"])

        # Exceeded threshold (110%)
        res3 = calculate_budget_utilization(11000, 10000)
        self.assertEqual(res3["percentage"], 110.0)
        self.assertFalse(res3["is_warning"])
        self.assertTrue(res3["is_exceeded"])

    def test_financial_health_score(self):
        res = calculate_financial_health_score(
            monthly_income=70000,
            monthly_expenses=35000,
            total_savings=250000,
            budget_adherence_pct=85.0,
            goals_on_track_ratio=1.0
        )
        self.assertIn("score", res)
        self.assertIn("grade", res)
        self.assertTrue(0 <= res["score"] <= 100)
        self.assertEqual(res["grade"], "Excellent")

    def test_future_simulator_cash_vs_invested(self):
        params = {
            "current_savings": 100000.0,
            "monthly_income": 60000.0,
            "monthly_expenses": 40000.0,
            "income_growth_pct": 0.0,
            "expense_growth_pct": 0.0,
            "monthly_contribution": 0.0,
            "investment_return_pct": 10.0,
            "duration_months": 12,
            "planned_expenses": [{"month": 6, "amount": 20000.0, "description": "Trip"}],
            "goal_amount": 300000.0
        }
        sim = run_simulation(params)
        summary = sim["summary"]
        self.assertEqual(summary["final_cash_savings"], 320000.0)
        self.assertGreater(summary["final_invested_wealth"], summary["final_cash_savings"])
        self.assertEqual(len(sim["timeline"]), 12)
        self.assertIsNotNone(summary["goal_probability_pct"])
        self.assertTrue(0 <= summary["goal_probability_pct"] <= 100)

    def test_what_if_scenarios(self):
        params = {
            "current_savings": 50000.0,
            "monthly_income": 50000.0,
            "monthly_expenses": 30000.0,
            "income_growth_pct": 0.0,
            "expense_growth_pct": 0.0,
            "monthly_contribution": 0.0,
            "investment_return_pct": 6.0,
            "duration_months": 12,
            "boost_savings_amt": 2000.0,
            "emergency_expense_amt": 40000.0
        }
        comparison = compare_what_if_scenarios(params)
        scenarios = {s["id"]: s for s in comparison["scenarios"]}
        baseline_final = scenarios["baseline"]["final_cash"]
        exp_cut_final = scenarios["reduce_expenses_10"]["final_cash"]
        savings_boost_final = scenarios["increase_savings_boost"]["final_cash"]
        emergency_final = scenarios["emergency_shock"]["final_cash"]

        self.assertGreater(exp_cut_final, baseline_final)
        self.assertGreater(savings_boost_final, baseline_final)
        self.assertLess(emergency_final, baseline_final)


if __name__ == "__main__":
    unittest.main()
