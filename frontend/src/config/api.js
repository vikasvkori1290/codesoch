// Centralized API Base URL configuration for ThinkQuiz Frontend
// Handles both 'https://codesoch.vercel.app' AND accidental trailing '/api' or '/'
const rawUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').trim().replace(/\/$/, '');

export const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl.slice(0, -4) : rawUrl;
export const API_URL = `${API_BASE_URL}/api`;
