import React from 'react';
import { Menu, Plus, Calendar, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title, subtitle, onOpenSidebar, onOpenNewTx }) {
  const { user } = useAuth();
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <header style={{
      height: '70px',
      borderBottom: '1px solid var(--border-glass)',
      backgroundColor: 'rgba(9, 14, 25, 0.75)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px'
    }}>
      {/* Left: Hamburger & Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onOpenSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="navbar-hamburger"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions & Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8rem',
          color: 'var(--text-dim)',
          padding: '6px 12px',
          borderRadius: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-glass)'
        }} className="navbar-date-badge">
          <Calendar size={14} color="#06b6d4" />
          <span>{todayStr}</span>
        </div>

        <button
          onClick={onOpenNewTx}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          <span>Add Transaction</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .navbar-hamburger {
            display: flex !important;
          }
        }
        @media (max-width: 640px) {
          .navbar-date-badge {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
