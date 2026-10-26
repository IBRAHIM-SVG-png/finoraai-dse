import React, { useState, useEffect } from 'react';
import { X, PieChart } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  "Food", "Transport", "Education", "Shopping", "Bills", 
  "Healthcare", "Entertainment", "Other"
];

export default function BudgetModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const { currencySymbol } = useAuth();
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const [formData, setFormData] = useState({
    category: 'Food',
    monthly_limit: '',
    month_year: currentMonthStr
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category || 'Food',
        monthly_limit: initialData.monthly_limit || '',
        month_year: initialData.month_year || currentMonthStr
      });
    } else {
      setFormData({
        category: 'Food',
        monthly_limit: '',
        month_year: currentMonthStr
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const limit = parseFloat(formData.monthly_limit);
    if (isNaN(limit) || limit <= 0) {
      setError('Please specify a positive budget limit.');
      return;
    }

    setLoading(true);
    try {
      await api.setBudget(formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PieChart size={22} color="#06b6d4" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {initialData ? 'Update Category Budget' : 'Set Category Budget'}
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
            <label className="form-label">Category *</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Monthly Limit ({currencySymbol}) *</label>
            <input
              type="number"
              step="100"
              min="1"
              required
              className="form-input"
              placeholder="e.g. 8000"
              value={formData.monthly_limit}
              onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Month & Year *</label>
            <input
              type="month"
              required
              className="form-input"
              value={formData.month_year}
              onChange={(e) => setFormData({ ...formData, month_year: e.target.value })}
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
              {loading ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
