import React from 'react';
import { AlertTriangle, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';

export default function AlertsBanner({ warnings = [], exceeded = [], onNavigate }) {
  if (warnings.length === 0 && exceeded.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
      {exceeded.map((b) => (
        <div
          key={`exceeded-${b.id || b.category}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderRadius: '12px',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            fontSize: '0.86rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} color="#f43f5e" />
            <span>
              <strong>Budget Exceeded:</strong> You've spent {b.percentage}% of your <strong>{b.category}</strong> budget.
            </span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('budgets')}
              className="btn btn-sm btn-danger"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            >
              Reduce Expenses <ChevronRight size={13} />
            </button>
          )}
        </div>
      ))}

      {warnings.map((b) => (
        <div
          key={`warning-${b.id || b.category}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderRadius: '12px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fbbf24',
            fontSize: '0.86rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#f59e0b" />
            <span>
              <strong>Budget Warning:</strong> <strong>{b.category}</strong> spending has reached {b.percentage}% of your monthly limit.
            </span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('budgets')}
              className="btn btn-sm btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            >
              View Advice <ChevronRight size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
