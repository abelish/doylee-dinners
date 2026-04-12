// Register form component

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [dietaryRestrictions, setDietaryRestrictions] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    other: false,
    otherText: '',
  });
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

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
    if (name === 'password') {
      const errors = validatePassword(value);
      setPasswordErrors(errors);

      // Also check if confirm password matches if it's filled
      if (formData.confirmPassword) {
        setConfirmPasswordError(
          value !== formData.confirmPassword ? 'Passwords do not match' : ''
        );
      }
    }

    // Real-time confirm password validation
    if (name === 'confirmPassword') {
      setConfirmPasswordError(
        value !== formData.password ? 'Passwords do not match' : ''
      );
    }
  };

  const handleDietaryChange = (e) => {
    const { name, checked, value } = e.target;
    if (name === 'otherText') {
      setDietaryRestrictions({
        ...dietaryRestrictions,
        otherText: value,
      });
    } else {
      setDietaryRestrictions({
        ...dietaryRestrictions,
        [name]: checked,
      });
    }
  };

  const formatDietaryRestrictions = () => {
    const restrictions = [];
    if (dietaryRestrictions.vegetarian) restrictions.push('Vegetarian');
    if (dietaryRestrictions.vegan) restrictions.push('Vegan');
    if (dietaryRestrictions.glutenFree) restrictions.push('Gluten-Free');
    if (dietaryRestrictions.other && dietaryRestrictions.otherText) {
      restrictions.push(`Other: ${dietaryRestrictions.otherText}`);
    }
    return restrictions.join(', ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password complexity
    const passwordValidationErrors = validatePassword(formData.password);
    if (passwordValidationErrors.length > 0) {
      setPasswordErrors(passwordValidationErrors);
      setError('Please fix the password requirements listed below');
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      setError('Please ensure passwords match');
      return;
    }

    setIsSubmitting(true);

    const result = await register(
      formData.email,
      formData.password,
      formData.name,
      formatDietaryRestrictions()
    );

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Registration failed');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Join Doylee Dinners</h2>
        <p className="auth-subtitle">Create your account</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              placeholder="Enter password"
              className={passwordErrors.length > 0 && formData.password ? 'input-error' : ''}
            />
            {passwordErrors.length > 0 && formData.password && (
              <div className="field-errors">
                <small className="field-error-title">Password must have:</small>
                {passwordErrors.map((err, index) => (
                  <small key={index} className="field-error">• {err}</small>
                ))}
              </div>
            )}
            {passwordErrors.length === 0 && formData.password && (
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
              autoComplete="new-password"
              placeholder="Re-enter password"
              className={confirmPasswordError && formData.confirmPassword ? 'input-error' : ''}
            />
            {confirmPasswordError && formData.confirmPassword && (
              <small className="field-error">{confirmPasswordError}</small>
            )}
            {!confirmPasswordError && formData.confirmPassword && formData.password === formData.confirmPassword && (
              <small className="field-success">✓ Passwords match</small>
            )}
          </div>

          <div className="form-group">
            <label>Dietary Restrictions (Optional)</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="vegetarian"
                  checked={dietaryRestrictions.vegetarian}
                  onChange={handleDietaryChange}
                />
                <span>Vegetarian</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="vegan"
                  checked={dietaryRestrictions.vegan}
                  onChange={handleDietaryChange}
                />
                <span>Vegan</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="glutenFree"
                  checked={dietaryRestrictions.glutenFree}
                  onChange={handleDietaryChange}
                />
                <span>Gluten-Free</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="other"
                  checked={dietaryRestrictions.other}
                  onChange={handleDietaryChange}
                />
                <span>Other</span>
              </label>

              {dietaryRestrictions.other && (
                <input
                  type="text"
                  name="otherText"
                  value={dietaryRestrictions.otherText}
                  onChange={handleDietaryChange}
                  placeholder="Please specify..."
                  className="other-input"
                />
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
