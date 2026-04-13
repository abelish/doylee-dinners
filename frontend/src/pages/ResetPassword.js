// Reset Password page

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services/authService';
import '../components/auth/Auth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    // Validate token format on mount
    if (!token || !/^[0-9a-f]{64}$/i.test(token)) {
      setError('Invalid or expired reset link');
    }
  }, [token]);

  const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('At least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('At least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('At least one number');
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time password validation
    if (name === 'newPassword') {
      const errors = validatePassword(value);
      setPasswordErrors(errors);

      // Also check if confirm password matches
      if (formData.confirmPassword) {
        setConfirmPasswordError(
          value !== formData.confirmPassword ? 'Passwords do not match' : ''
        );
      }
    }

    // Real-time confirm password validation
    if (name === 'confirmPassword') {
      setConfirmPasswordError(
        value !== formData.newPassword ? 'Passwords do not match' : ''
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password complexity
    const passwordValidationErrors = validatePassword(formData.newPassword);
    if (passwordValidationErrors.length > 0) {
      setPasswordErrors(passwordValidationErrors);
      setError('Please fix the password requirements listed below');
      return;
    }

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      setError('Please ensure passwords match');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(token, formData.newPassword);

      if (response.success) {
        // Store token and user
        localStorage.setItem('auth_token', response.data.token);
        updateUser(response.data.user);

        // Redirect to home
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (error && !formData.newPassword) {
    // Show error state for invalid token
    return (
      <div className="auth-container fade-in">
        <div className="auth-card">
          <h2>Reset Password</h2>
          <div className="error-message">{error}</div>
          <p className="auth-subtitle" style={{ marginTop: '1.5rem' }}>
            This reset link is invalid or has expired. Please request a new password reset.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <a href="/forgot-password" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Request New Reset Link
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container fade-in">
      <div className="auth-card">
        <h2>Reset Your Password</h2>
        <p className="auth-subtitle">Enter your new password below.</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              autoFocus
              placeholder="Enter new password"
              className={passwordErrors.length > 0 && formData.newPassword ? 'input-error' : ''}
              disabled={loading}
            />
            {passwordErrors.length > 0 && formData.newPassword && (
              <div className="field-errors">
                <small className="field-error-title">Password must have:</small>
                {passwordErrors.map((err, index) => (
                  <small key={index} className="field-error">• {err}</small>
                ))}
              </div>
            )}
            {passwordErrors.length === 0 && formData.newPassword && (
              <small className="field-success">✓ Password meets requirements</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter new password"
              className={confirmPasswordError && formData.confirmPassword ? 'input-error' : ''}
              disabled={loading}
            />
            {confirmPasswordError && formData.confirmPassword && (
              <small className="field-error">{confirmPasswordError}</small>
            )}
            {!confirmPasswordError && formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
              <small className="field-success">✓ Passwords match</small>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Resetting password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
