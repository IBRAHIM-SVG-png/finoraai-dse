# Demonstration Data Seeder for Intelligent Personal Finance System
import datetime
from werkzeug.security import generate_password_hash
from database import get_db, init_db

def seed_demo_data():
    init_db()
    
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if demo user exists
        cursor.execute("SELECT id FROM users WHERE username = ?", ("demo_user",))
        existing = cursor.fetchone()
        
        if existing:
            user_id = existing['id']
            print(f"Demo user already exists (id={user_id}). Re-seeding fresh data...")
            cursor.execute("UPDATE users SET full_name = 'DSCS' WHERE id = ?", (user_id,))
            cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM budgets WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM financial_goals WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM simulation_scenarios WHERE user_id = ?", (user_id,))
        else:
            pwd_hash = generate_password_hash("Password123!")
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, full_name, currency, monthly_savings_target)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ("demo_user", "demo@example.com", pwd_hash, "DSCS", "INR", 15000.0))
            user_id = cursor.lastrowid
            print(f"Created demo user with id={user_id}")

        today = datetime.date.today()
        current_month = today.strftime("%Y-%m")
        prev_month_1 = (today.replace(day=1) - datetime.timedelta(days=1)).strftime("%Y-%m")
        prev_month_2 = ((today.replace(day=1) - datetime.timedelta(days=1)).replace(day=1) - datetime.timedelta(days=1)).strftime("%Y-%m")

        # 1. Budgets for current month
        budgets_data = [
            ("Food", 10000.0, current_month),
            ("Transport", 4000.0, current_month),
            ("Shopping", 8000.0, current_month),
            ("Bills", 12000.0, current_month),
            ("Healthcare", 3000.0, current_month),
            ("Entertainment", 3500.0, current_month),
            ("Education", 5000.0, current_month)
        ]
        for cat, limit, ym in budgets_data:
            cursor.execute("""
                INSERT OR REPLACE INTO budgets (user_id, category, monthly_limit, month_year)
                VALUES (?, ?, ?, ?)
            """, (user_id, cat, limit, ym))

        # 2. Financial Goals
        goals_data = [
            ("MacBook Pro M3", "Laptop", 160000.0, 95000.0, (today + datetime.timedelta(days=180)).isoformat(), "High", "Primary engineering machine"),
            ("Emergency Reserve (6 Mos)", "Emergency Fund", 250000.0, 160000.0, (today + datetime.timedelta(days=365)).isoformat(), "High", "Liquid safety buffer in FD/savings"),
            ("Higher Education & Certs", "Education", 75000.0, 45000.0, (today + datetime.timedelta(days=240)).isoformat(), "Medium", "Cloud & AI professional certifications"),
            ("Himachal Trek & Travel", "Travel", 45000.0, 38000.0, (today + datetime.timedelta(days=60)).isoformat(), "Low", "Annual vacation trip with team"),
            ("Electric Scooter", "Vehicle", 120000.0, 35000.0, (today + datetime.timedelta(days=300)).isoformat(), "Medium", "Daily city commute vehicle")
        ]
        for title, cat, target, curr, t_date, prio, notes in goals_data:
            cursor.execute("""
                INSERT INTO financial_goals (user_id, title, category, target_amount, current_amount, target_date, priority, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, title, cat, target, curr, t_date, prio, notes))

        # 3. Transactions spanning current and past 2 months
        sample_transactions = [
            # Current Month Transactions
            (today.replace(day=1).isoformat(), 72000.0, "Salary", "income", "Monthly Software Engineer Salary", "Bank Transfer", 1),
            (today.replace(day=3).isoformat(), 15000.0, "Freelance", "income", "Full-stack UI consulting project", "UPI", 0),
            (today.replace(day=2).isoformat(), 12500.0, "Bills", "expense", "Apartment rent & maintenance", "Net Banking", 1),
            (today.replace(day=4).isoformat(), 2450.0, "Food", "expense", "Monthly supermarket grocery restock", "Card", 0),
            (today.replace(day=6).isoformat(), 850.0, "Food", "expense", "Team lunch at cafe", "UPI", 0),
            (today.replace(day=8).isoformat(), 1400.0, "Transport", "expense", "Metro smart card recharge & auto fares", "UPI", 0),
            (today.replace(day=10).isoformat(), 3499.0, "Shopping", "expense", "Noise-cancelling ergonomic headphones", "Card", 0),
            (today.replace(day=12).isoformat(), 1199.0, "Bills", "expense", "High-speed broadband fiber plan", "UPI", 1),
            (today.replace(day=14).isoformat(), 650.0, "Entertainment", "expense", "Weekend cinema ticket & popcorn", "UPI", 0),
            (today.replace(day=16).isoformat(), 3200.0, "Food", "expense", "Organic groceries & fresh produce", "UPI", 0),
            (today.replace(day=18).isoformat(), 1200.0, "Healthcare", "expense", "Dental checkup and routine vitamins", "Card", 0),
            (today.replace(day=20).isoformat(), 2800.0, "Shopping", "expense", "Casual shirts & office footwear", "Card", 0),
            (today.replace(day=22).isoformat(), 950.0, "Food", "expense", "Dinner takeout with friends", "UPI", 0),
            (today.replace(day=24).isoformat(), 1500.0, "Transport", "expense", "Fuel for weekend city travel", "UPI", 0),

            # Past Month 1 Transactions
            (f"{prev_month_1}-01", 72000.0, "Salary", "income", "Monthly Software Engineer Salary", "Bank Transfer", 1),
            (f"{prev_month_1}-03", 12500.0, "Bills", "expense", "Apartment rent & maintenance", "Net Banking", 1),
            (f"{prev_month_1}-05", 5800.0, "Food", "expense", "Pantry staples and monthly groceries", "UPI", 0),
            (f"{prev_month_1}-09", 4200.0, "Shopping", "expense", "Tech accessories and mechanical keyboard", "Card", 0),
            (f"{prev_month_1}-12", 2100.0, "Transport", "expense", "Cab fares and metro travel", "UPI", 0),
            (f"{prev_month_1}-15", 1199.0, "Bills", "expense", "High-speed broadband plan", "UPI", 1),
            (f"{prev_month_1}-18", 2400.0, "Food", "expense", "Weekend dining out", "UPI", 0),
            (f"{prev_month_1}-22", 1800.0, "Education", "expense", "System design & cloud architecture book", "Card", 0),
            (f"{prev_month_1}-27", 1500.0, "Entertainment", "expense", "Concert tickets", "UPI", 0),

            # Past Month 2 Transactions
            (f"{prev_month_2}-01", 72000.0, "Salary", "income", "Monthly Software Engineer Salary", "Bank Transfer", 1),
            (f"{prev_month_2}-04", 12500.0, "Bills", "expense", "Apartment rent & maintenance", "Net Banking", 1),
            (f"{prev_month_2}-06", 6200.0, "Food", "expense", "Groceries and dining", "UPI", 0),
            (f"{prev_month_2}-11", 3100.0, "Transport", "expense", "Fuel and transit pass", "UPI", 0),
            (f"{prev_month_2}-14", 5100.0, "Shopping", "expense", "Wardrobe refresh", "Card", 0),
            (f"{prev_month_2}-20", 1199.0, "Bills", "expense", "High-speed broadband plan", "UPI", 1),
            (f"{prev_month_2}-25", 2200.0, "Food", "expense", "Family dinner", "UPI", 0)
        ]

        for dt, amt, cat, t_type, desc, method, recur in sample_transactions:
            cursor.execute("""
                INSERT INTO transactions (user_id, date, amount, category, type, description, payment_method, is_recurring)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, dt, amt, cat, t_type, desc, method, recur))

        # 4. Saved Simulation Scenario
        cursor.execute("""
            INSERT INTO simulation_scenarios (
                user_id, name, current_savings, monthly_income, monthly_expenses,
                income_growth_pct, expense_growth_pct, monthly_contribution,
                planned_expenses_json, goal_amount, investment_return_pct, duration_months
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            "5-Year Wealth Accelerator",
            160000.0,
            87000.0,
            38000.0,
            8.0,
            5.0,
            12000.0,
            '[{"month": 6, "amount": 65000, "description": "Laptop Upgrade"}, {"month": 18, "amount": 100000, "description": "Europe Vacation"}]',
            1500000.0,
            11.5,
            60
        ))

        print(f"Successfully seeded {len(sample_transactions)} transactions, {len(budgets_data)} budgets, and {len(goals_data)} goals for demo_user!")

if __name__ == "__main__":
    seed_demo_data()
