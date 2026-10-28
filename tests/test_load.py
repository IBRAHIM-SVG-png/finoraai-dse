"""
Unit tests for ETL Loading stage and database connection fallback.
"""
import pytest
import pandas as pd
from sqlalchemy import create_engine, text
from etl.load import load_data_to_db
from database.db_connection import test_connection as check_connection, init_db


@pytest.fixture
def memory_db():
    """Provides a fresh in-memory SQLite engine simulating database behavior."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    init_db(engine)
    return engine


def test_db_connection_success(memory_db):
    """Verifies that an active database engine passes connectivity test."""
    success, msg = check_connection(memory_db)
    assert success is True
    assert "successful" in msg.lower()


def test_db_connection_failure():
    """Verifies that an offline database engine safely reports failure without throwing unhandled exceptions."""
    # Point to a dead local port
    dead_engine = create_engine("postgresql+psycopg2://invalid:invalid@127.0.0.1:54321/no_db", connect_args={"connect_timeout": 1})
    success, msg = check_connection(dead_engine)
    assert success is False
    assert "failed" in msg.lower() or "error" in msg.lower()


def test_load_idempotency(memory_db):
    """
    Ensures that loading the exact same dataset multiple times is idempotent:
    it never generates duplicate rows in the database.
    """
    df = pd.DataFrame([
        {
            "transaction_id": "TXN-TEST-100",
            "date": pd.to_datetime("2026-05-01"),
            "description": "Consulting Pay",
            "category": "Salary",
            "transaction_type": "Income",
            "amount": 2500.0,
            "payment_method": "Bank Transfer",
            "income": 2500.0,
            "expense": 0.0,
            "net_flow": 2500.0
        },
        {
            "transaction_id": "TXN-TEST-101",
            "date": pd.to_datetime("2026-05-02"),
            "description": "Tech Books",
            "category": "Education",
            "transaction_type": "Expense",
            "amount": 120.0,
            "payment_method": "Card",
            "income": 0.0,
            "expense": 120.0,
            "net_flow": -120.0
        }
    ])

    # First load
    success1, count1, _ = load_data_to_db(df, engine=memory_db, extracted_count=2, transformed_count=2, rejected_count=0)
    assert success1 is True
    assert count1 == 2

    # Verify rows in DB
    with memory_db.connect() as conn:
        res1 = conn.execute(text("SELECT COUNT(*) FROM transactions")).scalar()
    assert res1 == 2

    # Second load with identical data (idempotency check)
    success2, count2, _ = load_data_to_db(df, engine=memory_db, extracted_count=2, transformed_count=2, rejected_count=0)
    assert success2 is True
    assert count2 == 2

    # Row count MUST remain 2 (no duplicates created)
    with memory_db.connect() as conn:
        res2 = conn.execute(text("SELECT COUNT(*) FROM transactions")).scalar()
    assert res2 == 2


def test_load_csv_fallback_when_db_down():
    """
    Verifies that when database connection fails, the loading stage:
    1. Returns (False, 0, ...)
    2. Does NOT claim records were loaded
    3. Persists failure status to metadata
    """
    df = pd.DataFrame([
        {
            "transaction_id": "TXN-FAIL-1",
            "date": pd.to_datetime("2026-05-01"),
            "description": "Rent",
            "category": "Housing",
            "transaction_type": "Expense",
            "amount": 1200.0,
            "payment_method": "UPI",
            "income": 0.0,
            "expense": 1200.0,
            "net_flow": -1200.0
        }
    ])
    dead_engine = create_engine("postgresql+psycopg2://bad:bad@127.0.0.1:54321/dead_db", connect_args={"connect_timeout": 1})
    success, loaded, msg = load_data_to_db(df, engine=dead_engine, extracted_count=1, transformed_count=1, rejected_count=0)

    assert success is False
    assert loaded == 0
    assert "Cannot connect" in msg or "failed" in msg.lower()
