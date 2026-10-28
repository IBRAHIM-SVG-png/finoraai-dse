"""
ETL Pipeline Orchestrator for Personal Finance Analytics System.
Coordinates Extract, Transform, Validate, and Load phases with comprehensive console reporting.
Executable via: python -m etl.pipeline
"""
import os
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from etl.extract import extract_data
from etl.transform import transform_data, calculate_metrics
from etl.load import load_data_to_db


def run_etl_pipeline(
    raw_path: Optional[str] = None,
    cleaned_path: Optional[str] = None,
    rejected_path: Optional[str] = None,
    db_engine = None
) -> Dict[str, Any]:
    """
    Executes the complete three-stage ETL pipeline:
    1. Extract from CSV or Excel raw dataset
    2. Transform, validate, deduplicate, and enrich (quarantine invalid records)
    3. Load into PostgreSQL (with idempotent upsert and graceful CSV fallback)
    """
    start_time = datetime.now()
    timestamp_str = start_time.strftime("%Y-%m-%d %H:%M:%S")

    print("=" * 65)
    print("      PERSONAL FINANCE ANALYTICS - ETL PIPELINE")
    print(f"      Execution Timestamp: {timestamp_str}")
    print("=" * 65)

    # ---------------- STAGE 1: EXTRACT ----------------
    print("\n>>> [1/3] EXTRACTION STAGE")
    raw_df = extract_data(file_path=raw_path)
    extracted_count = len(raw_df)
    print(f"    [+] Records Extracted: {extracted_count}")

    # ---------------- STAGE 2: TRANSFORM --------------
    print("\n>>> [2/3] TRANSFORMATION & VALIDATION STAGE")
    c_path = cleaned_path or os.path.join("data", "processed", "cleaned_transactions.csv")
    r_path = rejected_path or os.path.join("data", "processed", "rejected_transactions.csv")

    cleaned_df, rejected_df = transform_data(
        raw_df=raw_df,
        save_output=True,
        cleaned_path=c_path,
        rejected_path=r_path
    )
    transformed_count = len(cleaned_df)
    rejected_count = len(rejected_df)
    print(f"    [+] Records Transformed & Validated: {transformed_count}")
    print(f"    [+] Records Quarantined / Rejected:  {rejected_count}")

    # Compute financial metrics
    metrics = calculate_metrics(cleaned_df)

    # ---------------- STAGE 3: LOAD -------------------
    print("\n>>> [3/3] LOADING STAGE")
    db_success, loaded_count, db_msg = load_data_to_db(
        cleaned_df=cleaned_df,
        engine=db_engine,
        extracted_count=extracted_count,
        transformed_count=transformed_count,
        rejected_count=rejected_count
    )

    if db_success:
        db_status = "Connected & Loaded"
        print(f"    [+] Database Status: {db_status}")
        print(f"    [+] Records Successfully Loaded: {loaded_count}")
    else:
        db_status = "Unavailable (Cleaned Data Preserved in CSV Fallback)"
        print(f"    [!] Database Status: {db_status}")
        print(f"    [!] Records Loaded to Database: 0")
        print(f"    [!] Fallback Notice: Cleaned records are safely saved at '{c_path}'.")

    # ---------------- SUMMARY REPORT ------------------
    print("\n" + "=" * 65)
    print("           ACTUAL ETL EXECUTION RESULTS")
    print("=" * 65)
    print(f"  Execution Timestamp:         {timestamp_str}")
    print(f"  Extracted Records:           {extracted_count}")
    print(f"  Transformed Records:         {transformed_count}")
    print(f"  Rejected Records:            {rejected_count}")
    print(f"  Successfully Loaded Records: {loaded_count}")
    print(f"  Database Connection Status:  {db_status}")
    print("-" * 65)
    print(f"  Calculated Total Income:     INR {metrics['total_income']:,.2f}")
    print(f"  Calculated Total Expenses:   INR {metrics['total_expenses']:,.2f}")
    print(f"  Calculated Net Savings:      INR {metrics['net_savings']:,.2f}")
    print(f"  Calculated Savings Rate:     {metrics['savings_rate']}%")
    print("=" * 65 + "\n")

    return {
        "execution_timestamp": timestamp_str,
        "extracted_records": extracted_count,
        "transformed_records": transformed_count,
        "rejected_records": rejected_count,
        "loaded_records": loaded_count,
        "database_status": db_status,
        "database_connected": db_success,
        "db_message": db_msg,
        "metrics": metrics
    }


if __name__ == "__main__":
    result = run_etl_pipeline()
    if not result["database_connected"]:
        print("Note: To enable live PostgreSQL loading, run:")
        print("  docker compose up -d db")
        print("  python -m etl.pipeline\n")
