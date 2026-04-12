// Authentication API service

import api, { storeToken, removeToken, hasToken } from './api';

export { hasToken };

/**
 * Register a new user
 */
export const register = async (email, password, name, dietaryRestrictions = '') => {
  const response = await api.post('/auth/register', {
    email,
    password,
    name,
    dietaryRestrictions: dietaryRestrictions || undefined,
  });

  // Store token in localStorage
  if (response.data.success && response.data.data.token) {
    storeToken(response.data.data.token);
  }

  return response.data;
};

/**
 * Login user
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });

  // Store token in localStorage
  if (response.data.success && response.data.data.token) {
    storeToken(response.data.data.token);
  }

  return response.data;
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Logout user
 */
export const logout = async () => {
  // Remove token from localStorage
  removeToken();

  // Call logout endpoint (optional, mainly to clear server-side cookie if any)
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    // Token already removed, so logout is successful anyway
    return { success: true };
  }
};

export default {
  register,
  login,
  getCurrentUser,
  logout,
  hasToken,
};
