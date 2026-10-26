import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Save, 
  Plus, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Target, 
  Layers, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
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

export default function FutureSimulator() {
  const { formatCurrency, currencySymbol } = useAuth();
  
  // Simulation Input Parameters
  const [params, setParams] = useState({
    current_savings: 160000,
    monthly_income: 75000,
    monthly_expenses: 35000,
    income_growth_pct: 6.0,      // 6% p.a.
    expense_growth_pct: 4.5,     // 4.5% inflation p.a.
    monthly_contribution: 8000,  // additional monthly systematic investment
    investment_return_pct: 11.0, // 11% expected return p.a.
    goal_amount: 1200000,        // 12 Lakhs goal
    duration_months: 60,         // 5 years default
    planned_expenses: [
      { month: 6, amount: 65000, description: "Laptop & Setup Upgrade" },
      { month: 24, amount: 120000, description: "International Vacation" }
    ]
  });

  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingScenario, setSavingScenario] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [scenarioName, setScenarioName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // One-time expense input state
  const [newExpense, setNewExpense] = useState({ month: 12, amount: '', description: '' });

  useEffect(() => {
    runSim();
    fetchSavedScenarios();
  }, [params.duration_months]);

  const runSim = async () => {
    setLoading(true);
    try {
      const res = await api.runSimulation(params);
      setSimulationResult(res.data);
    } catch (err) {
      console.error('Simulation calculation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedScenarios = async () => {
    try {
      const res = await api.getSavedScenarios();
      setSavedScenarios(res.scenarios || []);
    } catch (e) {
      console.error('Failed to fetch scenarios:', e);
    }
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const amt = parseFloat(newExpense.amount);
    const m = parseInt(newExpense.month, 10);
    if (!amt || amt <= 0 || !m || m < 1) return;

    const updated = [
      ...params.planned_expenses,
      { month: m, amount: amt, description: newExpense.description || 'One-time expense' }
    ];
    setParams(prev => ({ ...prev, planned_expenses: updated }));
    setNewExpense({ month: Math.min(params.duration_months, m + 6), amount: '', description: '' });
  };

  const handleRemoveExpense = (index) => {
    const updated = params.planned_expenses.filter((_, idx) => idx !== index);
    setParams(prev => ({ ...prev, planned_expenses: updated }));
  };

  const handleSaveScenario = async (e) => {
    e.preventDefault();
    if (!scenarioName.trim()) return;

    setSavingScenario(true);
    try {
      await api.saveScenario({
        ...params,
        name: scenarioName.trim()
      });
      setShowSaveModal(false);
      setScenarioName('');
      fetchSavedScenarios();
      alert('Simulation scenario saved successfully!');
    } catch (err) {
      alert(err.message || 'Failed to save scenario');
    } finally {
      setSavingScenario(false);
    }
  };

  const loadScenario = (s) => {
    setParams({
      current_savings: s.current_savings,
      monthly_income: s.monthly_income,
      monthly_expenses: s.monthly_expenses,
      income_growth_pct: s.income_growth_pct,
      expense_growth_pct: s.expense_growth_pct,
      monthly_contribution: s.monthly_contribution,
      investment_return_pct: s.investment_return_pct,
      goal_amount: s.goal_amount,
      duration_months: s.duration_months,
      planned_expenses: s.planned_expenses || []
    });
  };

  const summary = simulationResult?.summary || {};
  const timeline = simulationResult?.timeline || [];
  const bestTimeline = simulationResult?.best_case_timeline || [];
  const worstTimeline = simulationResult?.worst_case_timeline || [];

  // Merge timeline with best/worst for multi-band chart
  const combinedChartData = timeline.map((item, index) => ({
    month: `M${item.month}`,
    month_num: item.month,
    Invested_Portfolio: item.invested_wealth,
    Liquid_Cash_Savings: item.cash_savings,
    Best_Case: bestTimeline[index]?.invested_wealth || item.invested_wealth,
    Worst_Case: worstTimeline[index]?.invested_wealth || item.invested_wealth,
    Goal_Target: item.goal_target
  }));

  const durationOptions = [
    { label: '6 Months', value: 6 },
    { label: '1 Year', value: 12 },
    { label: '3 Years', value: 36 },
    { label: '5 Years', value: 60 },
    { label: '10 Years', value: 120 }
  ];

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
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
          }}>
            <TrendingUp size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Future Financial Simulator</h2>
              <span className="badge badge-cyan">Core Engine</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Multi-scenario wealth forecasting, compound growth, and Monte Carlo goal probability
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowSaveModal(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={16} />
            <span>Save Scenario</span>
          </button>
          
          <button
            onClick={runSim}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={16} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* Duration Selector Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px',
        background: 'rgba(16, 24, 40, 0.6)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-glass)',
        borderRadius: '14px',
        width: 'fit-content'
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '10px', paddingRight: '6px', fontWeight: 600 }}>
          Simulation Horizon:
        </span>
        {durationOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setParams({ ...params, duration_months: opt.value })}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: params.duration_months === opt.value ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent',
              background: params.duration_months === opt.value 
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)' 
                : 'transparent',
              color: params.duration_months === opt.value ? '#38bdf8' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Primary KPI Results Cards */}
      <div className="grid-cards-4">
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Projected Invested Wealth</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            {formatCurrency(summary.final_invested_wealth)}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            At {params.investment_return_pct}% p.a. compounding
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Liquid Cash Savings</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            {formatCurrency(summary.final_cash_savings)}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            Without investment return (Cash pot)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Compound Wealth Gain</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#c084fc', marginTop: '4px' }}>
            +{formatCurrency(summary.wealth_gain_from_investment)}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            Extra gain created via compounding
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Goal Achievement Probability</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: summary.goal_probability_pct >= 75 ? '#34d399' : (summary.goal_probability_pct >= 50 ? '#fbbf24' : '#fb7185'), marginTop: '4px' }}>
            {summary.goal_probability_pct !== null ? `${summary.goal_probability_pct}%` : 'N/A'}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            Monte Carlo (1,000 trials with volatility)
          </div>
        </div>
      </div>

      {/* Main Interactive Forecast Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Projected Wealth Trajectory (Month-by-Month)</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Comparing Invested Portfolio, Base Liquid Savings, Best-Case and Worst-Case scenarios
            </p>
          </div>
          
          {summary.goal_reached_month_invested && (
            <span className="badge badge-emerald">
              🎯 Goal Reached at Month {summary.goal_reached_month_invested}
            </span>
          )}
        </div>

        <div style={{ width: '100%', height: '380px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
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
                formatter={(val) => [formatCurrency(val), '']}
              />
              <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '12px' }} />
              
              <Area type="monotone" dataKey="Best_Case" name="Best-Case Portfolio" stroke="#38bdf8" strokeDasharray="4 4" fill="transparent" strokeWidth={1.5} />
              <Area type="monotone" dataKey="Invested_Portfolio" name="Invested Portfolio (Base)" stroke="#06b6d4" fillOpacity={1} fill="url(#colorInvested)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="Liquid_Cash_Savings" name="Liquid Cash Savings" stroke="#10b981" fillOpacity={1} fill="url(#colorCash)" strokeWidth={2} />
              <Area type="monotone" dataKey="Worst_Case" name="Worst-Case Portfolio" stroke="#f43f5e" strokeDasharray="4 4" fill="transparent" strokeWidth={1.5} />
              {params.goal_amount > 0 && (
                <Line type="monotone" dataKey="Goal_Target" name="Goal Target" stroke="#eab308" strokeWidth={2} dot={false} strokeDasharray="6 6" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Assumptions & Mathematical Formula Note */}
        <div style={{
          marginTop: '18px',
          padding: '14px 18px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <HelpCircle size={18} color="#06b6d4" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>
              Transparent Mathematical Principles:
            </strong>
            Cash Savings = Starting + Σ(Income<sub>m</sub> - Expenses<sub>m</sub> + Contribution<sub>m</sub> - OneTime<sub>m</sub>). 
            Invested Wealth incorporates compounded monthly return at r<sub>m</sub> = (1 + r)<sup>1/12</sup> - 1. 
            <em> Disclaimer: Investment projections are statistical estimates based on historical equity returns and do not represent guaranteed earnings.</em>
          </div>
        </div>
      </div>

      {/* Two Column Section: Interactive Sliders & Planned One-time Expenses */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        
        {/* Interactive Parameter Sliders & Inputs */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '18px' }}>Simulation Parameters & Assumptions</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Current Savings */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Starting Savings</span>
                <strong style={{ color: '#fff' }}>{formatCurrency(params.current_savings)}</strong>
              </div>
              <input
                type="range"
                className="range-slider"
                min="0"
                max="1000000"
                step="5000"
                value={params.current_savings}
                onChange={(e) => setParams({ ...params, current_savings: parseFloat(e.target.value) })}
              />
            </div>

            {/* Monthly Income & Expenses */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="form-label">Monthly Income ({currencySymbol})</label>
                <input
                  type="number"
                  className="form-input"
                  value={params.monthly_income}
                  onChange={(e) => setParams({ ...params, monthly_income: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="form-label">Monthly Expenses ({currencySymbol})</label>
                <input
                  type="number"
                  className="form-input"
                  value={params.monthly_expenses}
                  onChange={(e) => setParams({ ...params, monthly_expenses: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Expected Growth Rates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Income Growth (%/yr)</span>
                  <strong style={{ color: '#34d399' }}>{params.income_growth_pct}%</strong>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  min="0"
                  max="20"
                  step="0.5"
                  value={params.income_growth_pct}
                  onChange={(e) => setParams({ ...params, income_growth_pct: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Expense Inflation (%/yr)</span>
                  <strong style={{ color: '#fb7185' }}>{params.expense_growth_pct}%</strong>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  min="0"
                  max="15"
                  step="0.5"
                  value={params.expense_growth_pct}
                  onChange={(e) => setParams({ ...params, expense_growth_pct: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {/* Extra Monthly Contribution & Investment Return */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="form-label">Extra Monthly Contribution ({currencySymbol})</label>
                <input
                  type="number"
                  className="form-input"
                  value={params.monthly_contribution}
                  onChange={(e) => setParams({ ...params, monthly_contribution: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="form-label">Assumed Return (% p.a.)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={params.investment_return_pct}
                  onChange={(e) => setParams({ ...params, investment_return_pct: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Goal Target */}
            <div>
              <label className="form-label">Target Financial Goal Amount ({currencySymbol})</label>
              <input
                type="number"
                step="10000"
                className="form-input"
                placeholder="e.g. 1500000"
                value={params.goal_amount}
                onChange={(e) => setParams({ ...params, goal_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Planned One-Time Expenses Schedule */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Planned One-Time Capital Outlays</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Scheduled lumpy purchases (e.g. vehicle, laptop, tuition)
                </p>
              </div>
              <span className="badge badge-amber">{params.planned_expenses.length} Planned</span>
            </div>

            {/* Add New Expense Form */}
            <form onSubmit={handleAddExpense} style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '14px',
              borderRadius: '12px',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>At Month Number</label>
                  <input
                    type="number"
                    min="1"
                    max={params.duration_months}
                    required
                    className="form-input"
                    placeholder="e.g. 6"
                    value={newExpense.month}
                    onChange={(e) => setNewExpense({ ...newExpense, month: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Cost ({currencySymbol})</label>
                  <input
                    type="number"
                    min="100"
                    required
                    className="form-input"
                    placeholder="50000"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Description</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Laptop upgrade, Vacation"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                    <Plus size={15} /> Add
                  </button>
                </div>
              </div>
            </form>

            {/* List of Scheduled Expenses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {params.planned_expenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                  No planned one-time capital expenses added.
                </div>
              ) : (
                params.planned_expenses.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-glass)',
                      fontSize: '0.84rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{item.description}</div>
                      <div style={{ fontSize: '0.74rem', color: '#38bdf8' }}>Scheduled in Month {item.month}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ color: '#fb7185' }}>-{formatCurrency(item.amount)}</strong>
                      <button
                        type="button"
                        onClick={() => handleRemoveExpense(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Saved Scenarios Quick Switcher */}
          {savedScenarios.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                Saved Profiles:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {savedScenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadScenario(s)}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Scenario Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Save Simulation Scenario</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Give this simulation setup a name so you can reload it at any time.
            </p>
            <form onSubmit={handleSaveScenario}>
              <div className="form-group">
                <label className="form-label">Scenario Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. 5-Year Aggressive Equity, Conservative Debt Plan"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowSaveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={savingScenario}
                >
                  {savingScenario ? 'Saving...' : 'Save Scenario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
