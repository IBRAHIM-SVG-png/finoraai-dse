import React, { useState, useEffect } from 'react';
import { X, Target } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const GOAL_CATEGORIES = [
  "Laptop", "Education", "Emergency Fund", "Travel", "Vehicle", "Home", "Retirement", "Other"
];

const PRIORITIES = ["High", "Medium", "Low"];

export default function GoalModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const { currencySymbol } = useAuth();
  const defaultTargetDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    category: 'Laptop',
    target_amount: '',
    current_amount: '0',
    target_date: defaultTargetDate,
    priority: 'Medium',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        category: initialData.category || 'Laptop',
        target_amount: initialData.target_amount || '',
        current_amount: initialData.current_amount || '0',
        target_date: initialData.target_date || defaultTargetDate,
        priority: initialData.priority || 'Medium',
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        title: '',
        category: 'Laptop',
        target_amount: '',
        current_amount: '0',
        target_date: defaultTargetDate,
        priority: 'Medium',
        notes: ''
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const target = parseFloat(formData.target_amount);
    const current = parseFloat(formData.current_amount);

    if (isNaN(target) || target <= 0) {
      setError('Please enter a target amount greater than 0.');
      return;
    }

    if (isNaN(current) || current < 0) {
      setError('Current saved amount cannot be negative.');
      return;
    }

    setLoading(true);
    try {
      if (initialData && initialData.id) {
        await api.updateGoal(initialData.id, formData);
      } else {
        await api.createGoal(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save financial goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Target size={22} color="#06b6d4" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {initialData ? 'Update Financial Goal' : 'Create Financial Goal'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            marginBottom: '16px',
            borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Goal Title *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. MacBook Pro M3, Emergency Safety Net, Europe Trip"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {GOAL_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Target Amount ({currencySymbol}) *</label>
              <input
                type="number"
                step="100"
                min="100"
                required
                className="form-input"
                placeholder="100000"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Already Saved ({currencySymbol})</label>
              <input
                type="number"
                step="100"
                min="0"
                className="form-input"
                placeholder="0"
                value={formData.current_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target Completion Date *</label>
            <input
              type="date"
              required
              className="form-input"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Strategic Notes / Purpose</label>
            <textarea
              rows="2"
              className="form-textarea"
              placeholder="Why this goal matters and allocation strategy..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '26px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? 'Saving...' : (initialData ? 'Update Goal' : 'Create Goal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
