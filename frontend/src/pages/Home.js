// Home page (protected)

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>🍽️ Doylee Dinners</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/meals')} className="btn-meals">
            View Meals
          </button>
          <button onClick={() => navigate('/profile')} className="btn-profile">
            My Profile
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <main className="home-main">
        <div className="welcome-card">
          <h2>Welcome, {user?.name}!</h2>
          <p>You're successfully logged in to Doylee Dinners.</p>

          <div className="user-info">
            <h3>Your Profile</h3>
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">{user?.email}</span>
            </div>
            <div className="info-row">
              <span className="label">Name:</span>
              <span className="value">{user?.name}</span>
            </div>
            {user?.dietaryRestrictions && (
              <div className="info-row">
                <span className="label">Dietary Restrictions:</span>
                <span className="value dietary-restrictions">
                  {user.dietaryRestrictions.split(', ').map((restriction, index) => (
                    <span key={index} className="dietary-tag">
                      {restriction}
                    </span>
                  ))}
                </span>
              </div>
            )}
            <div className="info-row">
              <span className="label">Member Since:</span>
              <span className="value">
                {new Date(user?.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="cta-section">
            <h3>🎉 Ready to join the fun?</h3>
            <p>Browse upcoming dinners, sign up as a cook, or join as a diner!</p>
            <button onClick={() => navigate('/meals')} className="btn-cta">
              View Upcoming Meals →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
