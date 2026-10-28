"""
Unit tests for ETL Transformation and Validation stage.
"""
import pytest
import pandas as pd
from etl.transform import transform_data, calculate_metrics


def test_transform_deduplication(tmp_path):
    """Ensures duplicate transaction_ids are quarantined into rejected dataset."""
    df_raw = pd.DataFrame([
        {
            "transaction_id": "TXN-DUP-1",
            "date": "2026-05-01",
            "description": "Salary",
            "category": "Salary",
            "transaction_type": "Income",
            "amount": 5000.0,
            "payment_method": "Bank Transfer"
        },
        {
            "transaction_id": "TXN-DUP-1",
            "date": "2026-05-01",
            "description": "Salary",
            "category": "Salary",
            "transaction_type": "Income",
            "amount": 5000.0,
            "payment_method": "Bank Transfer"
        }
    ])
    clean, rejected = transform_data(
        df_raw,
        save_output=False
    )
    assert len(clean) == 1
    assert len(rejected) == 1
    assert "Duplicate" in rejected.iloc[0]["rejection_reason"]


def test_transform_invalid_records_quarantine(tmp_path):
    """Verifies that invalid amounts, dates, and types are cleanly quarantined."""
    df_raw = pd.DataFrame([
        # Valid
        {"transaction_id": "TXN-1", "date": "2026-05-01", "description": "Coffee", "category": "Food", "transaction_type": "Expense", "amount": 5.0, "payment_method": "Card"},
        # Invalid date
        {"transaction_id": "TXN-2", "date": "invalid-date", "description": "Bad Date", "category": "Food", "transaction_type": "Expense", "amount": 10.0, "payment_method": "Card"},
        # Negative amount
        {"transaction_id": "TXN-3", "date": "2026-05-02", "description": "Negative", "category": "Food", "transaction_type": "Expense", "amount": -15.0, "payment_method": "Card"},
        # Zero amount
        {"transaction_id": "TXN-4", "date": "2026-05-03", "description": "Zero", "category": "Bills", "transaction_type": "Expense", "amount": 0.0, "payment_method": "Card"},
        # Missing ID
        {"transaction_id": "", "date": "2026-05-04", "description": "No ID", "category": "Bills", "transaction_type": "Expense", "amount": 20.0, "payment_method": "Card"},
        # Invalid transaction type
        {"transaction_id": "TXN-6", "date": "2026-05-05", "description": "Unknown Type", "category": "Bills", "transaction_type": "Transfer", "amount": 30.0, "payment_method": "Card"}
    ])

    clean, rejected = transform_data(df_raw, save_output=False)
    assert len(clean) == 1
    assert len(rejected) == 5
    reasons = " ".join(rejected["rejection_reason"].tolist())
    assert "Invalid date" in reasons
    assert "positive numeric" in reasons
    assert "Missing or empty transaction_id" in reasons
    assert "Invalid transaction_type" in reasons


def test_transform_metrics_calculation():
    """Verifies financial metrics calculations for income, expense, and savings rate."""
    clean_df = pd.DataFrame([
        {"transaction_id": "1", "date": "2026-05-01", "transaction_type": "Income", "amount": 10000.0},
        {"transaction_id": "2", "date": "2026-05-05", "transaction_type": "Expense", "amount": 4000.0},
        {"transaction_id": "3", "date": "2026-05-15", "transaction_type": "Expense", "amount": 2000.0}
    ])

    metrics = calculate_metrics(clean_df)
    assert metrics["total_income"] == 10000.0
    assert metrics["total_expenses"] == 6000.0
    assert metrics["net_savings"] == 4000.0
    assert metrics["savings_rate"] == 40.0
    assert metrics["transaction_count"] == 3
    assert len(metrics["monthly_summary"]) == 1


def test_transform_empty_data():
    """Ensures transform and metric calculation handle empty datasets gracefully."""
    empty_df = pd.DataFrame()
    clean, rejected = transform_data(empty_df, save_output=False)
    assert len(clean) == 0
    assert len(rejected) == 0

    metrics = calculate_metrics(clean)
    assert metrics["total_income"] == 0.0
    assert metrics["savings_rate"] == 0.0
