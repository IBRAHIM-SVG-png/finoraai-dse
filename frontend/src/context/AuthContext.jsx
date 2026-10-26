import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('finance_auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          console.error('Failed to load current user:', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (identifier, password) => {
    const res = await api.login(identifier, password);
    localStorage.setItem('finance_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async (formData) => {
    const res = await api.register(formData);
    localStorage.setItem('finance_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('finance_auth_token');
    localStorage.removeItem('finance_user_data');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (e) {
      console.error('Error refreshing user:', e);
    }
  };

  const formatCurrency = (amount) => {
    const sym = CURRENCY_SYMBOLS[user?.currency || 'INR'] || '₹';
    const num = parseFloat(amount || 0);
    return `${sym} ${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'INR'] || '₹';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      formatCurrency,
      currencySymbol
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
