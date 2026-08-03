import axios from 'axios';

// In dev, Vite proxies /api to the local backend (see vite.config.js).
// In production, set VITE_API_URL to your deployed backend's base URL
// (e.g. https://soblait-backend.onrender.com/api).
const baseURL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('soblait_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('soblait_token');
      localStorage.removeItem('soblait_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default client;
