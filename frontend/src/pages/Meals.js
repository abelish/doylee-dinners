// Meals page - List and manage meals

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as mealsService from '../services/mealsService';
import MealCard from '../components/meals/MealCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './Meals.css';

const Meals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, open, needs-cook
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    time: '18:00',
    maxDiners: 20,
    notes: '',
  });

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get meals for next 60 days
      const today = new Date();
      const endDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

      const response = await mealsService.getMeals({
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      if (response.success) {
        setMeals(response.data.meals || []);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeal = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await mealsService.createMeal(formData);

      if (response.success) {
        setShowCreateForm(false);
        setFormData({ date: '', time: '18:00', maxDiners: 20, notes: '' });
        loadMeals();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create meal');
    }
  };

  const filteredMeals = meals.filter((meal) => {
    if (filter === 'all') return true;
    if (filter === 'open') return meal.status === 'OPEN';
    if (filter === 'needs-cook') return !meal.cookId;
    return true;
  });

  return (
    <div className="meals-container">
      <header className="meals-header">
        <h1>🍽️ Community Meals</h1>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate('/')}
          >
            Home
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : '+ Create Meal'}
          </button>
        </div>
      </header>

      {showCreateForm && (
        <div className="create-meal-form">
          <h2>Create New Meal</h2>
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleCreateMeal}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label htmlFor="time">Time</label>
                <input
                  type="time"
                  id="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxDiners">Max Diners</label>
                <input
                  type="number"
                  id="maxDiners"
                  value={formData.maxDiners}
                  onChange={(e) => setFormData({ ...formData, maxDiners: parseInt(e.target.value) })}
                  required
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g., Theme, special occasion, dietary focus..."
                rows="3"
                maxLength="1000"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Create Meal</button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="meals-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Meals ({meals.length})
        </button>
        <button
          className={`filter-btn ${filter === 'open' ? 'active' : ''}`}
          onClick={() => setFilter('open')}
        >
          Open ({meals.filter(m => m.status === 'OPEN').length})
        </button>
        <button
          className={`filter-btn ${filter === 'needs-cook' ? 'active' : ''}`}
          onClick={() => setFilter('needs-cook')}
        >
          Needs Cook ({meals.filter(m => !m.cookId).length})
        </button>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && filteredMeals.length === 0 && (
        <div className="empty-state fade-in">
          <p>No meals found. Create one to get started!</p>
        </div>
      )}

      {!loading && filteredMeals.length > 0 && (
        <div className="meals-grid fade-in">
          {filteredMeals.map((meal) => (
            <MealCard key={meal.mealId} meal={meal} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Meals;
