# INTELLIGENT PERSONAL FINANCE AND FUTURE SIMULATION SYSTEM

A full-stack Department of Software Engineering (DSE) capstone application engineered to help individuals manage income, daily expenses, category budgets, and financial milestones—paired with a future financial simulation engine that models multi-year wealth accumulation, stress tests what-if decisions, and calculates statistical goal achievement probabilities.

---

## 1. System Architecture & Tech Stack

```
                                  +-------------------------------------------------------+
                                  |                 React + Vite Frontend                 |
                                  |   (Dark Navy Frosted Glassmorphism, Recharts, Lucide) |
                                  +-------------------------------------------------------+
                                                              |
                                                    REST APIs (JSON / JWT)
                                                              |
                                  +-------------------------------------------------------+
                                  |                  Python Flask Backend                 |
                                  |   (Modular Blueprints, SQLite ORM Layer, Werkzeug)    |
                                  +-------------------------------------------------------+
                                                              |
                                      +-----------------------+-----------------------+
                                      |                                               |
                        +---------------------------+                   +---------------------------+
                        | Financial Math Engine     |                   | SQLite Relational DB      |
                        | - Future Month Simulator  |                   | - users                   |
                        | - Monte Carlo Probability |                   | - transactions            |
                        | - 50/30/20 Rule Analyzer  |                   | - budgets                 |
                        | - What-If Scenario Matrix |                   | - financial_goals         |
                        | - Health Scoring Heuristic|                   | - simulation_scenarios    |
                        +---------------------------+                   +---------------------------+
```

### Technology Highlights
- **Frontend**: React.js with Vite, custom Vanilla CSS Frosted Glassmorphism design system (`backdrop-filter: blur(16px)`), Recharts for responsive visualizations, Lucide React icons.
- **Backend**: Python Flask 3.x with REST Blueprints, safe parameterized queries with SQLite3, Werkzeug password hashing.
- **Mathematical Computation**: NumPy & Pandas for statistical modeling, Monte Carlo simulation, and transactional aggregation.
- **Data Persistence**: SQLite relational database with cascading foreign keys and indexing.

---

## 2. Core Mathematical Models & Formulas

### A. Ending Liquid Savings (Cash Pot)
When no capital growth or interest is assumed on cash reserves:

$$\text{Ending Savings}_m = \text{Starting Savings}_{m-1} + \text{Income}_m - \text{Expenses}_m + \text{Contribution}_m - \text{OneTimeExpenses}_m$$

Where:
- $\text{Income}_m = \text{Income}_{m-1} \times (1 + g_{\text{inc}})$, with monthly growth $g_{\text{inc}} = (1 + G_{\text{annual}})^{1/12} - 1$
- $\text{Expenses}_m = \text{Expenses}_{m-1} \times (1 + g_{\text{exp}})$, with monthly inflation $g_{\text{exp}} = (1 + I_{\text{annual}})^{1/12} - 1$

### B. Invested Wealth Compounding (Portfolio Projection)
Models investments subject to an assumed annual return $r_{\text{annual}}$ compounded monthly:

$$r_m = (1 + r_{\text{annual}})^{\frac{1}{12}} - 1$$

$$\text{Portfolio}_m = \text{Portfolio}_{m-1} \times (1 + r_m) + \max(0, \text{Surplus}_m) - \text{OneTimeExpenses}_m$$

*Transparent Assumption Disclaimer*: Distinguishes guaranteed liquid cash accumulation from market-based equity/SIP projections, which are subject to volatility and never presented as guaranteed returns.

### C. Monte Carlo Goal Achievement Probability
Rather than assuming a static rate of return, the system executes **1,000 stochastic trials** using NumPy where monthly returns and income growths are subjected to normal distribution variance:
- Return shock: $r \sim \mathcal{N}\left(r_m, \sigma=0.025\right)$
- Growth shock: $g \sim \mathcal{N}\left(g_m, \sigma=0.005\right)$

$$\text{Probability (\%)} = \frac{\sum_{i=1}^{N} \mathbb{I}(\text{Portfolio}_{m, i} \ge \text{Goal Amount})}{N} \times 100\%$$

### D. Financial Health Scoring Matrix (0 to 100)
1. **Savings Rate Component (35 pts)**: $\ge 30\% \rightarrow 35\text{ pts}$, $\ge 20\% \rightarrow 30\text{ pts}$, $\ge 10\% \rightarrow 20\text{ pts}$, $>0\% \rightarrow 10\text{ pts}$.
2. **Emergency Runway Component (25 pts)**: $\text{Savings} / \text{Monthly Expenses}$. $\ge 6\text{ months} \rightarrow 25\text{ pts}$, $\ge 3\text{ months} \rightarrow 18\text{ pts}$, $\ge 1\text{ month} \rightarrow 10\text{ pts}$.
3. **Budget Adherence Component (20 pts)**: Overspending penalty; $\le 80\% \text{ used} \rightarrow 20\text{ pts}$, $\le 100\% \rightarrow 14\text{ pts}$, $>100\% \rightarrow 2\text{ pts}$.
4. **Goals on Track Component (20 pts)**: Proportional to active milestones meeting monthly required deposits.

