"""
Extraction stage of the ETL pipeline.
Loads raw transaction records from CSV or Excel files while preserving original data integrity.
"""
import os
import random
from datetime import datetime, timedelta
from typing import Optional
import pandas as pd

DEFAULT_DATA_PATH = os.path.join("data", "transactions.csv")

CATEGORIES_MAP = {
    "Income": {
        "Salary": ["Monthly Corporate Salary", "Direct Deposit Payroll", "Bi-weekly Salary"],
        "Freelance": ["Upwork Web Dev Client", "Consulting Retainer", "Design Freelance Project"],
        "Investment": ["Dividend Payout Vanguard", "Stock Capital Gain", "High-Yield Savings Interest"]
    },
    "Expense": {
        "Food": ["Trader Joe's Groceries", "Chipotle Lunch", "Whole Foods Market", "Starbucks Coffee", "Dinner Bistro"],
        "Transport": ["Uber Ride", "Shell Gas Station", "Metro Card Refill", "Parking Meter", "Lyft Ride"],
        "Shopping": ["Amazon.com Retail", "Target Department Store", "Best Buy Tech", "Nike Store"],
        "Bills": ["Electric & Gas Utility", "Home Internet Fiber", "Water Bill Municipal", "Mobile Phone Plan"],
        "Healthcare": ["CVS Pharmacy", "Dental Checkup Co-pay", "Optometry Eye Exam", "Health Insurance Premium"],
        "Education": ["Coursera Annual Subscription", "O'Reilly Technical Books", "University Exam Fee", "Udemy Python Course"],
        "Entertainment": ["Netflix Subscription", "Cinema Ticket IMAX", "Spotify Premium", "Steam Video Game Store"],
        "Housing": ["Monthly Apartment Rent", "Home Maintenance Service", "Tenant Insurance"]
    }
}

PAYMENT_METHODS = ["Credit Card", "Debit Card", "Bank Transfer", "UPI", "Cash"]


def generate_synthetic_transactions(num_records: int = 520, output_path: str = DEFAULT_DATA_PATH) -> pd.DataFrame:
    """
    Generates realistic financial transactions and saves to CSV/Excel.
    Includes intentional duplicates and invalid edge cases for ETL pipeline demonstration.
    """
    random.seed(42)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    records = []
    base_date = datetime.now() - timedelta(days=180)

    for i in range(1, num_records + 1):
        txn_id = f"TXN-{10000 + i}"
        days_offset = random.randint(0, 180)
        txn_date = (base_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")

        # 80% expenses, 20% income for realistic distribution
        if random.random() < 0.20:
            txn_type = "Income"
            category = random.choice(list(CATEGORIES_MAP["Income"].keys()))
            description = random.choice(CATEGORIES_MAP["Income"][category])
            if category == "Salary":
                amount = round(random.uniform(2500.0, 5500.0), 2)
            elif category == "Freelance":
                amount = round(random.uniform(300.0, 1800.0), 2)
            else:
                amount = round(random.uniform(50.0, 450.0), 2)
        else:
            txn_type = "Expense"
            category = random.choice(list(CATEGORIES_MAP["Expense"].keys()))
            description = random.choice(CATEGORIES_MAP["Expense"][category])
            if category == "Housing":
                amount = round(random.uniform(800.0, 1600.0), 2)
            elif category in ["Bills", "Healthcare", "Education"]:
                amount = round(random.uniform(40.0, 350.0), 2)
            else:
                amount = round(random.uniform(8.0, 140.0), 2)

        payment_method = random.choice(PAYMENT_METHODS)

        records.append({
            "transaction_id": txn_id,
            "date": txn_date,
            "description": description,
            "category": category,
            "transaction_type": txn_type,
            "amount": amount,
            "payment_method": payment_method
        })

    # Add 5 intentional duplicate records to demonstrate deduplication in ETL
    for i in range(5):
        dup = records[i * 20].copy()
        records.append(dup)

    # Add 5 intentional invalid records to demonstrate quarantine / rejection
    records.append({
        "transaction_id": "TXN-ERR-001",
        "date": "2026-99-99",  # Invalid date
        "description": "Corrupted Data Record",
        "category": "Food",
        "transaction_type": "Expense",
        "amount": 45.00,
        "payment_method": "Credit Card"
    })
    records.append({
        "transaction_id": "TXN-ERR-002",
        "date": "2026-03-01",
        "description": "Negative Amount Error",
        "category": "Shopping",
        "transaction_type": "Expense",
        "amount": -75.00,  # Negative amount
        "payment_method": "Debit Card"
    })
    records.append({
        "transaction_id": "TXN-ERR-003",
        "date": "2026-03-02",
        "description": "Zero Amount Error",
        "category": "Bills",
        "transaction_type": "Expense",
        "amount": 0.00,  # Zero amount
        "payment_method": "UPI"
    })
    records.append({
        "transaction_id": "",  # Missing transaction ID
        "date": "2026-03-03",
        "description": "Missing ID Transaction",
        "category": "Food",
        "transaction_type": "Expense",
        "amount": 25.00,
        "payment_method": "Cash"
    })
    records.append({
        "transaction_id": "TXN-ERR-005",
        "date": "2026-03-04",
        "description": "Invalid Type Transaction",
        "category": "Entertainment",
        "transaction_type": "InvalidType",  # Invalid transaction type
        "amount": 60.00,
        "payment_method": "Credit Card"
    })

    df = pd.DataFrame(records)
    if output_path.endswith(".xlsx") or output_path.endswith(".xls"):
        df.to_excel(output_path, index=False)
    else:
        df.to_csv(output_path, index=False)
    print(f"[EXTRACT] Generated {len(df)} synthetic transactions at '{output_path}'.")
    return df


def extract_data(file_path: Optional[str] = None) -> pd.DataFrame:
    """
    Extracts transaction records from CSV or Excel file.
    Preserves original dataset and returns DataFrame.
    """
    target_path = file_path or os.getenv("CSV_RAW_PATH", DEFAULT_DATA_PATH)

    if not os.path.exists(target_path):
        print(f"[EXTRACT] Raw dataset not found at '{target_path}'. Generating default dataset...")
        df = generate_synthetic_transactions(num_records=520, output_path=target_path)
    else:
        if target_path.endswith(".xlsx") or target_path.endswith(".xls"):
            df = pd.read_excel(target_path)
            print(f"[EXTRACT] Successfully extracted {len(df)} records from Excel file '{target_path}'.")
        else:
            df = pd.read_csv(target_path)
            print(f"[EXTRACT] Successfully extracted {len(df)} records from CSV file '{target_path}'.")

    # Validate essential raw columns
    required_cols = {"transaction_id", "date", "description", "category", "transaction_type", "amount", "payment_method"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Extracted dataset is missing required columns: {missing}")

    return df


if __name__ == "__main__":
    extracted_df = extract_data()
    print(f"[EXTRACT SUMMARY] Records Extracted: {len(extracted_df)}")
