// User service - API calls for user profile management

import api from './api';

/**
 * Get user profile by ID
 */
const getUserById = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

/**
 * Update user profile
 */
const updateUserProfile = async (userId, updates) => {
  const response = await api.put(`/users/${userId}`, updates);
  return response.data;
};

export default {
  getUserById,
  updateUserProfile,
};
