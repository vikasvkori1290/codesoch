// Centralized API Base URL configuration for ThinkQuiz Frontend
// Uses VITE_API_BASE_URL env variable during Vercel / Netlify production deployment
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
export const API_URL = `${API_BASE_URL}/api`;
