-- ==============================================================================
-- PostgreSQL Database Schema for Cloud-Based Personal Finance Analytics System
-- Supports idempotent execution, relational constraints, and ETL auditing
-- ==============================================================================

-- Transactions Table (Primary ETL target)
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id VARCHAR(64) PRIMARY KEY,
    date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    transaction_type VARCHAR(32) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(64) NOT NULL,
    income NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    expense NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_flow NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for high-performance time-series filtering
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- ETL Execution Audit Log
CREATE TABLE IF NOT EXISTS etl_log (
    id SERIAL PRIMARY KEY,
    execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) NOT NULL,
    records_extracted INT NOT NULL,
    records_transformed INT NOT NULL,
    records_rejected INT NOT NULL,
    records_loaded INT NOT NULL,
    details TEXT
);
