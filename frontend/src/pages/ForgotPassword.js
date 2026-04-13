// Forgot Password page

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authService from '../services/authService';
import '../components/auth/Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container fade-in">
        <div className="auth-card">
          <h2>Check Your Email</h2>
          <div className="success-message">
            If an account exists with that email address, we've sent you a password reset link.
            Please check your inbox and follow the instructions.
          </div>
          <p className="auth-subtitle" style={{ marginTop: '1.5rem' }}>
            The link will expire in 1 hour for security reasons.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <Link to="/login" className="link-primary">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container fade-in">
      <div className="auth-card">
        <h2>Forgot Password?</h2>
        <p className="auth-subtitle">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
