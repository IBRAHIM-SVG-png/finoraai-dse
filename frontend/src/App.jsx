import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import TransactionModal from './components/TransactionModal';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import BudgetPlanner from './pages/BudgetPlanner';
import AIAssistant from './pages/AIAssistant';
import FutureSimulator from './pages/FutureSimulator';
import WhatIfScenarios from './pages/WhatIfScenarios';
import FinancialGoals from './pages/FinancialGoals';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const PAGE_METADATA = {
  dashboard: { title: 'Personal Finance Dashboard', subtitle: 'Real-time financial status, liquidity, and analytics' },
  transactions: { title: 'Income & Expense Transactions', subtitle: 'Manage daily income and expenditure ledgers' },
  budgets: { title: 'Smart Budget Planner', subtitle: 'Monthly spending thresholds, utilization & overrun warnings' },
  'ai-assistant': { title: 'AI Financial Advisor', subtitle: 'Heuristic spending patterns & explainable recommendations' },
  simulator: { title: 'Future Financial Simulator', subtitle: 'Multi-year projections, compound wealth, and goal probability' },
  'what-if': { title: 'What-If Strategic Scenarios', subtitle: 'Evaluate outcomes of expense cuts, savings boosts, and emergency shocks' },
  goals: { title: 'Financial Goals & Milestones', subtitle: 'Track target amounts, target dates, and monthly required savings' },
  reports: { title: 'Audit Reports & CSV Export', subtitle: 'Period breakdown, payment analytics, and raw data downloads' },
  settings: { title: 'System Settings & Profile', subtitle: 'Currency preferences, targets, and data controls' }
};

function MainLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGlobalTxModalOpen, setIsGlobalTxModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#070a12',
        color: '#38bdf8'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(6, 182, 212, 0.2)',
            borderTopColor: '#06b6d4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Loading FinSimulate...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Unauthenticated: Show Login or Register
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToRegister={() => setAuthView('register')} />;
  }

  const pageMeta = PAGE_METADATA[currentPage] || PAGE_METADATA.dashboard;

  const renderActivePage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard key={refreshKey} onNavigate={setCurrentPage} onOpenNewTx={() => setIsGlobalTxModalOpen(true)} />;
      case 'transactions':
        return <Transactions key={refreshKey} />;
      case 'budgets':
        return <BudgetPlanner key={refreshKey} />;
      case 'ai-assistant':
        return <AIAssistant key={refreshKey} />;
      case 'simulator':
        return <FutureSimulator key={refreshKey} />;
      case 'what-if':
        return <WhatIfScenarios key={refreshKey} />;
      case 'goals':
        return <FinancialGoals key={refreshKey} />;
      case 'reports':
        return <Reports key={refreshKey} />;
      case 'settings':
        return <Settings key={refreshKey} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} onOpenNewTx={() => setIsGlobalTxModalOpen(true)} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div 
        className="main-content-layout"
        style={{
          flex: 1,
          marginLeft: '260px',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh'
        }}
      >
        {/* Top Sticky Navbar */}
        <Navbar
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenNewTx={() => setIsGlobalTxModalOpen(true)}
        />

        {/* Dynamic Page Container */}
        <main style={{ flex: 1, padding: '28px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {renderActivePage()}
        </main>
      </div>

      {/* Global Quick Transaction Modal */}
      <TransactionModal
        isOpen={isGlobalTxModalOpen}
        onClose={() => setIsGlobalTxModalOpen(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />

      <style>{`
        @media (max-width: 992px) {
          .main-content-layout {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
