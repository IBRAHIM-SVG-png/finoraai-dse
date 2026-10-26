import React, { useState } from 'react';
import { ShieldCheck, Info, ChevronRight, Activity } from 'lucide-react';

export default function HealthScoreBadge({ healthData }) {
  const [showModal, setShowModal] = useState(false);

  if (!healthData) return null;

  const score = healthData.score || 0;
  const grade = healthData.grade || 'Fair';
  const color = healthData.status_color || 'blue';
  const breakdown = healthData.breakdown || {};

  const colorMap = {
    emerald: { text: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
    blue: { text: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' },
    amber: { text: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
    rose: { text: '#fb7185', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.3)' }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <>
      <div 
        className="glass-panel glass-panel-interactive"
        onClick={() => setShowModal(true)}
        style={{
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color={scheme.text} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Financial Health Score
            </span>
          </div>
          <span 
            className="badge"
            style={{ backgroundColor: scheme.bg, color: scheme.text, borderColor: scheme.border }}
          >
            {grade}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0 10px 0' }}>
          <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-dim)', fontWeight: 500 }}>
            / 100
          </span>
        </div>

        {/* Progress Bar */}
        <div className="progress-container" style={{ height: '6px', marginBottom: '12px' }}>
          <div 
            className="progress-bar-fill"
            style={{ 
              width: `${score}%`, 
              background: `linear-gradient(90deg, #3b82f6 0%, ${scheme.text} 100%)` 
            }}
          />
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <span>Runway: <strong style={{ color: '#fff' }}>{healthData.runway_months} mos</strong></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#38bdf8' }}>
            Breakdown <ChevronRight size={14} />
          </span>
        </div>
      </div>

      {/* Explanatory Breakdown Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={22} color="#06b6d4" />
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Financial Health Breakdown</h3>
              </div>
              <span className="badge" style={{ backgroundColor: scheme.bg, color: scheme.text, borderColor: scheme.border }}>
                {grade} • {score}/100
              </span>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
              {healthData.summary}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              {Object.entries(breakdown).map(([key, item]) => {
                const pct = (item.points / item.max) * 100;
                return (
                  <div key={key} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{item.label}</span>
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>{item.points} / {item.max} pts</span>
                    </div>
                    <div className="progress-container" style={{ height: '6px' }}>
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: '#06b6d4' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ width: '100%' }}
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
