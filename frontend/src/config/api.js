// Centralized API Base URL configuration
const getApiBaseUrl = () => {
  // If explicitly configured in environment (e.g. for standalone static frontend)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  // In browser: if running locally on Vite dev server (port 5173 / localhost)
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // When served from the backend (same origin) or in production:
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:5000/api';
};

export const API_URL = getApiBaseUrl();
export default API_URL;
