// Authentication Context

import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Only check auth if token exists in localStorage
      if (!authService.hasToken()) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await authService.getCurrentUser();
      if (response.success && response.data.user) {
        setUser(response.data.user);
      }
    } catch (err) {
      // Not authenticated or error
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name, dietaryRestrictions) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authService.register(email, password, name, dietaryRestrictions);

      if (response.success && response.data.user) {
        setUser(response.data.user);
        return { success: true };
      } else {
        throw new Error(response.error?.message || 'Registration failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authService.login(email, password);

      if (response.success && response.data.user) {
        setUser(response.data.user);
        return { success: true };
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setError(null);
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      // Clear user anyway
      setUser(null);
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
