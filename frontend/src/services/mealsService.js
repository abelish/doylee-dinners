// Meals API service

import api from './api';

/**
 * Create a new meal
 */
export const createMeal = async (mealData) => {
  const response = await api.post('/meals', mealData);
  return response.data;
};

/**
 * Get meals list with optional filters
 */
export const getMeals = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.status) params.append('status', filters.status);

  const response = await api.get(`/meals?${params.toString()}`);
  return response.data;
};

/**
 * Get meal by ID
 */
export const getMealById = async (mealId) => {
  const response = await api.get(`/meals/${mealId}`);
  return response.data;
};

/**
 * Update a meal
 */
export const updateMeal = async (mealId, updates) => {
  const response = await api.put(`/meals/${mealId}`, updates);
  return response.data;
};

/**
 * Delete a meal
 */
export const deleteMeal = async (mealId) => {
  const response = await api.delete(`/meals/${mealId}`);
  return response.data;
};

/**
 * Sign up for a meal
 */
export const signupForMeal = async (mealId, role) => {
  const response = await api.post(`/meals/${mealId}/signup`, { role });
  return response.data;
};

/**
 * Remove signup from a meal
 */
export const removeSignup = async (mealId) => {
  const response = await api.delete(`/meals/${mealId}/signup`);
  return response.data;
};

/**
 * Close a meal (cook only)
 */
export const closeMeal = async (mealId) => {
  const response = await api.put(`/meals/${mealId}/close`);
  return response.data;
};

/**
 * Reopen a meal (cook only)
 */
export const reopenMeal = async (mealId) => {
  const response = await api.put(`/meals/${mealId}/reopen`);
  return response.data;
};

export default {
  createMeal,
  getMeals,
  getMealById,
  updateMeal,
  deleteMeal,
  signupForMeal,
  removeSignup,
  closeMeal,
  reopenMeal,
};
