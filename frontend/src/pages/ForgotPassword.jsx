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
      <div className="cc-card w-100" style={{ maxWidth: '460px' }}>
        <div className="text-center mb-4">
          <div className="text-gold mb-2 d-inline-block">
            <KeyRound size={32} />
          </div>
          <h2 className="font-heading fw-bold fs-4 mb-0">Reset Password</h2>
        </div>

        {error && (
          <div className="alert alert-cc-error py-2 px-3 mb-3 d-flex align-items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label d-flex align-items-center gap-2 fs-7">
                <Mail size={15} className="text-gold" /> Email Address
              </label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="name@university.edu"
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
            <div className="text-success mb-2">
              <CheckCircle2 size={40} className="mx-auto" />
            </div>
            <h5 className="font-heading text-light mb-2">Link Sent</h5>
            <p className="text-muted small mb-0">
              If an account matches <strong>{email}</strong>, a reset link has been dispatched.
            </p>

            {resetLink && (
              <div className="mt-3 p-3 rounded border text-start animated-fade-in" style={{ backgroundColor: 'var(--cc-bg-elevated)', borderColor: 'var(--cc-border-subtle)' }}>
                <span className="badge bg-gold text-dark mb-2 font-heading px-2 py-0.5 fs-8">Simulated Email</span>
                <div className="d-grid mt-2">
                  <a href={resetLink} className="btn btn-outline-primary btn-sm text-center">
                    Reset Password
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-4 border-top pt-3" style={{ borderColor: 'var(--cc-border-subtle)' }}>
          <Link to="/login" className="btn-link d-inline-flex align-items-center gap-2 small">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
