// Meal details page

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as mealsService from '../services/mealsService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import './MealDetails.css';

const MealDetails = () => {
  const { mealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [menuText, setMenuText] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    confirmStyle: 'primary',
  });

  useEffect(() => {
    loadMeal();
  }, [mealId]);

  const loadMeal = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mealsService.getMealById(mealId);

      if (response.success) {
        setMeal(response.data.meal);
        setMenuText(response.data.meal.menu || '');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load meal');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (role) => {
    setActionLoading(true);
    setError(null);

    try {
      const response = await mealsService.signupForMeal(mealId, role);

      if (response.success) {
        loadMeal(); // Reload to show updated data
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || `Failed to sign up as ${role.toLowerCase()}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveSignup = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Signup?',
      message: 'Are you sure you want to cancel your signup for this meal?',
      confirmText: 'Yes, Cancel',
      confirmStyle: 'warning',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setActionLoading(true);
        setError(null);

        try {
          const response = await mealsService.removeSignup(mealId);

          if (response.success) {
            loadMeal();
          }
        } catch (err) {
          setError(err.response?.data?.error?.message || 'Failed to cancel signup');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleUpdateMenu = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      const response = await mealsService.updateMeal(mealId, { menu: menuText });

      if (response.success) {
        setShowMenuForm(false);
        loadMeal();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update menu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseMeal = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Close Signups?',
      message: 'Are you sure you want to close signups? No one else will be able to sign up after this.',
      confirmText: 'Close Signups',
      confirmStyle: 'warning',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setActionLoading(true);
        setError(null);

        try {
          const response = await mealsService.closeMeal(mealId);

          if (response.success) {
            loadMeal();
          }
        } catch (err) {
          setError(err.response?.data?.error?.message || 'Failed to close meal');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReopenMeal = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reopen Signups?',
      message: 'Are you sure you want to reopen signups? People will be able to sign up again.',
      confirmText: 'Reopen Signups',
      confirmStyle: 'primary',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setActionLoading(true);
        setError(null);

        try {
          const response = await mealsService.reopenMeal(mealId);

          if (response.success) {
            loadMeal();
          }
        } catch (err) {
          setError(err.response?.data?.error?.message || 'Failed to reopen meal');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleDeleteMeal = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Meal?',
      message: 'Are you sure you want to delete this meal? This action cannot be undone.',
      confirmText: 'Delete Meal',
      confirmStyle: 'danger',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setActionLoading(true);
        setError(null);

        try {
          const response = await mealsService.deleteMeal(mealId);

          if (response.success) {
            navigate('/meals');
          }
        } catch (err) {
          setError(err.response?.data?.error?.message || 'Failed to delete meal');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  if (!meal) {
    return (
      <div className="meal-details-container fade-in">
        <div className="error-message">Meal not found</div>
        <button onClick={() => navigate('/meals')} className="btn-secondary">
          ← Back to Meals
        </button>
      </div>
    );
  }

  const userIsCook = user?.userId === meal.cookId;
  const userIsAssistant = user?.userId === meal.assistantId;
  const userIsDiner = meal.diners?.some(d => d.userId === user?.userId);
  const userIsCreator = user?.userId === meal.createdBy;
  const canEditMenu = userIsCook;

  return (
    <div className="meal-details-container fade-in">
      <button onClick={() => navigate('/meals')} className="btn-back">
        ← Back to Meals
      </button>

      <div className="meal-details-card">
        <div className="meal-details-header">
          <h1>{formatDate(meal.date)}</h1>
          <h2>{formatTime(meal.time)}</h2>

          <div className="meal-status-info">
            <span className={`status-badge status-${meal.status.toLowerCase()}`}>
              {meal.status}
            </span>
            <span className="spots-info">
              {meal.spotsAvailable > 0
                ? `${meal.spotsAvailable} spots available`
                : 'Full'}
            </span>
            {meal.createdByName && (
              <span className="creator-info">
                Created by {meal.createdByName}
              </span>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="meal-details-body">
          {/* Roles Section */}
          <div className="meal-section">
            <h3>Roles</h3>

            <div className="role-item">
              <div className="role-header">
                <span className="role-icon">👨‍🍳</span>
                <span className="role-title">Cook</span>
              </div>
              {meal.cookName ? (
                <div className="role-filled">
                  <span className="role-name">{meal.cookName}</span>
                  {userIsCook && (
                    <button
                      onClick={handleRemoveSignup}
                      disabled={actionLoading}
                      className="btn-remove-signup"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ) : (
                <div className="role-empty">
                  <span>No cook yet</span>
                  {!userIsCook && !userIsDiner && (meal.status === 'OPEN' || meal.status === 'CLOSED') && (
                    <button
                      onClick={() => handleSignup('COOK')}
                      disabled={actionLoading}
                      className="btn-signup"
                    >
                      Sign Up as Cook
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="role-item">
              <div className="role-header">
                <span className="role-icon">🧑‍🍳</span>
                <span className="role-title">Assistant</span>
              </div>
              {meal.assistantName ? (
                <div className="role-filled">
                  <span className="role-name">{meal.assistantName}</span>
                  {userIsAssistant && (
                    <button
                      onClick={handleRemoveSignup}
                      disabled={actionLoading}
                      className="btn-remove-signup"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ) : (
                <div className="role-empty">
                  <span>No assistant yet</span>
                  {!userIsAssistant && !userIsDiner && (meal.status === 'OPEN' || meal.status === 'CLOSED') && (
                    <button
                      onClick={() => handleSignup('ASSISTANT')}
                      disabled={actionLoading}
                      className="btn-signup"
                    >
                      Sign Up as Assistant
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Menu Section */}
          <div className="meal-section">
            <div className="section-header">
              <h3>📋 Menu</h3>
              {canEditMenu && !showMenuForm && (
                <button
                  onClick={() => setShowMenuForm(true)}
                  className="btn-edit"
                >
                  {meal.menu ? 'Edit Menu' : 'Post Menu'}
                </button>
              )}
            </div>

            {!showMenuForm ? (
              meal.menu ? (
                <div className="menu-content">{meal.menu}</div>
              ) : (
                <p className="empty-menu">No menu posted yet</p>
              )
            ) : (
              <form onSubmit={handleUpdateMenu} className="menu-form">
                <textarea
                  value={menuText}
                  onChange={(e) => setMenuText(e.target.value)}
                  placeholder="Enter the menu for this meal..."
                  rows="8"
                  maxLength="2000"
                  className="menu-textarea"
                  autoFocus
                />
                <div className="form-actions">
                  <button type="submit" disabled={actionLoading} className="btn-primary">
                    {actionLoading ? 'Saving...' : (meal.menu ? 'Save Changes' : 'Post Menu')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenuForm(false);
                      setMenuText(meal.menu || '');
                    }}
                    disabled={actionLoading}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Notes Section */}
          {meal.notes && (
            <div className="meal-section">
              <h3>📝 Notes</h3>
              <p>{meal.notes}</p>
            </div>
          )}

          {/* Diners Section */}
          <div className="meal-section">
            <div className="section-header">
              <h3>👥 Diners ({meal.currentDiners}/{meal.maxDiners})</h3>
              {!userIsDiner && !userIsCook && !userIsAssistant && meal.status === 'OPEN' && meal.spotsAvailable > 0 && (
                <button
                  onClick={() => handleSignup('DINER')}
                  disabled={actionLoading}
                  className="btn-signup"
                >
                  Sign Up as Diner
                </button>
              )}
            </div>

            {meal.diners && meal.diners.length > 0 ? (
              <ul className="diners-list">
                {meal.diners.map((diner) => (
                  <li key={diner.userId} className="diner-item">
                    <span className="diner-name">
                      {diner.name}
                      {diner.userId === user?.userId && ' (You)'}
                    </span>
                    {diner.dietaryRestrictions && (
                      <span className="diner-dietary">
                        {diner.dietaryRestrictions}
                      </span>
                    )}
                    {diner.userId === user?.userId && (
                      <button
                        onClick={handleRemoveSignup}
                        disabled={actionLoading}
                        className="btn-remove-signup-small"
                      >
                        Cancel
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-diners">No diners signed up yet</p>
            )}
          </div>

          {/* Actions */}
          {(userIsCreator || userIsCook) && (
            <div className="meal-section admin-section">
              <h3>⚙️ Actions</h3>
              <div className="action-buttons">
                {userIsCook && meal.status === 'OPEN' && (
                  <button
                    onClick={handleCloseMeal}
                    disabled={actionLoading}
                    className="btn-secondary"
                  >
                    Close Signups
                  </button>
                )}
                {userIsCook && meal.status === 'CLOSED' && (
                  <button
                    onClick={handleReopenMeal}
                    disabled={actionLoading}
                    className="btn-primary"
                  >
                    Reopen Signups
                  </button>
                )}
                {userIsCreator && (
                  <button
                    onClick={handleDeleteMeal}
                    disabled={actionLoading}
                    className="btn-danger"
                  >
                    Delete Meal
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmStyle={confirmDialog.confirmStyle}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default MealDetails;
