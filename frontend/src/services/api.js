// Shared API client with authentication interceptor

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4566';
const TOKEN_KEY = 'auth_token';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to store token
export const storeToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

// Helper to remove token
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// Helper to check if token exists
export const hasToken = () => {
  return !!localStorage.getItem(TOKEN_KEY);
};

export default api;
