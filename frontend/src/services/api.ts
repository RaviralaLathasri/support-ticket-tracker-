import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach X-User-Id header dynamically from active user session
api.interceptors.request.use((config) => {
  const userJson = localStorage.getItem('support_ticket_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.id) {
        config.headers['X-User-Id'] = user.id.toString();
      }
    } catch (e) {
      console.error('Failed to parse user from local storage:', e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
