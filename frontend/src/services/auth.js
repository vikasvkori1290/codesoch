import axios from 'axios';
import { API_URL } from '../config/api.js';

// Helper to set Auth Header for Axios requests
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('thinkquiz_token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('thinkquiz_token');
  }
};

// Initialize token on startup
export const initAuth = () => {
  const token = localStorage.getItem('thinkquiz_token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return token;
};

// Get current stored user
export const getCurrentUser = () => {
  const userJson = localStorage.getItem('thinkquiz_user');
  return userJson ? JSON.parse(userJson) : null;
};

// Login with Email & Password
export const loginUser = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, { email, password });
  if (response.data.token) {
    setAuthToken(response.data.token);
    localStorage.setItem('thinkquiz_user', JSON.stringify(response.data));
  }
  return response.data;
};

// Signup with First Name, Last Name, Username, Email, Password, Mobile
export const registerUser = async (userData) => {
  const response = await axios.post(`${API_URL}/auth/register`, userData);
  if (response.data.token) {
    setAuthToken(response.data.token);
    localStorage.setItem('thinkquiz_user', JSON.stringify(response.data));
  }
  return response.data;
};

// Logout
export const logoutUser = () => {
  setAuthToken(null);
  localStorage.removeItem('thinkquiz_user');
};