---

## 3. Module-by-Module Walkthrough (For College Faculty Demo)

| Module | Purpose & Technical Highlight |
|---|---|
| **1. Authentication** | Registration and Login with secure salted hashing via `werkzeug.security` and tamper-proof bearer token authorization. Isolated user multi-tenancy. |
| **2. Personal Finance Dashboard** | Real-time aggregate view featuring KPI metric cards, Financial Health Score breakdown modal, 6-month cash flow trajectory bar chart, and category donut chart. |
| **3. Transactions Management** | Full CRUD capabilities. Filter by Category, Type (Income/Expense), Search keywords, and Sort by Amount/Date. Automatic monthly & yearly roll-up totals. |
| **4. Smart Budget Planner** | Sets monthly category spending limits. Features visual progress bars, **80% threshold warning badges**, **overspend alert banners**, and category-specific practical expense reduction tips. |
| **5. AI Financial Advisor** | Rule-based explainable diagnostic engine evaluating spending concentration against the 50/30/20 benchmark, wasteful micro-transaction detection, and interactive natural-language Q&A. |
| **6. Future Financial Simulator (Core)** | Dynamic simulator computing month-by-month cash savings and invested wealth across 6m, 1y, 3y, 5y, and 10y horizons. Includes planned one-time expense scheduling, best/worst-case multi-bands, and Monte Carlo goal probability. |
| **7. What-If Scenarios** | Side-by-side life path comparisons: Baseline vs. 10% Expense Cut vs. +₹2,000 Extra Savings vs. +10% Income Boost vs. Unforeseen Emergency Shock (-₹50,000). |
| **8. Financial Goals Tracker** | Milestone tracker calculating required monthly savings to meet target dates, flagging at-risk milestones if requirements exceed monthly surplus, and supporting direct deposit recording. |
| **9. Reports & CSV Export** | Audit reports covering weekly, monthly, and yearly timeframes, payment channel breakdowns, and direct transaction ledger downloads in raw CSV format. |
| **10. Settings & Preferences** | Currency customization (INR ₹, USD $, EUR €, GBP £), monthly target preference, and secure two-factor string confirmation (`RESET`) data purge. |

---

## 4. Database Schema (SQLite)

- **`users`**: `id`, `username`, `email`, `password_hash`, `full_name`, `currency`, `monthly_savings_target`, `created_at`
- **`transactions`**: `id`, `user_id`, `date`, `amount`, `category`, `type` (`income`/`expense`), `description`, `payment_method`, `is_recurring`
- **`budgets`**: `id`, `user_id`, `category`, `monthly_limit`, `month_year`
- **`financial_goals`**: `id`, `user_id`, `title`, `category`, `target_amount`, `current_amount`, `target_date`, `priority`, `notes`, `status`
- **`simulation_scenarios`**: `id`, `user_id`, `name`, `current_savings`, `monthly_income`, `monthly_expenses`, `income_growth_pct`, `expense_growth_pct`, `monthly_contribution`, `planned_expenses_json`, `goal_amount`, `investment_return_pct`, `duration_months`

---

## 5. Quick Start Instructions (Windows PowerShell)

### Prerequisites
- Python 3.10+ installed
- Node.js 18+ and npm installed

### Option A: One-Click PowerShell Launcher
Open PowerShell in the project root directory (`harsha/`) and run:
```powershell
.\run.ps1
```

### Option B: Manual Step-by-Step Setup

#### Step 1: Backend Setup
```powershell
cd backend
python -m pip install -r requirements.txt
python seed_data.py
python app.py
```
*Backend server runs at:* `http://127.0.0.1:5000`

#### Step 2: Frontend Setup
Open a second PowerShell window:
```powershell
cd frontend
npm install
npm run dev
```
*Frontend runs at:* `http://localhost:5173`

---

## 6. Demonstration Credentials

Pre-seeded with realistic financial records (salary, freelance, rent, groceries, tech goals, and 5-year simulation scenarios):
- **Username**: `demo_user`
- **Password**: `Password123!`
- *(Or register any new account on the registration page)*

---

## 7. Running Automated Test Suite
To verify calculation formulas, compound interest models, budget utilization thresholds, and Monte Carlo probabilities:
```powershell
cd backend
python -m unittest tests/test_calculations.py
```
*Expected Result:*
```
Ran 5 tests in 1.100s
OK
```
