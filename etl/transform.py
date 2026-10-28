"""
Transformation stage of the ETL pipeline.
Cleans, standardizes, validates, and enriches financial transaction records.
Quarantines invalid records and computes analytical summaries (income, expenses, net savings, monthly aggregates).
"""
import os
from typing import Tuple, Dict, Any, Optional
import pandas as pd
import numpy as np

CLEANED_DATA_PATH = os.path.join("data", "processed", "cleaned_transactions.csv")
REJECTED_DATA_PATH = os.path.join("data", "processed", "rejected_transactions.csv")

VALID_TRANSACTION_TYPES = {"Income", "Expense"}
VALID_CATEGORIES = {
    "Salary", "Freelance", "Investment", "Bonus",
    "Food", "Transport", "Shopping", "Bills",
    "Healthcare", "Education", "Entertainment", "Housing", "Other"
}


def calculate_metrics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Calculates summary financial metrics from a DataFrame of transactions.
    Handles empty data and zero-income edge cases safely.
    Computes total income, expenses, net savings, savings rate, and monthly breakdown.
    """
    if df.empty:
        return {
            "total_income": 0.0,
            "total_expenses": 0.0,
            "net_savings": 0.0,
            "savings_rate": 0.0,
            "transaction_count": 0,
            "monthly_summary": []
        }

    total_income = float(df[df["transaction_type"] == "Income"]["amount"].sum())
    total_expenses = float(df[df["transaction_type"] == "Expense"]["amount"].sum())
    net_savings = round(total_income - total_expenses, 2)

    # Safe savings rate calculation
    if total_income > 0:
        savings_rate = round((net_savings / total_income) * 100.0, 2)
    else:
        savings_rate = 0.0

    # Monthly breakdown summary
    temp_df = df.copy()
    if not pd.api.types.is_datetime64_any_dtype(temp_df["date"]):
        temp_df["date"] = pd.to_datetime(temp_df["date"], errors="coerce")
    temp_df["month_year"] = temp_df["date"].dt.strftime("%Y-%m")

    monthly_summary = []
    for month, group in temp_df.groupby("month_year"):
        m_inc = float(group[group["transaction_type"] == "Income"]["amount"].sum())
        m_exp = float(group[group["transaction_type"] == "Expense"]["amount"].sum())
        monthly_summary.append({
            "month": str(month),
            "income": round(m_inc, 2),
            "expenses": round(m_exp, 2),
            "net_savings": round(m_inc - m_exp, 2)
        })

    return {
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net_savings": net_savings,
        "savings_rate": savings_rate,
        "transaction_count": int(len(df)),
        "monthly_summary": monthly_summary
    }


def transform_data(
    raw_df: Optional[pd.DataFrame],
    save_output: bool = True,
    cleaned_path: str = CLEANED_DATA_PATH,
    rejected_path: str = REJECTED_DATA_PATH
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Transforms raw transactions DataFrame into cleaned, enriched dataset.
    Identifies and quarantines invalid records with specific rejection reasons.
    Preserves raw dataset by saving output only to the processed/ directory.
    """
    if raw_df is None or raw_df.empty:
        empty_clean = pd.DataFrame(columns=[
            "transaction_id", "date", "description", "category",
            "transaction_type", "amount", "payment_method", "income", "expense", "net_flow"
        ])
        empty_reject = pd.DataFrame(columns=list(raw_df.columns if raw_df is not None else []) + ["rejection_reason"])
        return empty_clean, empty_reject

    df = raw_df.copy()
    rejected_records = []
    cleaned_records = []

    # Step 1: Detect duplicate transaction IDs (quarantine duplicates, keep first occurrence)
    duplicates = df[df.duplicated(subset=["transaction_id"], keep="first")]
    for _, row in duplicates.iterrows():
        r = row.to_dict()
        r["rejection_reason"] = "Duplicate transaction_id"
        rejected_records.append(r)
    df = df.drop_duplicates(subset=["transaction_id"], keep="first")

    # Step 2: Validate and clean each record
    for _, row in df.iterrows():
        txn_id = str(row.get("transaction_id", "")).strip()
        date_raw = row.get("date", None)
        desc_raw = str(row.get("description", "")).strip()
        cat_raw = str(row.get("category", "")).strip().title()
        type_raw = str(row.get("transaction_type", "")).strip().title()
        amount_raw = row.get("amount", None)
        method_raw = str(row.get("payment_method", "Unknown")).strip()

        # Reject if transaction_id is missing or null
        if not txn_id or txn_id.lower() in ("nan", "none", ""):
            r = row.to_dict()
            r["rejection_reason"] = "Missing or empty transaction_id"
            rejected_records.append(r)
            continue

        # Parse and validate date
        try:
            parsed_date = pd.to_datetime(date_raw, errors="raise")
            formatted_date = parsed_date.strftime("%Y-%m-%d")
        except Exception:
            r = row.to_dict()
            r["rejection_reason"] = f"Invalid date format: {date_raw}"
            rejected_records.append(r)
            continue

        # Validate and convert amount
        try:
            amount_clean_str = str(amount_raw).replace("$", "").replace("₹", "").replace(",", "").strip()
            amount_val = float(amount_clean_str)
            if np.isnan(amount_val) or amount_val <= 0:
                r = row.to_dict()
                r["rejection_reason"] = f"Amount must be positive numeric: {amount_raw}"
                rejected_records.append(r)
                continue
            amount_val = round(amount_val, 2)
        except (ValueError, TypeError):
            r = row.to_dict()
            r["rejection_reason"] = f"Unparseable amount value: {amount_raw}"
            rejected_records.append(r)
            continue

        # Validate transaction_type
        if type_raw not in VALID_TRANSACTION_TYPES:
            r = row.to_dict()
            r["rejection_reason"] = f"Invalid transaction_type: '{type_raw}' (must be Income or Expense)"
            rejected_records.append(r)
            continue

        # Standardize category
        category = cat_raw if cat_raw in VALID_CATEGORIES else "Other"
        description = desc_raw if desc_raw else "Uncategorized"
        payment_method = method_raw if method_raw else "Unknown"

        # Calculate income, expense, and net_flow fields
        income = amount_val if type_raw == "Income" else 0.00
        expense = amount_val if type_raw == "Expense" else 0.00
        net_flow = round(income - expense, 2)

        cleaned_records.append({
            "transaction_id": txn_id,
            "date": formatted_date,
            "description": description,
            "category": category,
            "transaction_type": type_raw,
            "amount": amount_val,
            "payment_method": payment_method,
            "income": income,
            "expense": expense,
            "net_flow": net_flow
        })

    cleaned_df = pd.DataFrame(cleaned_records)
    rejected_df = pd.DataFrame(rejected_records)

    # Sort cleaned records by date descending
    if not cleaned_df.empty:
        cleaned_df["date"] = pd.to_datetime(cleaned_df["date"])
        cleaned_df = cleaned_df.sort_values(by="date", ascending=False).reset_index(drop=True)

    # Save to disk if requested without altering raw files
    if save_output:
        os.makedirs(os.path.dirname(cleaned_path), exist_ok=True)
        os.makedirs(os.path.dirname(rejected_path), exist_ok=True)

        if not cleaned_df.empty:
            export_df = cleaned_df.copy()
            export_df["date"] = export_df["date"].dt.strftime("%Y-%m-%d")
            export_df.to_csv(cleaned_path, index=False)
        else:
            cleaned_df.to_csv(cleaned_path, index=False)

        rejected_df.to_csv(rejected_path, index=False)
        print(f"[TRANSFORM] Cleaned dataset ({len(cleaned_df)} records) saved to '{cleaned_path}'.")
        print(f"[TRANSFORM] Rejected dataset ({len(rejected_df)} records) saved to '{rejected_path}'.")

    return cleaned_df, rejected_df


if __name__ == "__main__":
    from etl.extract import extract_data
    raw = extract_data()
    clean, rejected = transform_data(raw)
    print(f"[TRANSFORM SUMMARY] Valid Cleaned: {len(clean)}, Rejected: {len(rejected)}")
    metrics = calculate_metrics(clean)
    print(f"[METRICS] Total Income: INR {metrics['total_income']:,.2f} | Expenses: INR {metrics['total_expenses']:,.2f} | Net: INR {metrics['net_savings']:,.2f} | Savings Rate: {metrics['savings_rate']}%")
