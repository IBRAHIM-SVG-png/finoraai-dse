import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  PiggyBank, 
  TrendingUp, 
  PieChart as PieIcon, 
  Sparkles,
  ChevronRight,
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/MetricCard';
import HealthScoreBadge from '../components/HealthScoreBadge';
import AlertsBanner from '../components/AlertsBanner';

const CATEGORY_COLORS = [
  '#06b6d4', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#f43f5e', '#64748b'
];

export default function Dashboard({ onNavigate, onOpenNewTx }) {
  const { formatCurrency, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [budgetsData, setBudgetsData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, budgetsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getBudgets()
      ]);
      setData(summaryRes);
      setBudgetsData(budgetsRes.budgets || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid rgba(6, 182, 212, 0.2)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>Analyzing real-time financial metrics...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const healthScore = data?.health_score;
  const recentTransactions = data?.recent_transactions || [];
  const monthlyTrend = data?.monthly_trend || [];
  const categorySpending = data?.category_spending || [];

  // Active budget alerts
  const warningBudgets = budgetsData.filter(b => b.is_warning);
  const exceededBudgets = budgetsData.filter(b => b.is_exceeded);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Real-time Budget & Overspend Alerts */}
      <AlertsBanner 
        warnings={warningBudgets} 
        exceeded={exceededBudgets} 
        onNavigate={onNavigate} 
      />

      {/* Hero Welcome & Quick Future Sim Banner */}
      <div 
        className="glass-panel"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(16, 24, 40, 0.85) 0%, rgba(20, 32, 60, 0.7) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-cyan">Intelligent Forecast Engine</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Rule-based AI v1.0</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
            Hello, {user?.full_name?.split(' ')[0] || 'Investor'}!
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Your monthly savings rate is currently <strong style={{ color: '#38bdf8' }}>{metrics.savings_rate_pct}%</strong>. Explore how your wealth compounds over the next 1 to 10 years.
          </p>
        </div>

        <button 
          onClick={() => onNavigate('simulator')}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <TrendingUp size={17} />
          <span>Launch Future Simulator</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Top Core Metrics Grid */}
      <div className="grid-cards-4">
        <MetricCard
          icon={Wallet}
          iconColor="#06b6d4"
          iconBg="rgba(6, 182, 212, 0.12)"
          label="Total Balance (Liquid)"
          value={formatCurrency(metrics.total_balance)}
          subtext="Net cumulative liquidity"
          badgeText="Active Net"
          badgeType="cyan"
        />

        <MetricCard
          icon={ArrowUpRight}
          iconColor="#10b981"
          iconBg="rgba(16, 185, 129, 0.12)"
          label="Monthly Income"
          value={formatCurrency(metrics.monthly_income)}
          subtext={`Yearly: ${formatCurrency(metrics.yearly_income)}`}
          trend="+ Inflow"
          trendPositive={true}
        />

        <MetricCard
          icon={ArrowDownRight}
          iconColor="#f43f5e"
          iconBg="rgba(244, 63, 94, 0.12)"
          label="Monthly Expenses"
          value={formatCurrency(metrics.monthly_expenses)}
          subtext={`Yearly: ${formatCurrency(metrics.yearly_expenses)}`}
          trend="- Outflow"
          trendPositive={false}
        />

        <MetricCard
          icon={PiggyBank}
          iconColor="#8b5cf6"
          iconBg="rgba(139, 92, 246, 0.12)"
          label="Monthly Net Savings"
          value={formatCurrency(metrics.monthly_savings)}
          trend={`${metrics.savings_rate_pct}% rate`}
          trendPositive={metrics.savings_rate_pct >= 20}
          badgeText={metrics.savings_rate_pct >= 20 ? 'Optimal' : 'Needs Boost'}
          badgeType={metrics.savings_rate_pct >= 20 ? 'emerald' : 'amber'}
        />
      </div>

      {/* Secondary Metrics & Health Score Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <HealthScoreBadge healthData={healthScore} />

        <div className="glass-panel" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Monthly Budget Utilization
              </span>
              <span className={`badge ${metrics.budget_utilization_pct > 100 ? 'badge-rose' : (metrics.budget_utilization_pct >= 80 ? 'badge-amber' : 'badge-emerald')}`}>
                {metrics.budget_utilization_pct}% Used
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                {formatCurrency(metrics.monthly_expenses)}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                of {formatCurrency(metrics.total_monthly_budget)} limit
              </span>
            </div>

            <div className="progress-container" style={{ height: '8px', margin: '8px 0 12px 0' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${Math.min(100, metrics.budget_utilization_pct)}%`,
                  background: metrics.budget_utilization_pct > 100 
                    ? '#f43f5e' 
                    : (metrics.budget_utilization_pct >= 80 ? '#f59e0b' : 'linear-gradient(90deg, #06b6d4, #10b981)')
                }} 
              />
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '0.78rem',
            color: 'var(--text-dim)',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <span>Remaining: <strong style={{ color: '#fff' }}>{formatCurrency(Math.max(0, metrics.total_monthly_budget - metrics.monthly_expenses))}</strong></span>
            <button 
              onClick={() => onNavigate('budgets')}
              style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontWeight: 600, padding: 0 }}
            >
              Manage Budgets →
            </button>
          </div>
        </div>
      </div>

      {/* Charts Section: Inflow vs Outflow & Category Spending Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
        {/* Inflow vs Outflow Historical Trend */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Cash Flow Trajectory</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Monthly income vs expense trend</p>
            </div>
            <span className="badge badge-blue">Last 6 Months</span>
          </div>

          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="month_period" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ background: '#0e1628', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', fontSize: '0.8rem', color: '#fff' }}
                  formatter={(value) => [formatCurrency(value), '']}
                />
                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Expense Category Breakdown */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Category Allocation</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Current month spending distribution</p>
            </div>
            <span className="badge badge-cyan">{categorySpending.length} Categories</span>
          </div>

          {categorySpending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No expenses recorded this month yet.
            </div>
          ) : (
            <div style={{ width: '100%', height: '260px', display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpending}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {categorySpending.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} stroke="rgba(0,0,0,0.4)" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#0e1628', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', fontSize: '0.8rem', color: '#fff' }}
                    formatter={(val) => [formatCurrency(val), 'Spent']}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '10px', overflowY: 'auto', maxHeight: '240px' }}>
                {categorySpending.slice(0, 6).map((item, idx) => (
                  <div key={item.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                      <span style={{ color: 'var(--text-main)' }}>{item.category}</span>
                    </div>
                    <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Recent Activity</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Latest transactions recorded</p>
          </div>
          <button 
            onClick={() => onNavigate('transactions')}
            className="btn btn-sm btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)' }}>
            No recent transactions found. Click "+ Add Transaction" to start.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: isIncome ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {isIncome ? <ArrowUpRight size={15} color="#34d399" /> : <ArrowDownRight size={15} color="#fb7185" />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{tx.description || tx.category}</div>
                            {tx.is_recurring ? <span style={{ fontSize: '0.68rem', color: '#38bdf8' }}>Recurring Monthly</span> : null}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                          {tx.category}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {tx.date}
                      </td>
                      <td style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                        {tx.payment_method || 'UPI'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: isIncome ? '#34d399' : '#fb7185', fontSize: '0.92rem' }}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
