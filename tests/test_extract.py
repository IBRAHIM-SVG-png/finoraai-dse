"""
Unit tests for ETL Extraction stage.
"""
import os
import pytest
import pandas as pd
from etl.extract import extract_data, generate_synthetic_transactions


def test_extract_valid_csv(tmp_path):
    """Verifies standard CSV extraction and preserved column structure."""
    test_file = tmp_path / "sample_txn.csv"
    df_raw = pd.DataFrame([
        {
            "transaction_id": "TXN-TEST-1",
            "date": "2026-05-01",
            "description": "Tech Freelance",
            "category": "Freelance",
            "transaction_type": "Income",
            "amount": 1500.0,
            "payment_method": "UPI"
        },
        {
            "transaction_id": "TXN-TEST-2",
            "date": "2026-05-02",
            "description": "Grocery Mart",
            "category": "Food",
            "transaction_type": "Expense",
            "amount": 80.0,
            "payment_method": "Credit Card"
        }
    ])
    df_raw.to_csv(test_file, index=False)

    extracted = extract_data(file_path=str(test_file))
    assert len(extracted) == 2
    assert "transaction_id" in extracted.columns
    assert "amount" in extracted.columns


def test_extract_missing_columns(tmp_path):
    """Ensures extraction raises ValueError if critical columns are absent."""
    test_file = tmp_path / "bad_schema.csv"
    bad_df = pd.DataFrame([{"wrong_col": 123}])
    bad_df.to_csv(test_file, index=False)

    with pytest.raises(ValueError, match="missing required columns"):
        extract_data(file_path=str(test_file))


def test_extract_excel_support(tmp_path):
    """Verifies that extraction transparently supports Excel (.xlsx) spreadsheets."""
    test_file = tmp_path / "sample.xlsx"
    df_raw = pd.DataFrame([
        {
            "transaction_id": "TXN-EXCEL-1",
            "date": "2026-06-10",
            "description": "Dividend Payout",
            "category": "Investment",
            "transaction_type": "Income",
            "amount": 250.0,
            "payment_method": "Bank Transfer"
        }
    ])
    df_raw.to_excel(test_file, index=False)

    extracted = extract_data(file_path=str(test_file))
    assert len(extracted) == 1
    assert extracted.iloc[0]["transaction_id"] == "TXN-EXCEL-1"


def test_extract_synthetic_fallback(tmp_path):
    """Verifies that missing raw files automatically generate fallback dataset."""
    missing_file = tmp_path / "non_existent" / "transactions.csv"
    df = extract_data(file_path=str(missing_file))
    assert os.path.exists(missing_file)
    assert len(df) >= 500
