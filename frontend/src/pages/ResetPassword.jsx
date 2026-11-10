import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [token, setToken] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Password reset token is missing or invalid.');
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Token is missing or invalid.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, formData.password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center min-vh-100 animated-fade-in">
      <div className="cc-card w-100" style={{ maxWidth: '460px' }}>
        <div className="text-center mb-4">
          <div className="text-gold mb-2 d-inline-block">
            <Lock size={32} />
          </div>
          <h2 className="font-heading fw-bold fs-4 mb-0">Set New Password</h2>
        </div>

        {error && (
          <div className="alert alert-cc-error py-2 px-3 mb-3 d-flex align-items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label d-flex align-items-center gap-2 fs-7">
                <Lock size={15} className="text-gold" /> New Password
              </label>
              <input
                type="password"
                name="password"
                required
                className="form-control"
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={!token}
              />
            </div>

            <div className="mb-4">
              <label className="form-label d-flex align-items-center gap-2 fs-7">
                <Lock size={15} className="text-gold" /> Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                className="form-control"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={!token}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="btn btn-primary w-100 d-flex justify-content-center align-items-center gap-2"
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : 'Update Password'}
            </button>
          </form>
        ) : (
          <div className="text-center animated-fade-in">
            <div className="text-success mb-2">
              <CheckCircle2 size={40} className="mx-auto" />
            </div>
            <h5 className="font-heading text-light mb-1">Password Updated</h5>
            <p className="text-muted small mb-0">
              Redirecting to sign-in...
            </p>
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

export default ResetPassword;
