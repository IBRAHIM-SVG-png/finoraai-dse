import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'harsha-finance-super-secret-key-2026-v1')
    DATABASE_PATH = os.environ.get('DATABASE_PATH', str(BASE_DIR / 'harsha_finance.db'))
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() in ('true', '1', 't')
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
