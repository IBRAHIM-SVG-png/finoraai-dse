import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Send, 
  CheckCircle, 
  PieChart, 
  Target,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AIAssistant() {
  const { formatCurrency, user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Interactive Chat State
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: `Hello ${user?.full_name?.split(' ')[0] || 'there'}! I am your explainable AI Financial Advisor. I analyze your recorded income, expenses, budgets, and goals to provide transparent mathematical recommendations. Ask me anything about your finances!`
    }
  ]);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await api.getAiInsights();
      setInsights(res.data);
    } catch (err) {
      console.error('Failed to load AI insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || asking) return;

    const userQ = question.trim();
    setChatHistory(prev => [...prev, { sender: 'user', text: userQ }]);
    setQuestion('');
    setAsking(true);

    try {
      const res = await api.askAiAdvisor(userQ);
      setChatHistory(prev => [...prev, { sender: 'ai', text: res.answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an issue analyzing your request. Please try again.' }]);
    } finally {
      setAsking(false);
    }
  };

  const suggestedQuestions = [
    "How can I optimize my monthly savings?",
    "Where am I overspending the most?",
    "Am I on track for my financial goals?",
    "How much should I keep in my emergency fund?"
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '12px' }}>Synthesizing explainable AI financial insights...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const summary = insights?.monthly_summary || {};
  const rule503020 = summary?.financial_rule_50_30_20 || {};
  const needsVsWants = summary?.needs_vs_wants_split || {};
  const unnecessary = insights?.unnecessary_expenses || [];
  const budgetOpt = insights?.budget_optimization || [];
  const actionable = insights?.actionable_recommendations || [];
  const goalRecs = insights?.goal_recommendations || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div 
        className="glass-panel"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(20, 24, 48, 0.85) 0%, rgba(35, 24, 60, 0.75) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.45)'
          }}>
            <BrainCircuit size={26} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>AI Financial Advisor</h2>
              <span className="badge badge-violet">Transparent & Explainable</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Real-time heuristic evaluation based on 50/30/20 principles, spending variance, and goal feasibility.
            </p>
          </div>
        </div>

        <button 
          onClick={fetchInsights}
          className="btn btn-secondary btn-sm"
        >
          Re-analyze Data
        </button>
      </div>

      {/* 50 / 30 / 20 Diagnostic Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>50 / 30 / 20 Principle Health Check</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Standard budgeting guideline: 50% Needs, 30% Wants, 20% Savings
            </p>
          </div>
          <span className={`badge ${rule503020.adherence === 'Optimal' ? 'badge-emerald' : 'badge-amber'}`}>
            Status: {rule503020.adherence}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '18px'
        }}>
          {/* Needs */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Essential Needs (Target ≤50%)</span>
              <strong style={{ color: needsVsWants.needs_pct > 50 ? '#fb7185' : '#34d399' }}>{needsVsWants.needs_pct}%</strong>
            </div>
            <div className="progress-container" style={{ height: '7px' }}>
              <div className="progress-bar-fill" style={{ width: `${Math.min(100, needsVsWants.needs_pct)}%`, background: '#3b82f6' }} />
            </div>
          </div>

          {/* Wants */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Discretionary Wants (Target ≤30%)</span>
              <strong style={{ color: needsVsWants.wants_pct > 30 ? '#fb7185' : '#34d399' }}>{needsVsWants.wants_pct}%</strong>
            </div>
            <div className="progress-container" style={{ height: '7px' }}>
              <div className="progress-bar-fill" style={{ width: `${Math.min(100, needsVsWants.wants_pct)}%`, background: '#8b5cf6' }} />
            </div>
          </div>

          {/* Savings */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Net Savings (Target ≥20%)</span>
              <strong style={{ color: needsVsWants.savings_pct >= 20 ? '#34d399' : '#fbbf24' }}>{needsVsWants.savings_pct}%</strong>
            </div>
            <div className="progress-container" style={{ height: '7px' }}>
              <div className="progress-bar-fill" style={{ width: `${Math.min(100, Math.max(0, needsVsWants.savings_pct))}%`, background: '#10b981' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Wasteful Expenses & Actionable Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Unnecessary & High Discretionary Expenses */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={18} color="#f59e0b" />
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Unnecessary & High Discretionary Spend</h3>
          </div>

          {unnecessary.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              <CheckCircle size={24} color="#10b981" style={{ margin: '0 auto 8px' }} />
              No severe discretionary spending leaks detected! Your outflows appear controlled.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {unnecessary.map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#fbbf24', fontSize: '0.9rem' }}>{item.category}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>{formatCurrency(item.spent)}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {item.suggestion}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actionable Savings & Optimization Recommendations */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} color="#06b6d4" />
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Actionable Savings Recommendations</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {actionable.map((rec, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(6, 182, 212, 0.07)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#38bdf8', fontSize: '0.9rem' }}>{rec.title}</strong>
                  <span className="badge badge-cyan">{rec.impact}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {rec.explanation}
                </p>
              </div>
            ))}

            {budgetOpt.slice(0, 2).map((opt, idx) => (
              <div 
                key={`opt-${idx}`}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)'
                }}
              >
                <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>Budget Insight: {opt.category}</strong>
                {opt.action}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal-Based Advice */}
      {goalRecs.length > 0 && (
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Target size={18} color="#10b981" />
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Goal Feasibility & Required Contribution Analysis</h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px'
          }}>
            {goalRecs.map((g, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: g.status === 'at_risk' ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-glass)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ color: '#fff', fontSize: '0.88rem' }}>{g.goal_title}</strong>
                  <span className={`badge ${g.status === 'on_track' ? 'badge-emerald' : 'badge-rose'}`}>
                    {g.status === 'on_track' ? 'On Track' : 'At Risk'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>
                  {g.guidance}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive AI Chat Box */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <MessageSquare size={20} color="#8b5cf6" />
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Ask Your AI Financial Advisor</h3>
        </div>

        {/* Suggested Quick Prompts */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(q);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-glass)',
                padding: '6px 12px',
                borderRadius: '20px',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#38bdf8';
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border-glass)';
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat History Messages */}
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '14px',
          marginBottom: '16px'
        }}>
          {chatHistory.map((msg, idx) => {
            const isAi = msg.sender === 'ai';
            return (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: isAi ? 'flex-start' : 'flex-end'
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: isAi ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                  background: isAi ? 'rgba(139, 92, 246, 0.12)' : 'linear-gradient(135deg, #0891b2 0%, #0284c7 100%)',
                  border: isAi ? '1px solid rgba(139, 92, 246, 0.25)' : 'none',
                  color: '#fff',
                  fontSize: '0.86rem',
                  lineHeight: 1.5
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          {asking && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '10px 16px',
                borderRadius: '14px 14px 14px 4px',
                background: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                color: '#c084fc',
                fontSize: '0.82rem'
              }}>
                Analyzing your data & drafting advice...
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleAsk} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Type your personal finance question here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={asking}
          />
          <button
            type="submit"
            className="btn btn-violet"
            disabled={asking || !question.trim()}
            style={{ padding: '0 20px' }}
          >
            <Send size={16} />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
}
