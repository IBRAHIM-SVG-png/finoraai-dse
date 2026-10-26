import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  DollarSign, 
  ShieldAlert, 
  Save, 
  RotateCcw, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth, CURRENCY_SYMBOLS } from '../context/AuthContext';
import { api } from '../services/api';

export default function Settings() {
  const { user, refreshUser, formatCurrency } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    currency: user?.currency || 'INR',
    monthly_savings_target: user?.monthly_savings_target || 5000
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Reset Data Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await api.updateProfile(formData);
      await refreshUser();
      setMessage('Profile settings updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    if (resetConfirmText !== 'RESET') {
      alert("Please type 'RESET' to confirm.");
      return;
    }

    setResetting(true);
    try {
      await api.resetData();
      setShowResetModal(false);
      setResetConfirmText('');
      alert('All your financial records have been reset.');
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to reset data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #0891b2 0%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
        }}>
          <SettingsIcon size={24} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>System Settings & Profile</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
            Manage your personal profile, active currency symbol, and data configuration.
          </p>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fb7185',
          fontSize: '0.86rem'
        }}>
          {error}
        </div>
      )}

      {/* Profile Form */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '20px' }}>Account Information</h3>

        <form onSubmit={handleSaveProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Username (Read-only)</label>
              <input
                type="text"
                disabled
                className="form-input"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                value={user?.username || ''}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                className="form-input"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                value={user?.email || ''}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Currency</label>
              <select
                className="form-select"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="INR">Indian Rupee (₹ INR)</option>
                <option value="USD">US Dollar ($ USD)</option>
                <option value="EUR">Euro (€ EUR)</option>
                <option value="GBP">British Pound (£ GBP)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Monthly Savings Goal ({CURRENCY_SYMBOLS[formData.currency] || '₹'})</label>
              <input
                type="number"
                min="0"
                step="500"
                className="form-input"
                value={formData.monthly_savings_target}
                onChange={(e) => setFormData({ ...formData, monthly_savings_target: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Reset Financial Records */}
      <div className="glass-panel" style={{ padding: '28px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <ShieldAlert size={22} color="#f43f5e" />
          <h3 style={{ fontSize: '1.15rem', color: '#fb7185', margin: 0 }}>Danger Zone: Reset Financial Records</h3>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '18px' }}>
          This will permanently purge all your recorded transactions, category budgets, financial goals, and saved future simulation scenarios. This action cannot be undone.
        </p>

        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="btn btn-danger"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RotateCcw size={16} />
          <span>Reset All Financial Data</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fb7185', marginBottom: '14px' }}>
              <ShieldAlert size={24} />
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Confirm Financial Data Reset</h3>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
              Are you sure? All transaction history, budget limits, milestones, and simulations will be permanently erased.
            </p>
            <p style={{ fontSize: '0.82rem', color: '#fff', marginBottom: '12px' }}>
              Type <strong>RESET</strong> in capital letters below to confirm:
            </p>

            <input
              type="text"
              className="form-input"
              placeholder="RESET"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              style={{ marginBottom: '20px' }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmText('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                disabled={resetConfirmText !== 'RESET' || resetting}
                onClick={handleResetData}
              >
                {resetting ? 'Resetting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
