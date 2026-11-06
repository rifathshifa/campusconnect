import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await forgotPassword(email);
      setSuccess(true);
      if (data.reset_link) {
        setResetLink(data.reset_link);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center min-vh-100 animated-fade-in">
      <div className="cc-card w-100" style={{ maxWidth: '500px' }}>
        <div className="text-center mb-4">
          <div className="text-gold mb-3 d-inline-block">
            <KeyRound size={40} />
          </div>
          <h2 className="font-heading fw-bold">Forgot Password</h2>
          <p className="text-muted">Enter your email to request a reset link</p>
        </div>

        {error && (
          <div className="alert alert-cc-error py-2 px-3 mb-3 d-flex align-items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label d-flex align-items-center gap-2">
                <Mail size={16} className="text-gold" /> Email Address
              </label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="e.g. name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 d-flex justify-content-center align-items-center gap-2"
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center animated-fade-in">
            <div className="text-success mb-3">
              <CheckCircle2 size={48} className="mx-auto" />
            </div>
            <h4 className="font-heading text-light mb-3">Reset Email Requested</h4>
            <p className="text-muted small">
              If an account is associated with <strong>{email}</strong>, a password reset link has been dispatched.
            </p>

            {resetLink && (
              <div className="mt-4 p-3 rounded border text-start animated-fade-in" style={{ backgroundColor: 'var(--cc-bg-elevated)', borderColor: 'var(--cc-border-subtle)' }}>
                <span className="badge bg-gold text-dark mb-2 font-heading px-2 py-1">📬 Simulated Email Delivery</span>
                <p className="small mb-2" style={{ color: 'var(--cc-text-primary)' }}>We've simulated sending a recovery email in development mode:</p>
                <div className="d-grid mt-3">
                  <a href={resetLink} className="btn btn-outline-primary btn-sm text-center">
                    Reset Your Password Now
                  </a>
                </div>
                <div className="text-muted text-center mt-2" style={{ fontSize: '0.75rem' }}>
                  Clicking the button will direct you to the password reset form.
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-4 border-top border-secondary pt-3">
          <Link to="/login" className="btn-link d-inline-flex align-items-center gap-2 small">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
