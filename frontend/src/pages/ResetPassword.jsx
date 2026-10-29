import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [token, setToken] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Extract token from query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Password reset token is missing. Please request a new link.');
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
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center min-vh-100 animated-fade-in">
      <div className="cc-card w-100" style={{ maxWidth: '500px' }}>
        <div className="text-center mb-4">
          <div className="text-gold mb-3 d-inline-block">
            <Lock size={40} />
          </div>
          <h2 className="font-heading fw-bold">Reset Password</h2>
          <p className="text-muted">Enter a new secure password for your account</p>
        </div>

        {error && (
          <div className="alert alert-cc-error py-2 px-3 mb-3 d-flex align-items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label d-flex align-items-center gap-2">
                <Lock size={16} className="text-gold" /> New Password
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
              <label className="form-label d-flex align-items-center gap-2">
                <Lock size={16} className="text-gold" /> Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                className="form-control"
                placeholder="Confirm your password"
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
            <div className="text-success mb-3">
              <CheckCircle2 size={48} className="mx-auto" />
            </div>
            <h4 className="font-heading text-light mb-2">Password Updated!</h4>
            <p className="text-muted">
              Your password has been reset successfully. Redirecting you to the sign-in page...
            </p>
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

export default ResetPassword;
