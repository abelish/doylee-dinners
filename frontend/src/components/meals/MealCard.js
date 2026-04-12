// Compact meal card component

import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../pages/Meals.css';

const MealCard = ({ meal }) => {
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const needsCook = !meal.cookId;
  const needsAssistant = !meal.assistantId;
  const isFull = meal.status === 'FULL';
  const isClosed = meal.status === 'CLOSED';

  const getStatusBadge = () => {
    if (isFull) {
      return <span className="status-badge status-full">Full</span>;
    }
    if (isClosed) {
      return <span className="status-badge status-closed">Closed</span>;
    }
    if (needsCook) {
      return <span className="status-badge status-needs-cook">Needs Cook</span>;
    }
    return <span className="status-badge status-open">Open</span>;
  };

  return (
    <div className="meal-card" onClick={() => navigate(`/meals/${meal.mealId}`)}>
      <div className="meal-card-header">
        <div className="meal-date">
          <span className="meal-icon">🍽️</span>
          <div>
            <div className="meal-date-text">{formatDate(meal.date)}</div>
            <div className="meal-time-text">{formatTime(meal.time)}</div>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="meal-card-body">
        {meal.cookName && (
          <div className="meal-role">
            <span className="role-icon">👨‍🍳</span>
            <span className="role-label">Cook:</span>
            <span className="role-name">{meal.cookName}</span>
          </div>
        )}
        {!meal.cookName && (
          <div className="meal-role meal-role-needed">
            <span className="role-icon">👨‍🍳</span>
            <span className="role-label">Cook needed</span>
          </div>
        )}

        {meal.assistantName && (
          <div className="meal-role">
            <span className="role-icon">🧑‍🍳</span>
            <span className="role-label">Assistant:</span>
            <span className="role-name">{meal.assistantName}</span>
          </div>
        )}
        {!meal.assistantName && (
          <div className="meal-role meal-role-needed">
            <span className="role-icon">🧑‍🍳</span>
            <span className="role-label">Assistant needed</span>
          </div>
        )}

        <div className="meal-diners">
          <span className="diners-icon">👥</span>
          <span className="diners-count">
            {meal.currentDiners}/{meal.maxDiners} diners signed up
          </span>
        </div>

        {meal.hasMenu && (
          <div className="meal-has-menu">
            <span>📋 Menu posted</span>
          </div>
        )}

        {meal.notes && (
          <div className="meal-notes">
            {meal.notes}
          </div>
        )}
      </div>

      <div className="meal-card-footer">
        <button
          className="btn-view-details"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/meals/${meal.mealId}`);
          }}
        >
          View Details →
        </button>
      </div>
    </div>
  );
};

export default MealCard;
