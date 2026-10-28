"""
Database connection and initialization module for Cloud-Based Personal Finance Analytics System.
Manages SQLAlchemy engine creation, health checks, schema initialization, and dual PostgreSQL/SQLite compatibility.
"""
import os
from typing import Tuple, Optional
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError, SQLAlchemyError

# Load environment variables
load_dotenv()


def get_db_url() -> str:
    """
    Constructs the database connection URL from environment variables.
    Defaults to localhost PostgreSQL if not explicitly defined.
    """
    url = os.getenv("DATABASE_URL")
    if url:
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    db = os.getenv("POSTGRES_DB", "finance_db")

    return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{db}"


def get_engine(db_url: Optional[str] = None) -> Engine:
    """
    Creates and returns a SQLAlchemy Engine instance.
    Configures pool pre-ping and a 3-second connection timeout to avoid hanging if DB is offline.
    """
    target_url = db_url or get_db_url()
    if target_url.startswith("postgresql://"):
        target_url = target_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    # SQLite compatibility for testing and local fallback
    if target_url.startswith("sqlite"):
        return create_engine(target_url, echo=False)

    return create_engine(
        target_url,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 3},
        echo=False
    )


def test_connection(engine: Optional[Engine] = None) -> Tuple[bool, str]:
    """
    Tests whether the database is accessible.
    Returns (True, message) if successful, or (False, error_details) on failure.
    """
    active_engine = engine or get_engine()
    try:
        with active_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True, "Database connection successful."
    except OperationalError as e:
        error_msg = (
            f"PostgreSQL connection failed: {e.orig if hasattr(e, 'orig') else str(e)}\n"
            "Recovery Steps:\n"
            "1. Ensure Docker is running: docker compose up -d db\n"
            "2. Or ensure PostgreSQL service is active on localhost:5432\n"
            "3. Verify credentials in .env (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)"
        )
        return False, error_msg
    except Exception as e:
        return False, f"Unexpected database error: {str(e)}"


def init_db(engine: Optional[Engine] = None) -> bool:
    """
    Ensures required tables (transactions, etl_log) exist.
    """
    active_engine = engine or get_engine()
    is_sqlite = str(active_engine.url).startswith("sqlite")

    try:
        with active_engine.begin() as conn:
            if is_sqlite:
                conn.execute(text("""
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
                """))
                conn.execute(text("""
                CREATE TABLE IF NOT EXISTS etl_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(32) NOT NULL,
                    records_extracted INT NOT NULL,
                    records_transformed INT NOT NULL,
                    records_rejected INT NOT NULL,
                    records_loaded INT NOT NULL,
                    details TEXT
                );
                """))
            else:
                conn.execute(text("""
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
                """))
                conn.execute(text("""
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
                """))
        return True
    except SQLAlchemyError as e:
        print(f"[ERROR] Failed to initialize database tables: {e}")
        return False
