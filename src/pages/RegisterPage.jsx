import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../lib/errors';
import '../styles/auth.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validate(email, password) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return errors;
}

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationEmail, setConfirmationEmail] = useState('');

  const errors = submitted ? validate(email, password) : {};

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setError('');
    if (Object.keys(validate(email, password)).length > 0) return;

    setLoading(true);
    try {
      const { data, error: signUpError } = await signUp(email.trim(), password);

      if (signUpError) {
        setError(getAuthErrorMessage(signUpError));
      } else if (data.user && data.user.identities?.length === 0) {
        // Supabase returns a user with no identities when the email is already registered.
        setError('An account with this email already exists. Try logging in instead.');
      } else if (!data.session) {
        // Email confirmation is enabled: the user must verify their email first.
        setConfirmationEmail(email.trim());
      }
      // If a session was returned, PublicRoute redirects to the dashboard automatically.
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
    setLoading(false);
  }

  if (confirmationEmail) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1 className="auth-brand">Habit Tracker</h1>
          <h2 className="auth-title">Check your email</h2>
          <div className="alert alert-success" role="status">
            We sent a confirmation link to <strong>{confirmationEmail}</strong>. Please verify your
            email address, then log in.
          </div>
          <Link to="/login" className="btn btn-primary btn-block">
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-brand">Habit Tracker</h1>
        <h2 className="auth-title">Create an account</h2>
        <p className="auth-subtitle">Start building better habits, one day at a time.</p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              disabled={loading}
            />
            {errors.email && (
              <p id="email-error" className="field-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : 'password-hint'}
              disabled={loading}
            />
            {errors.password ? (
              <p id="password-error" className="field-error">
                {errors.password}
              </p>
            ) : (
              <p id="password-hint" className="field-hint">
                At least {MIN_PASSWORD_LENGTH} characters.
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}
