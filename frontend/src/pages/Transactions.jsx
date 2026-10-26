import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit2, 
  Trash2, 
  Calendar,
  CreditCard,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TransactionModal from '../components/TransactionModal';

const CATEGORIES = [
  "All", "Food", "Transport", "Education", "Shopping", "Bills", 
  "Healthcare", "Salary", "Investment", "Entertainment", "Freelance", "Other"
];

export default function Transactions() {
  const { formatCurrency } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('all'); // all, income, expense
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('DESC');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTxData, setEditTxData] = useState(null);

  // Summary Metrics
  const [summary, setSummary] = useState({ month_income: 0, month_expenses: 0, net_savings: 0 });

  useEffect(() => {
    fetchTransactions();
  }, [selectedCategory, selectedType, sortBy, sortDir]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {
        sort_by: sortBy,
        sort_dir: sortDir
      };
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedType !== 'all') params.type = selectedType;
      if (search.trim()) params.search = search.trim();

      const res = await api.getTransactions(params);
      setTransactions(res.transactions || []);

      // Calculate totals
      let inc = 0;
      let exp = 0;
      (res.transactions || []).forEach(t => {
        if (t.type === 'income') inc += t.amount;
        else exp += t.amount;
      });
      setSummary({ month_income: inc, month_expenses: exp, net_savings: inc - exp });
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.deleteTransaction(id);
        fetchTransactions();
      } catch (err) {
        alert(err.message || 'Failed to delete transaction');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Controls & Summaries */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Filtered Income</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
            +{formatCurrency(summary.month_income)}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Filtered Expenses</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fb7185', marginTop: '2px' }}>
            -{formatCurrency(summary.month_expenses)}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Net Filtered Surplus</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: summary.net_savings >= 0 ? '#38bdf8' : '#fb7185', marginTop: '2px' }}>
            {formatCurrency(summary.net_savings)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={() => {
              setEditTxData(null);
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
            style={{ width: '100%', height: '100%', minHeight: '52px' }}
          >
            <Plus size={18} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '18px 22px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 260px', position: 'relative' }}>
            <Search size={17} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by description or tag..."
              className="form-input"
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          {/* Type Toggle */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(0, 0, 0, 0.25)', padding: '4px', borderRadius: '10px' }}>
            {['all', 'income', 'expense'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                style={{
                  background: selectedType === t ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                  color: selectedType === t ? '#38bdf8' : 'var(--text-muted)',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '7px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>

          {/* Sort By */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={`${sortBy}_${sortDir}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split('_');
              setSortBy(sb);
              setSortDir(sd);
            }}
          >
            <option value="date_DESC">Newest First</option>
            <option value="date_ASC">Oldest First</option>
            <option value="amount_DESC">Highest Amount</option>
            <option value="amount_ASC">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-dim)' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>No transactions match your filters.</p>
            <p style={{ fontSize: '0.82rem' }}>Try clearing your search keyword or changing the category filter.</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: isIncome ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isIncome ? <ArrowUpRight size={17} color="#34d399" /> : <ArrowDownRight size={17} color="#fb7185" />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                              {tx.description || tx.category}
                            </div>
                            {tx.is_recurring ? (
                              <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Auto-recurring</span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-cyan" style={{ fontSize: '0.74rem' }}>
                          {tx.category}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                        {tx.date}
                      </td>
                      <td style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
                        {tx.payment_method || 'UPI'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.95rem', color: isIncome ? '#34d399' : '#fb7185' }}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setEditTxData(tx);
                              setIsModalOpen(true);
                            }}
                            title="Edit Transaction"
                            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            title="Delete Transaction"
                            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#f43f5e'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditTxData(null);
        }}
        onSuccess={fetchTransactions}
        initialData={editTxData}
      />
    </div>
  );
}
