// User profile page

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import usersService from '../services/usersService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState(user?.name || '');
  const [vegetarian, setVegetarian] = useState(false);
  const [vegan, setVegan] = useState(false);
  const [glutenFree, setGlutenFree] = useState(false);
  const [other, setOther] = useState(false);
  const [otherText, setOtherText] = useState('');

  // Initialize dietary restrictions checkboxes
  React.useEffect(() => {
    if (user?.dietaryRestrictions) {
      const restrictions = user.dietaryRestrictions.split(', ');
      setVegetarian(restrictions.includes('Vegetarian'));
      setVegan(restrictions.includes('Vegan'));
      setGlutenFree(restrictions.includes('Gluten-Free'));

      const otherRestrictions = restrictions.filter(
        r => !['Vegetarian', 'Vegan', 'Gluten-Free'].includes(r)
      );
      if (otherRestrictions.length > 0) {
        setOther(true);
        setOtherText(otherRestrictions.join(', '));
      }
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(user?.name || '');
    setError(null);
    setSuccess(null);

    // Reset dietary restrictions
    if (user?.dietaryRestrictions) {
      const restrictions = user.dietaryRestrictions.split(', ');
      setVegetarian(restrictions.includes('Vegetarian'));
      setVegan(restrictions.includes('Vegan'));
      setGlutenFree(restrictions.includes('Gluten-Free'));

      const otherRestrictions = restrictions.filter(
        r => !['Vegetarian', 'Vegan', 'Gluten-Free'].includes(r)
      );
      if (otherRestrictions.length > 0) {
        setOther(true);
        setOtherText(otherRestrictions.join(', '));
      } else {
        setOther(false);
        setOtherText('');
      }
    }
  };

  const formatDietaryRestrictions = () => {
    const restrictions = [];
    if (vegetarian) restrictions.push('Vegetarian');
    if (vegan) restrictions.push('Vegan');
    if (glutenFree) restrictions.push('Gluten-Free');
    if (other && otherText.trim()) restrictions.push(otherText.trim());
    return restrictions.join(', ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const updates = {
        name: name.trim(),
        dietaryRestrictions: formatDietaryRestrictions(),
      };

      const response = await usersService.updateUserProfile(user.userId, updates);

      if (response.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);

        // Update user in auth context
        if (updateUser) {
          updateUser(response.data.user);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="profile-container fade-in">
      <div className="profile-nav">
        <button onClick={() => navigate('/')} className="btn-back">
          Home
        </button>
        <button onClick={() => navigate('/meals')} className="btn-back">
          Meals
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-header">
          <h1>My Profile</h1>
          {!isEditing && (
            <button onClick={handleEdit} className="btn-edit">
              Edit Profile
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-section">
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{user.email}</span>
              </div>
              <div className="info-row">
                <span className="label">Name:</span>
                <span className="value">{user.name}</span>
              </div>
              {user.dietaryRestrictions && (
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
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength="100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email (cannot be changed)</label>
                <input
                  type="email"
                  id="email"
                  value={user.email}
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Dietary Restrictions</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={vegetarian}
                      onChange={(e) => setVegetarian(e.target.checked)}
                    />
                    Vegetarian
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={vegan}
                      onChange={(e) => setVegan(e.target.checked)}
                    />
                    Vegan
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={glutenFree}
                      onChange={(e) => setGlutenFree(e.target.checked)}
                    />
                    Gluten-Free
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={other}
                      onChange={(e) => setOther(e.target.checked)}
                    />
                    Other
                  </label>
                </div>
                {other && (
                  <input
                    type="text"
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Please specify..."
                    maxLength="200"
                    className="other-input"
                  />
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
