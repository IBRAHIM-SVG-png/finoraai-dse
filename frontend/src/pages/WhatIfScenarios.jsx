import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldAlert, 
  PiggyBank, 
  Sparkles,
  CheckCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function WhatIfScenarios() {
  const { formatCurrency, currencySymbol } = useAuth();
  
  const [params, setParams] = useState({
    current_savings: 100000,
    monthly_income: 70000,
    monthly_expenses: 35000,
    income_growth_pct: 5.0,
    expense_growth_pct: 4.0,
    monthly_contribution: 5000,
    investment_return_pct: 9.0,
    duration_months: 24, // 2 years comparison
    boost_savings_amt: 2000,
    emergency_expense_amt: 50000
  });

  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runComparison();
  }, [params.duration_months, params.boost_savings_amt, params.emergency_expense_amt]);

  const runComparison = async () => {
    setLoading(true);
    try {
      const res = await api.runWhatIf(params);
      setComparisonData(res.data);
    } catch (err) {
      console.error('Failed to run what-if comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const scenarios = comparisonData?.scenarios || [];
  const chartData = comparisonData?.chart_data || [];

  const lineColors = {
    Baseline: '#94a3b8',
    Cut_Expenses_10pct: '#10b981',
    Extra_Savings_Boost: '#06b6d4',
    Income_Plus_10pct: '#8b5cf6',
    Emergency_Shock: '#f43f5e'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
          }}>
            <GitCompare size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>What-If Scenario Comparison</h2>
              <span className="badge badge-violet">Decision Simulator</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Evaluate how strategic behavior adjustments (cutting costs, boosting savings, earning more) transform your ending wealth.
            </p>
          </div>
        </div>

        {/* Duration selector */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px' }}>
          {[12, 24, 36, 60].map((m) => (
            <button
              key={m}
              onClick={() => setParams({ ...params, duration_months: m })}
              style={{
                background: params.duration_months === m ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                color: params.duration_months === m ? '#c084fc' : 'var(--text-muted)',
                border: params.duration_months === m ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {m / 12} {m === 12 ? 'Year' : 'Years'}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Comparison Multi-Line Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Comparative Wealth Projections</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Tracking ending savings trajectories across 5 distinct financial life paths
            </p>
          </div>
          <span className="badge badge-blue">{params.duration_months} Months Horizon</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            Simulating comparative scenarios...
          </div>
        ) : (
          <div style={{ width: '100%', height: '360px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v >= 100000 ? (v/100000).toFixed(1) + 'L' : (v/1000).toFixed(0) + 'k')}`} 
                />
                <Tooltip 
                  contentStyle={{ background: '#0e1628', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', fontSize: '0.82rem', color: '#fff' }}
                  formatter={(val, name) => [formatCurrency(val), name.replace(/_/g, ' ')]}
                />
                <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '12px' }} />
                
                <Line type="monotone" dataKey="Baseline" stroke={lineColors.Baseline} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Cut_Expenses_10pct" stroke={lineColors.Cut_Expenses_10pct} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Extra_Savings_Boost" stroke={lineColors.Extra_Savings_Boost} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Income_Plus_10pct" stroke={lineColors.Income_Plus_10pct} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Emergency_Shock" stroke={lineColors.Emergency_Shock} strokeDasharray="4 4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Scenario Breakdown Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '18px'
      }}>
        {scenarios.map((s) => {
          const isBaseline = s.id === 'baseline';
          const isPositive = s.difference_vs_baseline > 0;
          const isNegative = s.difference_vs_baseline < 0;

          return (
            <div
              key={s.id}
              className="glass-panel"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: isBaseline 
                  ? '1px solid rgba(255, 255, 255, 0.12)' 
                  : (isPositive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)')
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className={`badge badge-${s.badge_color}`}>
                    {s.tag}
                  </span>
                  {!isBaseline && (
                    <span style={{ 
                      fontSize: '0.82rem', 
                      fontWeight: 700, 
                      color: isPositive ? '#34d399' : '#fb7185' 
                    }}>
                      {isPositive ? '+' : ''}{formatCurrency(s.difference_vs_baseline)} vs Baseline
                    </span>
                  )}
                </div>

                <h4 style={{ fontSize: '1.05rem', margin: '4px 0 6px 0', color: '#fff' }}>
                  {s.name}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                  {s.description}
                </p>
              </div>

              <div style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Projected Liquid Savings</div>
                  <strong style={{ fontSize: '1rem', color: '#fff' }}>{formatCurrency(s.final_cash)}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Invested Portfolio</div>
                  <strong style={{ fontSize: '1rem', color: '#38bdf8' }}>{formatCurrency(s.final_invested)}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Scenario Adjustment Inputs */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <h4 style={{ fontSize: '0.95rem', marginBottom: '14px', color: '#fff' }}>
          Tune Scenario Parameters
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <label className="form-label">Extra Savings Boost ({currencySymbol}/mo)</label>
            <input
              type="number"
              step="500"
              className="form-input"
              value={params.boost_savings_amt}
              onChange={(e) => setParams({ ...params, boost_savings_amt: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div>
            <label className="form-label">Emergency Shock Outlay ({currencySymbol})</label>
            <input
              type="number"
              step="5000"
              className="form-input"
              value={params.emergency_expense_amt}
              onChange={(e) => setParams({ ...params, emergency_expense_amt: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
