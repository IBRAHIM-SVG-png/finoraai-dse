import functools
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature
from database import get_db
from config import Config

auth_bp = Blueprint('auth', __name__)
serializer = URLSafeTimedSerializer(Config.SECRET_KEY)
TOKEN_MAX_AGE = 60 * 60 * 24 * 7 # 7 days

def generate_token(user_id: int, username: str) -> str:
    return serializer.dumps({"user_id": user_id, "username": username}, salt="auth-token")

def token_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header:
            return jsonify({"error": "Authorization token is missing"}), 401
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({"error": "Invalid Authorization header format. Expected 'Bearer <token>'"}), 401

        token = parts[1]
        try:
            data = serializer.loads(token, salt="auth-token", max_age=TOKEN_MAX_AGE)
            user_id = data.get("user_id")
        except SignatureExpired:
            return jsonify({"error": "Token has expired. Please log in again."}), 401
        except BadTimeSignature:
            return jsonify({"error": "Invalid token. Please log in again."}), 401
        except Exception:
            return jsonify({"error": "Authentication failed"}), 401

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, username, email, full_name, currency, monthly_savings_target FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            if not user:
                return jsonify({"error": "User account not found"}), 401

        return f(dict(user), *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip().lower()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    full_name = data.get('full_name', '').strip()
    currency = data.get('currency', 'INR').strip().upper()

    if not username or not email or not password or not full_name:
        return jsonify({"error": "All fields (full_name, username, email, password) are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    if '@' not in email or '.' not in email:
        return jsonify({"error": "Please enter a valid email address"}), 400

    password_hash = generate_password_hash(password)

    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, full_name, currency, monthly_savings_target)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (username, email, password_hash, full_name, currency, 5000.0))
            user_id = cursor.lastrowid
            
            # Create a sample initial budget structure for popular categories
            sample_budgets = [
                ("Food", 8000.0),
                ("Transport", 3000.0),
                ("Shopping", 5000.0),
                ("Bills", 4000.0),
                ("Education", 3000.0),
                ("Healthcare", 2500.0),
                ("Entertainment", 2000.0)
            ]
            import datetime
            current_month = datetime.datetime.now().strftime("%Y-%m")
            for cat, limit in sample_budgets:
                cursor.execute("""
                    INSERT OR IGNORE INTO budgets (user_id, category, monthly_limit, month_year)
                    VALUES (?, ?, ?, ?)
                """, (user_id, cat, limit, current_month))

        token = generate_token(user_id, username)
        return jsonify({
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "full_name": full_name,
                "currency": currency,
                "monthly_savings_target": 5000.0
            }
        }), 201

    except Exception as e:
        if "UNIQUE constraint failed: users.username" in str(e):
            return jsonify({"error": "Username is already taken"}), 409
        elif "UNIQUE constraint failed: users.email" in str(e):
            return jsonify({"error": "Email is already registered"}), 409
        return jsonify({"error": "Failed to create user account"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = data.get('username_or_email', '').strip().lower()
    password = data.get('password', '').strip()

    if not identifier or not password:
        return jsonify({"error": "Username/Email and password are required"}), 400

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, username, email, password_hash, full_name, currency, monthly_savings_target
            FROM users
            WHERE username = ? OR email = ?
        """, (identifier, identifier))
        user = cursor.fetchone()

        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({"error": "Invalid username or password"}), 401

        token = generate_token(user['id'], user['username'])
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user['id'],
                "username": user['username'],
                "email": user['email'],
                "full_name": user['full_name'],
                "currency": user['currency'],
                "monthly_savings_target": user['monthly_savings_target']
            }
        }), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({"user": current_user}), 200

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json() or {}
    full_name = data.get('full_name', current_user['full_name']).strip()
    currency = data.get('currency', current_user['currency']).strip().upper()
    try:
        monthly_savings_target = float(data.get('monthly_savings_target', current_user['monthly_savings_target']))
    except (ValueError, TypeError):
        monthly_savings_target = current_user['monthly_savings_target']

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users
            SET full_name = ?, currency = ?, monthly_savings_target = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (full_name, currency, monthly_savings_target, current_user['id']))

    return jsonify({
        "message": "Profile updated successfully",
        "user": {
            "id": current_user['id'],
            "username": current_user['username'],
            "email": current_user['email'],
            "full_name": full_name,
            "currency": currency,
            "monthly_savings_target": monthly_savings_target
        }
    }), 200

@auth_bp.route('/reset-data', methods=['POST'])
@token_required
def reset_financial_data(current_user):
    data = request.get_json() or {}
    confirmation = data.get('confirm_reset', False)

    if not confirmation:
        return jsonify({"error": "Confirmation required to reset financial data"}), 400

    user_id = current_user['id']
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM budgets WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM financial_goals WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM simulation_scenarios WHERE user_id = ?", (user_id,))

    return jsonify({"message": "All financial records and simulation data have been securely reset."}), 200
