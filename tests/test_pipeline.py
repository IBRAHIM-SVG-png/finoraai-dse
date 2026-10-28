"""
Integration tests for the complete ETL pipeline orchestrator.
"""
import os
import pytest
import pandas as pd
from sqlalchemy import create_engine
from etl.pipeline import run_etl_pipeline
from database.db_connection import init_db


def test_pipeline_end_to_end_with_sqlite(tmp_path):
    """
    Executes the entire Extract -> Transform -> Validate -> Load flow
    using isolated temporary CSV files and in-memory SQLite engine.
    """
    raw_file = tmp_path / "raw.csv"
    cleaned_file = tmp_path / "clean.csv"
    rejected_file = tmp_path / "rejected.csv"

    # Create raw sample with 1 valid and 1 invalid record
    raw_df = pd.DataFrame([
        {
            "transaction_id": "TXN-PIPE-1",
            "date": "2026-05-01",
            "description": "Freelance Design",
            "category": "Freelance",
            "transaction_type": "Income",
            "amount": 2000.0,
            "payment_method": "UPI"
        },
        {
            "transaction_id": "TXN-PIPE-BAD",
            "date": "bad-date",
            "description": "Corrupted",
            "category": "Food",
            "transaction_type": "Expense",
            "amount": 50.0,
            "payment_method": "Card"
        }
    ])
    raw_df.to_csv(raw_file, index=False)

    # In-memory test engine
    engine = create_engine("sqlite:///:memory:", echo=False)
    init_db(engine)

    result = run_etl_pipeline(
        raw_path=str(raw_file),
        cleaned_path=str(cleaned_file),
        rejected_path=str(rejected_file),
        db_engine=engine
    )

    assert result["extracted_records"] == 2
    assert result["transformed_records"] == 1
    assert result["rejected_records"] == 1
    assert result["loaded_records"] == 1
    assert result["database_connected"] is True
    assert os.path.exists(cleaned_file)
    assert os.path.exists(rejected_file)
    assert result["metrics"]["total_income"] == 2000.0
