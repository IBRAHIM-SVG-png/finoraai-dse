import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  PiggyBank, 
  CreditCard,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { formatCurrency } = useAuth();
  const [timeframe, setTimeframe] = useState('month'); // 'week', 'month', 'year'
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [timeframe]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.getReportsAnalytics(timeframe);
      setReportData(res);
    } catch (err) {
      console.error('Failed to load report analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    window.open(api.getExportCsvUrl(), '_blank');
  };

  const summary = reportData?.summary || {};
  const categoryBreakdown = reportData?.category_breakdown || [];
  const paymentMethods = reportData?.payment_methods || [];
  const trend = reportData?.trend || [];

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
            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
          }}>
            <BarChart3 size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Financial Reports & Analytics</h2>
              <span className="badge badge-blue">Audit Trail</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Comprehensive performance audits, category spending breakdown, and raw CSV export.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Timeframe Filter */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0, 0, 0, 0.3)', padding: '4px', borderRadius: '10px' }}>
            {[
              { id: 'week', label: 'Past 7 Days' },
              { id: 'month', label: 'Past 30 Days' },
              { id: 'year', label: 'Past Year' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id)}
                style={{
                  background: timeframe === t.id ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                  color: timeframe === t.id ? '#38bdf8' : 'var(--text-muted)',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Download CSV Button */}
          <button
            onClick={handleDownloadCsv}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={16} />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid-cards-4">
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Period Income</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            +{formatCurrency(summary.period_income)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '6px' }}>Total Inflow in Period</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Period Expenses</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fb7185', marginTop: '4px' }}>
            -{formatCurrency(summary.period_expenses)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '6px' }}>Total Outflow in Period</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Net Retained Savings</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: summary.period_savings >= 0 ? '#38bdf8' : '#fb7185', marginTop: '4px' }}>
            {formatCurrency(summary.period_savings)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '6px' }}>Surplus retained in bank</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Savings Rate</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: summary.savings_rate_pct >= 20 ? '#34d399' : '#fbbf24', marginTop: '4px' }}>
            {summary.savings_rate_pct}%
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '6px' }}>Benchmark: &gt;= 20%</div>
        </div>
      </div>

      {/* Period Flow Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Inflow vs Outflow Chronological Distribution</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Activity logged during selected timeframe</p>
          </div>
          <span className="badge badge-cyan">{trend.length} Active Days</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            Loading audit trends...
          </div>
        ) : trend.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)', fontSize: '0.86rem' }}>
            No transaction records found in this timeframe.
          </div>
        ) : (
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ background: '#0e1628', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', fontSize: '0.82rem', color: '#fff' }}
                  formatter={(val) => [formatCurrency(val), '']}
                />
                <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Two Columns: Category Breakdown & Payment Methods */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Category Breakdown Table */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '14px' }}>Category Outflow Breakdown</h3>
          {categoryBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)', fontSize: '0.84rem' }}>
              No category expense records found.
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Count</th>
                    <th style={{ textAlign: 'right' }}>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((c) => (
                    <tr key={c.category}>
                      <td>
                        <span className="badge badge-cyan">{c.category}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{c.tx_count} transactions</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#fb7185' }}>
                        {formatCurrency(c.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Methods Breakdown */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '14px' }}>Payment Channel Share</h3>
          {paymentMethods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)', fontSize: '0.84rem' }}>
              No payment transactions found.
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Count</th>
                    <th style={{ textAlign: 'right' }}>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethods.map((m) => (
                    <tr key={m.payment_method}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{m.payment_method || 'UPI'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{m.count} transactions</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>
                        {formatCurrency(m.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
