import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  PieChart, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Lightbulb, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BudgetModal from '../components/BudgetModal';

export default function BudgetPlanner() {
  const { formatCurrency } = useAuth();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [expandedTips, setExpandedTips] = useState({});

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.getBudgets(selectedMonth);
      setBudgets(res.budgets || []);
      setSummary(res.summary);
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTips = (cat) => {
    setExpandedTips(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Remove this category budget?')) {
      try {
        await api.deleteBudget(id);
        fetchBudgets();
      } catch (err) {
        alert(err.message || 'Failed to delete budget');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Month Selector */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PieChart size={20} color="#06b6d4" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Smart Budget Planner</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Category thresholds, remaining allocations & 80% overrun warnings
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="month"
            className="form-input"
            style={{ width: 'auto' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />

          <button
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* Aggregate Overview Card */}
      {summary && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '18px'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Monthly Cap</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                {formatCurrency(summary.total_budget)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Actual Spend to Date</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: summary.total_spent > summary.total_budget ? '#fb7185' : '#38bdf8', marginTop: '2px' }}>
                {formatCurrency(summary.total_spent)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remaining Budget</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: summary.total_remaining >= 0 ? '#34d399' : '#fb7185', marginTop: '2px' }}>
                {formatCurrency(summary.total_remaining)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status & Flags</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                {summary.exceeded_count > 0 && (
                  <span className="badge badge-rose">{summary.exceeded_count} Exceeded</span>
                )}
                {summary.warning_count > 0 && (
                  <span className="badge badge-amber">{summary.warning_count} at &gt;80%</span>
                )}
                {summary.exceeded_count === 0 && summary.warning_count === 0 && (
                  <span className="badge badge-emerald">All Disciplined</span>
                )}
              </div>
            </div>
          </div>

          <div className="progress-container" style={{ height: '10px' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, summary.overall_percentage)}%`,
                background: summary.overall_percentage > 100 
                  ? '#f43f5e' 
                  : (summary.overall_percentage >= 80 ? '#f59e0b' : 'linear-gradient(90deg, #06b6d4, #10b981)')
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            <span>{summary.overall_percentage}% of total monthly budget consumed</span>
            <span>Month: {selectedMonth}</span>
          </div>
        </div>
      )}

      {/* Category Budgets Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          Loading category budgets...
        </div>
      ) : budgets.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-dim)' }}>
          <PieChart size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No Budgets Configured for {selectedMonth}</h3>
          <p style={{ fontSize: '0.84rem', marginBottom: '18px' }}>
            Set category limits to track actual spending, trigger overrun warnings, and receive practical saving tips.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={16} /> Set First Budget
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {budgets.map((b) => {
            const isExceeded = b.is_exceeded;
            const isWarning = b.is_warning;
            const hasTips = b.practical_tips && b.practical_tips.length > 0;
            const isTipsOpen = expandedTips[b.category];

            return (
              <div 
                key={b.id}
                className="glass-panel"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isExceeded 
                    ? '1px solid rgba(244, 63, 94, 0.4)' 
                    : (isWarning ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-glass)')
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
                        {b.category}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isExceeded ? (
                        <span className="badge badge-rose">
                          <AlertCircle size={13} /> Exceeded ({b.percentage}%)
                        </span>
                      ) : isWarning ? (
                        <span className="badge badge-amber">
                          <AlertTriangle size={13} /> Warning ({b.percentage}%)
                        </span>
                      ) : (
                        <span className="badge badge-emerald">
                          <CheckCircle size={13} /> Healthy ({b.percentage}%)
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteBudget(b.id)}
                        title="Delete Budget"
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Spent: </span>
                      <strong style={{ fontSize: '1.1rem', color: isExceeded ? '#fb7185' : '#fff' }}>
                        {formatCurrency(b.actual_spent)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Limit: </span>
                      <span style={{ fontSize: '0.92rem', color: 'var(--text-dim)' }}>
                        {formatCurrency(b.monthly_limit)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-container" style={{ height: '8px', marginBottom: '10px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, b.percentage)}%`,
                        background: isExceeded 
                          ? '#f43f5e' 
                          : (isWarning ? '#f59e0b' : 'linear-gradient(90deg, #06b6d4, #10b981)')
                      }}
                    />
                  </div>

                  <div style={{ fontSize: '0.8rem', color: b.remaining < 0 ? '#fb7185' : 'var(--text-dim)', marginBottom: '14px' }}>
                    {b.remaining < 0 ? (
                      <span>Over budget by <strong>{formatCurrency(Math.abs(b.remaining))}</strong>!</span>
                    ) : (
                      <span><strong>{formatCurrency(b.remaining)}</strong> remaining for {b.category}</span>
                    )}
                  </div>
                </div>

                {/* Practical Reduction Tips Toggle */}
                {hasTips && (
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <button
                      onClick={() => toggleTips(b.category)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: 0
                      }}
                    >
                      <Lightbulb size={14} color="#f59e0b" />
                      <span>Practical Ways to Reduce Expenses</span>
                      {isTipsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isTipsOpen && (
                      <ul style={{
                        marginTop: '10px',
                        paddingLeft: '18px',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        {b.practical_tips.map((tip, idx) => (
                          <li key={idx} style={{ lineHeight: 1.4 }}>{tip}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSuccess={fetchBudgets}
        initialData={editingBudget}
      />
    </div>
  );
}
