import React from 'react';

export default function MetricCard({ 
  icon: Icon, 
  iconColor = '#06b6d4', 
  iconBg = 'rgba(6, 182, 212, 0.12)', 
  label, 
  value, 
  subtext, 
  trend, 
  trendPositive = true,
  badgeText,
  badgeType = 'blue',
  onClick
}) {
  return (
    <div 
      className={`glass-panel ${onClick ? 'glass-panel-interactive' : ''}`}
      onClick={onClick}
      style={{
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative subtle ambient corner glow */}
      <div style={{
        position: 'absolute',
        top: '-25px',
        right: '-25px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: iconColor,
        opacity: 0.08,
        filter: 'blur(20px)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${iconColor}33`,
          boxShadow: `0 0 15px ${iconColor}22`
        }}>
          {Icon && <Icon size={20} color={iconColor} />}
        </div>

        {badgeText && (
          <span className={`badge badge-${badgeType}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {value}
        </div>
      </div>

      {(subtext || trend) && (
        <div style={{ 
          marginTop: '12px', 
          paddingTop: '10px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          fontSize: '0.78rem'
        }}>
          {trend && (
            <span style={{ 
              fontWeight: 600, 
              color: trendPositive ? '#34d399' : '#fb7185' 
            }}>
              {trend}
            </span>
          )}
          {subtext && (
            <span style={{ color: 'var(--text-dim)' }}>
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
