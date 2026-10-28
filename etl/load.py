"""
Loading stage of the ETL pipeline.
Loads validated records into PostgreSQL with idempotent upsert and audit logging.
Maintains graceful CSV fallback when database is unavailable without falsifying success.
"""
import os
import sys
import json
from datetime import datetime
from typing import Tuple, Dict, Any, Optional
import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Engine

from database.db_connection import get_engine, test_connection, init_db

METADATA_PATH = os.path.join("data", "processed", "etl_metadata.json")


def update_local_metadata(metadata: Dict[str, Any], path: str = METADATA_PATH) -> None:
    """
    Persists ETL execution statistics and DB connection status to local JSON metadata file.
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, default=str)


def load_data_to_db(
    cleaned_df: pd.DataFrame,
    engine: Optional[Engine] = None,
    extracted_count: int = 0,
    transformed_count: int = 0,
    rejected_count: int = 0
) -> Tuple[bool, int, str]:
    """
    Loads cleaned DataFrame into PostgreSQL (or SQLite if provided).
    Ensures safe re-execution without duplicate entries (upsert via transaction_id).
    Returns (success, loaded_count, status_message).
    Never claims records were loaded to PostgreSQL if the connection or insertion failed.
    """
    active_engine = engine or get_engine()

    # Step 1: Verify database connectivity
    connected, conn_msg = test_connection(active_engine)
    if not connected:
        err_msg = (
            f"[LOAD ERROR] Cannot connect to database.\n"
            f"Details: {conn_msg}\n"
            f"--> The ETL pipeline halted loading. Records were NOT committed to PostgreSQL.\n"
            f"--> Cleaned records remain securely saved in CSV fallback (data/processed/cleaned_transactions.csv)."
        )
        print(err_msg, file=sys.stderr)

        # Record failure metadata accurately
        meta = {
            "execution_time": datetime.now().isoformat(),
            "status": "FAILED_DB_UNAVAILABLE",
            "database_connected": False,
            "records_extracted": extracted_count,
            "records_transformed": transformed_count,
            "records_rejected": rejected_count,
            "records_loaded": 0,
            "data_source": "CSV Fallback (PostgreSQL Unavailable)",
            "details": conn_msg
        }
        update_local_metadata(meta)
        return False, 0, conn_msg

    # Step 2: Ensure schema tables exist
    init_db(active_engine)

    if cleaned_df.empty:
        print("[LOAD] Cleaned dataset is empty. 0 records to load.")
        return True, 0, "No records to insert."

    loaded_count = 0
    is_sqlite = str(active_engine.url).startswith("sqlite")

    try:
        with active_engine.begin() as conn:
            for _, row in cleaned_df.iterrows():
                d_str = row["date"].strftime("%Y-%m-%d") if isinstance(row["date"], (pd.Timestamp, datetime)) else str(row["date"])

                params = {
                    "txn_id": str(row["transaction_id"]),
                    "date": d_str,
                    "desc": str(row["description"]),
                    "category": str(row["category"]),
                    "type": str(row["transaction_type"]),
                    "amount": float(row["amount"]),
                    "method": str(row["payment_method"]),
                    "income": float(row["income"]),
                    "expense": float(row["expense"]),
                    "net_flow": float(row["net_flow"])
                }

                if is_sqlite:
                    # SQLite upsert
                    stmt = text("""
                    INSERT INTO transactions (
                        transaction_id, date, description, category, transaction_type,
                        amount, payment_method, income, expense, net_flow
                    ) VALUES (
                        :txn_id, :date, :desc, :category, :type,
                        :amount, :method, :income, :expense, :net_flow
                    )
                    ON CONFLICT(transaction_id) DO UPDATE SET
                        date = :date,
                        description = :desc,
                        category = :category,
                        transaction_type = :type,
                        amount = :amount,
                        payment_method = :method,
                        income = :income,
                        expense = :expense,
                        net_flow = :net_flow,
                        updated_at = CURRENT_TIMESTAMP;
                    """)
                else:
                    # PostgreSQL upsert
                    stmt = text("""
                    INSERT INTO transactions (
                        transaction_id, date, description, category, transaction_type,
                        amount, payment_method, income, expense, net_flow
                    ) VALUES (
                        :txn_id, :date, :desc, :category, :type,
                        :amount, :method, :income, :expense, :net_flow
                    )
                    ON CONFLICT (transaction_id) DO UPDATE SET
                        date = EXCLUDED.date,
                        description = EXCLUDED.description,
                        category = EXCLUDED.category,
                        transaction_type = EXCLUDED.transaction_type,
                        amount = EXCLUDED.amount,
                        payment_method = EXCLUDED.payment_method,
                        income = EXCLUDED.income,
                        expense = EXCLUDED.expense,
                        net_flow = EXCLUDED.net_flow,
                        updated_at = CURRENT_TIMESTAMP;
                    """)

                conn.execute(stmt, params)
                loaded_count += 1

            # Log execution to audit table
            log_stmt = text("""
            INSERT INTO etl_log (
                status, records_extracted, records_transformed, records_rejected, records_loaded, details
            ) VALUES (
                :status, :ext, :trn, :rej, :lod, :details
            )
            """)
            conn.execute(log_stmt, {
                "status": "SUCCESS",
                "ext": extracted_count,
                "trn": transformed_count,
                "rej": rejected_count,
                "lod": loaded_count,
                "details": f"Pipeline executed successfully with idempotent upsert of {loaded_count} records."
            })

        db_label = "SQLite Database" if is_sqlite else "PostgreSQL Database"
        print(f"[LOAD] Successfully loaded {loaded_count} validated records into {db_label}.")

        # Persist success metadata
        meta = {
            "execution_time": datetime.now().isoformat(),
            "status": "SUCCESS",
            "database_connected": True,
            "records_extracted": extracted_count,
            "records_transformed": transformed_count,
            "records_rejected": rejected_count,
            "records_loaded": loaded_count,
            "data_source": db_label,
            "details": f"Idempotent upsert completed successfully for {loaded_count} records."
        }
        update_local_metadata(meta)

        return True, loaded_count, f"Loaded successfully into {db_label}."

    except Exception as e:
        err_msg = f"[LOAD ERROR] Database transaction aborted: {str(e)}"
        print(err_msg, file=sys.stderr)
        meta = {
            "execution_time": datetime.now().isoformat(),
            "status": "FAILED_DURING_INSERT",
            "database_connected": True,
            "records_extracted": extracted_count,
            "records_transformed": transformed_count,
            "records_rejected": rejected_count,
            "records_loaded": 0,
            "data_source": "CSV Fallback",
            "details": str(e)
        }
        update_local_metadata(meta)
        return False, 0, str(e)


# Alias for explicit naming
load_into_postgres = load_data_to_db


if __name__ == "__main__":
    from etl.extract import extract_data
    from etl.transform import transform_data

    raw = extract_data()
    clean, rejected = transform_data(raw)
    success, loaded, msg = load_data_to_db(clean, extracted_count=len(raw), transformed_count=len(clean), rejected_count=len(rejected))
    print(f"Result: Success={success}, Loaded={loaded}, Message={msg}")
