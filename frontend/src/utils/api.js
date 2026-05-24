// src/utils/api.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' }
});

// ── Request interceptor — attach token ───────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
}, error => Promise.reject(error));

// ── Refresh queue state ──────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
};

// ── Response interceptor — handle 401 ───────────────────────────────────────
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;

    // Never retry auth endpoints — prevents infinite loops
    if (original.url?.includes('/auth/')) {
      return Promise.reject(err);
    }

    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(err);
    }

    // Queue this request if a refresh is already in flight
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        original.headers['Authorization'] = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry  = true;
    isRefreshing     = true;

    try {
      const { data } = await axios.post(
        `${API_BASE}/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } }
      );

      const newToken = data.access_token;
      localStorage.setItem('access_token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      processQueue(null, newToken);
      original.headers['Authorization'] = `Bearer ${newToken}`;
      return api(original);

    } catch (refreshErr) {
      processQueue(refreshErr, null);
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(refreshErr);

    } finally {
      isRefreshing = false;
    }
  }
);

export default api;