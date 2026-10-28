# CLOUD COMPUTING IA3 EVALUATION: ETL & CI/CD PIPELINE DEMO GUIDE

**Project**: Intelligent Personal Finance and Future Simulation System  
**Evaluation Scope**: Automated ETL Pipeline & Continuous Integration / Continuous Delivery (CI/CD)  
**Engineering Stack**: Python, Pandas, PostgreSQL, Docker, GitHub Actions, Pytest, React (Vite)

---

## 1. System Architecture Flows

### A. ETL Pipeline Architecture Flow

```
+----------------------------------------------------------------------------------------------------+
|                                    ETL PIPELINE FLOW ARCHITECTURE                                  |
+----------------------------------------------------------------------------------------------------+

     [ Raw Dataset ]
   data/transactions.csv
      (CSV / Excel)
            |
            v
   +-----------------+
   |  STAGE 1:       | ---> Reads 530+ raw records
   |  EXTRACT        | ---> Preserves raw source dataset (never overwritten)
   |  (etl/extract)  | ---> Validates required columns & records row count
   +-----------------+
            |
            v
   +-----------------+
   |  STAGE 2:       | ---> Removes duplicate transactions (quarantines duplicates)
   |  TRANSFORM      | ---> Validates dates, amounts, transaction types & categories
   |  (etl/transform)| ---> Quarantines invalid records -> data/processed/rejected_transactions.csv
   +-----------------+ ---> Computes income, expenses, net flow, and savings rates
            |
            v
   +-----------------+
   |  STAGE 3:       | ---> Tests live PostgreSQL connectivity (3-second fail-safe timeout)
   |  LOAD           | ---> IF PostgreSQL Connected: Idempotent upsert (ON CONFLICT DO UPDATE)
   |  (etl/load)     | ---> IF PostgreSQL Unavailable: Graceful fallback to CSV dataset
   +-----------------+      (data/processed/cleaned_transactions.csv) without falsifying success
            |
            +---------------------------------+
            |                                 |
            v                                 v
   [ PostgreSQL Database ]         [ Cleaned CSV Fallback ]
  (transactions & etl_log)      (data/processed/cleaned_transactions.csv)
```

---

### B. CI/CD Architecture Flow

```
+----------------------------------------------------------------------------------------------------+
|                                      CI/CD PIPELINE ARCHITECTURE                                   |
+----------------------------------------------------------------------------------------------------+

   [ Developer / Git Push ]
   Push to main / PR to main
            |
            v
  +---------------------------------------------------------------------------+
  | GITHUB ACTIONS CONTINUOUS INTEGRATION (CI) RUNNER                         |
  |                                                                           |
  |  1. Checkout Code (actions/checkout@v4)                                   |
  |  2. Set up Python 3.11 Runtime (actions/setup-python@v5)                  |
  |  3. Install Dependencies from requirements.txt (pip, flake8, pytest)      |
  |  4. Static Syntax & Code Compilation Check (flake8 & compileall)          |
  |  5. Automated Pytest Execution (23+ unit, integration & math tests)       |
  |  6. End-to-End ETL Verification (python -m etl.pipeline in fallback mode) |
  |  7. Docker Engine Build (docker/build-push-action@v5)                     |
  |                                                                           |
  |  * Fails pipeline immediately if any unit test or docker build breaks     |
  +---------------------------------------------------------------------------+
            |
            v (Success on push to 'main')
  +---------------------------------------------------------------------------+
  | GITHUB ACTIONS CONTINUOUS DELIVERY (CD) RUNNER                            |
  |                                                                           |
  |  1. Authenticate to GitHub Container Registry (ghcr.io) via GITHUB_TOKEN  |
  |  2. Extract Docker metadata (semantic tags & short commit SHA)            |
  |  3. Build and Publish Multi-layer Container Image to GHCR Packages         |
  +---------------------------------------------------------------------------+
```

---

## 2. Dataset and Data Source Details

