import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // CRITICAL: Enable httpOnly cookies
});

api.interceptors.request.use((config) => {
  // Cookies are automatically sent with withCredentials: true
  // Remove localStorage token usage for security
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear legacy tokens
      localStorage.removeItem('token');
      localStorage.removeItem('session_token');
      localStorage.removeItem('access_token');
      
      // Yalnızca gerçekten korumalı sayfalarda /auth'a yönlendir
      // Ana sayfa (/), uygulamalar ve public sayfalar giriş gerektirmez
      const PROTECTED_PATHS = ['/panel'];
      const isProtected = PROTECTED_PATHS.some(p => window.location.pathname.startsWith(p));
      if (isProtected) {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
