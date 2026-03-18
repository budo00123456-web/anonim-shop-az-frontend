// ============================================
// ANONIM SHOP AZ - Frontend Config
// Change API_URL to your Railway backend URL
// ============================================
const CONFIG = {
  API_URL: 'https://anonim-shop-az-backend-production.up.railway.app',  // <-- Change this!
  SOCKET_URL: 'https://anonim-shop-az-backend-production.up.railway.app', // <-- Change this!
  APP_NAME: 'ANONIM SHOP AZ',
  VERSION: '1.0.0',
};

// Token management
const Auth = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch { return null; }
  },
  setTokens: (accessToken, refreshToken, user) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
  isLoggedIn: () => !!localStorage.getItem('accessToken'),
};

// API request helper with auto-refresh
const API = {
  request: async (endpoint, options = {}) => {
    const url = `${CONFIG.API_URL}${endpoint}`;
    const headers = { ...options.headers };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const token = Auth.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let response = await fetch(url, { ...options, headers });

    // Auto-refresh token on 401
    if (response.status === 401) {
      const data = await response.json();
      if (data.code === 'TOKEN_EXPIRED') {
        const refreshed = await API.refreshTokens();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${Auth.getAccessToken()}`;
          response = await fetch(url, { ...options, headers });
        } else {
          Auth.clear();
          window.location.href = '/pages/login.html';
          return null;
        }
      }
    }

    return response;
  },

  get: (endpoint) => API.request(endpoint, { method: 'GET' }),

  post: (endpoint, body, isFormData = false) => API.request(endpoint, {
    method: 'POST',
    body: isFormData ? body : JSON.stringify(body),
  }),

  put: (endpoint, body) => API.request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),

  delete: (endpoint) => API.request(endpoint, { method: 'DELETE' }),

  refreshTokens: async () => {
    const refreshToken = Auth.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${CONFIG.API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        Auth.setTokens(data.accessToken, data.refreshToken, data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
};

// Theme management
const Theme = {
  get: () => localStorage.getItem('theme') || 'dark',
  set: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  },
  toggle: () => {
    const current = Theme.get();
    Theme.set(current === 'dark' ? 'light' : 'dark');
  },
  init: () => {
    document.documentElement.setAttribute('data-theme', Theme.get());
  },
};

// Toast notifications
const Toast = {
  show: (message, type = 'info', duration = 3000) => {
    const container = document.getElementById('toast-container') || (() => {
      const el = document.createElement('div');
      el.id = 'toast-container';
      document.body.appendChild(el);
      return el;
    })();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  warning: (msg) => Toast.show(msg, 'warning'),
  info: (msg) => Toast.show(msg, 'info'),
};

// Initialize theme on load
Theme.init();