| Attribute | Specification |
|---|---|
| **Raw Dataset Location** | `data/transactions.csv` (supports `.csv`, `.xlsx`, `.xls`) |
| **Cleaned Dataset Location** | `data/processed/cleaned_transactions.csv` |
| **Quarantined Dataset Location** | `data/processed/rejected_transactions.csv` |
| **Execution Audit File** | `data/processed/etl_metadata.json` |
| **Raw Record Count** | 530 records (520 valid records, 5 duplicates, 5 edge-case errors) |
| **Demonstrated Rejections** | Corrupted dates (`2026-99-99`), negative amounts, zero amounts, missing transaction IDs, invalid transaction types |

---

## 3. Required Evaluation Commands

### Command 1: Run the Complete ETL Pipeline
```powershell
python -m etl.pipeline
```
**Sample Output:**
```
=================================================================
      PERSONAL FINANCE ANALYTICS - ETL PIPELINE
      Execution Timestamp: 2026-10-29 00:52:14
=================================================================

>>> [1/3] EXTRACTION STAGE
[EXTRACT] Successfully extracted 530 records from CSV file 'data\transactions.csv'.
    [+] Records Extracted: 530

>>> [2/3] TRANSFORMATION & VALIDATION STAGE
[TRANSFORM] Cleaned dataset (520 records) saved to 'data\processed\cleaned_transactions.csv'.
[TRANSFORM] Rejected dataset (10 records) saved to 'data\processed\rejected_transactions.csv'.
    [+] Records Transformed & Validated: 520
    [+] Records Quarantined / Rejected:  10

>>> [3/3] LOADING STAGE
    [!] Database Status: Unavailable (Cleaned Data Preserved in CSV Fallback)
    [!] Records Loaded to Database: 0
    [!] Fallback Notice: Cleaned records are safely saved at 'data\processed\cleaned_transactions.csv'.

=================================================================
           ACTUAL ETL EXECUTION RESULTS
=================================================================
  Execution Timestamp:         2026-10-29 00:52:14
  Extracted Records:           530
  Transformed Records:         520
  Rejected Records:            10
  Successfully Loaded Records: 0
  Database Connection Status:  Unavailable (Cleaned Data Preserved in CSV Fallback)
-----------------------------------------------------------------
  Calculated Total Income:     INR 176,690.54
  Calculated Total Expenses:   INR 111,085.78
  Calculated Net Savings:      INR 65,604.76
  Calculated Savings Rate:     37.13%
=================================================================
```

### Command 2: Run Automated Pytest Suite
```powershell
python -m pytest -v
```
**Sample Output:**
```
============================= test session starts =============================
platform win32 -- Python 3.11.5, pytest-9.2.0, pluggy-1.7.0
rootdir: C:\Users\ibrah\OneDrive\Desktop\harsha
collected 23 items

backend/tests/test_calculations.py::TestFinancialCalculations::test_budget_utilization PASSED [  4%]
backend/tests/test_calculations.py::TestFinancialCalculations::test_financial_health_score PASSED [  8%]
backend/tests/test_calculations.py::TestFinancialCalculations::test_future_simulator_cash_vs_invested PASSED [ 13%]
backend/tests/test_calculations.py::TestFinancialCalculations::test_savings_rate PASSED [ 17%]
backend/tests/test_calculations.py::TestFinancialCalculations::test_what_if_scenarios PASSED [ 21%]
tests/test_calculations.py::TestFinancialCalculations::test_budget_utilization PASSED [ 26%]
tests/test_calculations.py::TestFinancialCalculations::test_financial_health_score PASSED [ 30%]
tests/test_calculations.py::TestFinancialCalculations::test_future_simulator_cash_vs_invested PASSED [ 34%]
tests/test_calculations.py::TestFinancialCalculations::test_savings_rate PASSED [ 39%]
tests/test_calculations.py::TestFinancialCalculations::test_what_if_scenarios PASSED [ 43%]
tests/test_extract.py::test_extract_valid_csv PASSED                     [ 47%]
tests/test_extract.py::test_extract_missing_columns PASSED               [ 52%]
tests/test_extract.py::test_extract_excel_support PASSED                 [ 56%]
tests/test_extract.py::test_extract_synthetic_fallback PASSED            [ 60%]
tests/test_load.py::test_db_connection_success PASSED                    [ 65%]
tests/test_load.py::test_db_connection_failure PASSED                    [ 69%]
tests/test_load.py::test_load_idempotency PASSED                         [ 73%]
tests/test_load.py::test_load_csv_fallback_when_db_down PASSED           [ 78%]
tests/test_pipeline.py::test_pipeline_end_to_end_with_sqlite PASSED      [ 82%]
tests/test_transform.py::test_transform_deduplication PASSED             [ 86%]
tests/test_transform.py::test_transform_invalid_records_quarantine PASSED [ 91%]
tests/test_transform.py::test_transform_metrics_calculation PASSED       [ 95%]
tests/test_transform.py::test_transform_empty_data PASSED                [100%]

============================= 23 passed in 3.13s ==============================
```

