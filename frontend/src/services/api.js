// API Client Service for Harsha Personal Finance System

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getHeaders(isJson = true) {
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('finance_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function safeFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('Failed') || err.message.includes('Network'))) {
      throw new Error('Unable to connect to the backend server. Please verify that the Flask backend is running on http://127.0.0.1:5000 (cd backend; python app.py).');
    }
    throw err;
  }
}

async function handleResponse(response) {
  if (response.status === 401) {
    localStorage.removeItem('finance_auth_token');
    localStorage.removeItem('finance_user_data');
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      window.location.href = '/login';
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Server request failed');
    }
    return data;
  }
  
  if (!response.ok) {
    throw new Error('Server request failed');
  }
  return response;
}

export const api = {
  // Auth
  async login(username_or_email, password) {
    const res = await safeFetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username_or_email, password })
    });
    return handleResponse(res);
  },

  async register(data) {
    const res = await safeFetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await safeFetch(`${BASE_URL}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async updateProfile(profileData) {
    const res = await safeFetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(res);
  },

  async resetData() {
    const res = await safeFetch(`${BASE_URL}/auth/reset-data`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ confirm_reset: true })
    });
    return handleResponse(res);
  },

  // Transactions
  async getTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`${BASE_URL}/transactions?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async addTransaction(txData) {
    const res = await safeFetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(txData)
    });
    return handleResponse(res);
  },

  async updateTransaction(id, txData) {
    const res = await safeFetch(`${BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(txData)
    });
    return handleResponse(res);
  },

  async deleteTransaction(id) {
    const res = await safeFetch(`${BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getDashboardSummary() {
    const res = await safeFetch(`${BASE_URL}/transactions/summary`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Budgets
  async getBudgets(month_year) {
    const query = month_year ? `?month_year=${month_year}` : '';
    const res = await safeFetch(`${BASE_URL}/budgets${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async setBudget(budgetData) {
    const res = await safeFetch(`${BASE_URL}/budgets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(budgetData)
    });
    return handleResponse(res);
  },

  async deleteBudget(id) {
    const res = await safeFetch(`${BASE_URL}/budgets/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Goals
  async getGoals() {
    const res = await safeFetch(`${BASE_URL}/goals`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createGoal(goalData) {
    const res = await safeFetch(`${BASE_URL}/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(goalData)
    });
    return handleResponse(res);
  },

  async updateGoal(id, goalData) {
    const res = await safeFetch(`${BASE_URL}/goals/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(goalData)
    });
    return handleResponse(res);
  },

  async depositGoal(id, amount) {
    const res = await safeFetch(`${BASE_URL}/goals/${id}/deposit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount })
    });
    return handleResponse(res);
  },

  async deleteGoal(id) {
    const res = await safeFetch(`${BASE_URL}/goals/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Simulation
  async runSimulation(params) {
    const res = await safeFetch(`${BASE_URL}/simulation/run`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    return handleResponse(res);
  },

  async runWhatIf(params) {
    const res = await safeFetch(`${BASE_URL}/simulation/what-if`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    return handleResponse(res);
  },

  async getSavedScenarios() {
    const res = await safeFetch(`${BASE_URL}/simulation/scenarios`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async saveScenario(scenarioData) {
    const res = await safeFetch(`${BASE_URL}/simulation/save`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(scenarioData)
    });
    return handleResponse(res);
  },

  async deleteSavedScenario(id) {
    const res = await safeFetch(`${BASE_URL}/simulation/scenarios/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // AI Assistant
  async getAiInsights() {
    const res = await safeFetch(`${BASE_URL}/ai/insights`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async askAiAdvisor(question) {
    const res = await safeFetch(`${BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ question })
    });
    return handleResponse(res);
  },

  // Reports
  async getReportsAnalytics(timeframe = 'month') {
    const res = await safeFetch(`${BASE_URL}/reports/analytics?timeframe=${timeframe}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getExportCsvUrl() {
    const token = localStorage.getItem('finance_auth_token');
    return `${BASE_URL}/reports/export-csv?token=${token || ''}`;
  }
};
