import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  Trash2, 
  Edit2, 
  ArrowUpRight,
  Sparkles,
  Trophy
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GoalModal from '../components/GoalModal';

export default function FinancialGoals() {
  const { formatCurrency, currencySymbol } = useAuth();
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Quick Deposit State
  const [depositGoalId, setDepositGoalId] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.getGoals();
      setGoals(res.goals || []);
      setSummary(res.summary);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSubmit = async (e, goalId) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;

    try {
      await api.depositGoal(goalId, amt);
      setDepositGoalId(null);
      setDepositAmount('');
      fetchGoals();
    } catch (err) {
      alert(err.message || 'Deposit failed');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Are you sure you want to delete this financial goal?')) {
      try {
        await api.deleteGoal(id);
        fetchGoals();
      } catch (err) {
        alert(err.message || 'Failed to delete goal');
      }
    }
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
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
          }}>
            <Target size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Financial Goals Tracker</h2>
              <span className="badge badge-emerald">Milestone Planner</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Track progress toward major milestones, required monthly contributions, and risk status.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>New Goal</span>
        </button>
      </div>

      {/* Aggregate Goal Progress Banner */}
      {summary && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '18px'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Target Cumulative</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                {formatCurrency(summary.total_target_amount)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Saved to Date</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                {formatCurrency(summary.total_current_amount)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cumulative Completion</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                {summary.overall_progress_pct}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status Indicators</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <span className="badge badge-emerald">{summary.achieved_count} Achieved</span>
                {summary.at_risk_count > 0 && (
                  <span className="badge badge-rose">{summary.at_risk_count} At Risk</span>
                )}
              </div>
            </div>
          </div>

          <div className="progress-container" style={{ height: '8px' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, summary.overall_progress_pct)}%`,
                background: 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)'
              }}
            />
          </div>
        </div>
      )}

      {/* Goals Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          Loading financial goals...
        </div>
      ) : goals.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-dim)' }}>
          <Trophy size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No Financial Goals Set Yet</h3>
          <p style={{ fontSize: '0.84rem', marginBottom: '18px' }}>
            Add targets like a Laptop, Emergency Fund, Higher Education, or Travel to start systematic progress tracking.
          </p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Create Your First Goal
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {goals.map((g) => {
            const m = g.metrics || {};
            const isAchieved = g.status === 'achieved';
            const isAtRisk = g.status === 'at_risk' || g.is_at_risk;
            const isDepositOpen = depositGoalId === g.id;

            return (
              <div
                key={g.id}
                className="glass-panel"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isAchieved 
                    ? '1px solid rgba(16, 185, 129, 0.4)' 
                    : (isAtRisk ? '1px solid rgba(244, 63, 94, 0.35)' : '1px solid var(--border-glass)')
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                          {g.category}
                        </span>
                        <span className="badge badge-violet" style={{ fontSize: '0.72rem' }}>
                          {g.priority} Priority
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '8px 0 2px 0', color: '#fff' }}>
                        {g.title}
                      </h3>
                      {g.notes && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0 }}>
                          {g.notes}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => {
                          setEditingGoal(g);
                          setIsModalOpen(true);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Saved vs Target */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '14px 0 6px 0' }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Saved: </span>
                      <strong style={{ fontSize: '1.25rem', color: isAchieved ? '#34d399' : '#fff' }}>
                        {formatCurrency(g.current_amount)}
                      </strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target: </span>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-dim)' }}>
                        {formatCurrency(g.target_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-container" style={{ height: '8px', marginBottom: '10px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, m.progress_percentage || 0)}%`,
                        background: isAchieved 
                          ? '#10b981' 
                          : (isAtRisk ? '#f43f5e' : 'linear-gradient(90deg, #06b6d4, #10b981)')
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '14px' }}>
                    <span>Progress: <strong style={{ color: '#fff' }}>{m.progress_percentage}%</strong></span>
                    <span>Target Date: <strong style={{ color: '#fff' }}>{g.target_date}</strong></span>
                  </div>

                  {/* Status / Feasibility Box */}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isAchieved 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : (isAtRisk ? 'rgba(244, 63, 94, 0.1)' : 'rgba(6, 182, 212, 0.08)'),
                    border: isAchieved 
                      ? '1px solid rgba(16, 185, 129, 0.25)' 
                      : (isAtRisk ? '1px solid rgba(244, 63, 94, 0.25)' : '1px solid rgba(6, 182, 212, 0.2)'),
                    fontSize: '0.8rem',
                    color: isAchieved ? '#34d399' : (isAtRisk ? '#fb7185' : '#38bdf8'),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {isAchieved ? <CheckCircle size={15} /> : (isAtRisk ? <AlertTriangle size={15} /> : <Calendar size={15} />)}
                    <span>{g.feasibility_note}</span>
                  </div>
                </div>

                {/* Quick Deposit Section */}
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  {isDepositOpen ? (
                    <form onSubmit={(e) => handleDepositSubmit(e, g.id)} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        required
                        className="form-input"
                        placeholder="Amount to deposit"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        autoFocus
                      />
                      <button type="submit" className="btn btn-primary btn-sm">
                        Confirm
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setDepositGoalId(null);
                          setDepositAmount('');
                        }}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setDepositGoalId(g.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%' }}
                    >
                      <ArrowUpRight size={15} />
                      <span>Deposit Funds Toward Goal</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGoal(null);
        }}
        onSuccess={fetchGoals}
        initialData={editingGoal}
      />
    </div>
  );
}