### Command 3: Launch Existing Dashboard (Unmodified)
```powershell
.\run.ps1
```
*Frontend URL*: `http://localhost:5173`  
*Backend URL*: `http://127.0.0.1:5000`

---

## 4. Demonstrating PostgreSQL Database Support (Optional Docker Compose)

When Docker Desktop is active on the evaluator's machine:

1. **Start PostgreSQL Container**:
   ```bash
   docker compose up -d db
   ```

2. **Run ETL Pipeline with Live Database**:
   ```bash
   python -m etl.pipeline
   ```
   *Result*: Records are loaded directly into PostgreSQL with idempotent `ON CONFLICT` duplicate handling.

3. **Verify PostgreSQL Records**:
   ```bash
   docker exec -it personal_finance_db psql -U postgres -d finance_db -c "SELECT COUNT(*) FROM transactions;"
   docker exec -it personal_finance_db psql -U postgres -d finance_db -c "SELECT * FROM etl_log ORDER BY id DESC LIMIT 1;"
   ```

4. **Verify Database Failure Resistance**:
   Stop the database container:
   ```bash
   docker compose stop db
   python -m etl.pipeline
   ```
   *Result*: The pipeline gracefully reports that PostgreSQL is offline, refuses to claim a false database insert, and preserves cleaned transactions in `data/processed/cleaned_transactions.csv`.

---

## 5. Demonstrating GitHub Actions CI/CD Workflow

1. **Commit and Push Code to GitHub**:
   ```powershell
   git add .
   git commit -m "feat(ia3): add complete ETL pipeline, CI/CD GitHub Actions workflow, and automated test suite"
   git push origin main
   ```

2. **Inspect the Workflow on GitHub**:
   - Navigate to your repository on GitHub: `https://github.com/<YOUR_USERNAME>/<YOUR_REPO>/actions`
   - Observe the **CI/CD Pipeline** executing automatically.
   - Click into **Continuous Integration & Verification**:
     - *Check Python Syntax & Compile Code* -> Passes with 0 errors
     - *Run Automated Pytest Suite* -> 23 tests pass
     - *Verify ETL Pipeline Execution* -> Runs 3-stage pipeline
     - *Build Application Docker Image* -> Compiles image using Buildx
   - On pushes to `main`, observe the **Continuous Delivery** job securely publishing the container package to GitHub Container Registry (`ghcr.io`).

---

## 6. Troubleshooting Common Issues

| Issue | Root Cause | Solution |
|---|---|---|
| `UnicodeEncodeError: 'charmap'` | Windows default code page 1252 cannot encode some special symbols | Resolved: All ETL console outputs format currency as clean `INR` strings. |
| `PostgreSQL connection refused (10061)` | PostgreSQL or Docker service is not running locally | Normal behavior: ETL gracefully uses CSV fallback and updates `etl_metadata.json`. To run PostgreSQL, run `docker compose up -d db`. |
| `ModuleNotFoundError: No module named 'etl'` | Command executed from inside a subfolder | Always run `python -m etl.pipeline` from the project root directory. |
| Dashboard appearance differences | Modifying frontend files | Dashboard was intentionally preserved 100% without altering frontend styling or layout. |
