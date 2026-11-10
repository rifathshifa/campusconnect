import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogIn, Mail, Lock } from 'lucide-react';

const Login = () => {
  const { login, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('student'); // student, staff, admin
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      
      // Enforce role constraints for security and visual separation
      if (selectedRole === 'student' && user.role !== 'student' && user.role !== 'club_leader') {
        logout();
        const msg = "Account is registered as staff or admin. Please use the appropriate tab.";
        setError(msg);
        toast.error(msg);
        return;
      }
      if (selectedRole === 'staff' && user.role !== 'staff') {
        logout();
        const msg = "Account is not registered as staff. Please use the appropriate tab.";
        setError(msg);
        toast.error(msg);
        return;
      }
      if (selectedRole === 'admin' && user.role !== 'admin') {
        logout();
        const msg = "Access denied. Admin credentials required.";
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success(`Welcome back, ${user.username}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Incorrect email or password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (selectedRole) {
      case 'staff':
        return 'Staff Sign In';
      case 'admin':
        return 'Admin Portal';
      default:
        return 'Student Sign In';
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center min-vh-100 animated-fade-in">
      <div className="cc-card w-100" style={{ maxWidth: '450px' }}>
        <div className="text-center mb-4">
          <div className="text-gold mb-2 d-inline-block">
            <LogIn size={32} />
          </div>
          <h2 className="font-heading fw-bold fs-4 mb-0">{getTitle()}</h2>
        </div>

        {/* Dynamic Role Tabs */}
        <div className="cc-role-tab-group mb-4">
          <button
            type="button"
            className={`cc-role-tab ${selectedRole === 'student' ? 'active' : ''}`}
            onClick={() => { setSelectedRole('student'); setError(null); }}
          >
            Student
          </button>
          <button
            type="button"
            className={`cc-role-tab ${selectedRole === 'staff' ? 'active' : ''}`}
            onClick={() => { setSelectedRole('staff'); setError(null); }}
          >
            Staff
          </button>
          <button
            type="button"
            className={`cc-role-tab ${selectedRole === 'admin' ? 'active' : ''}`}
            onClick={() => { setSelectedRole('admin'); setError(null); }}
          >
            Admin
          </button>
        </div>

        {error && (
          <div className="alert alert-cc-error py-2 px-3 mb-3 d-flex align-items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label d-flex align-items-center gap-2 fs-7">
              <Mail size={15} className="text-gold" /> Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              className="form-control"
              placeholder="name@university.edu"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label d-flex align-items-center gap-2 fs-7">
              <Lock size={15} className="text-gold" /> Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="form-control"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="d-flex justify-content-end mb-4">
            <Link to="/forgot-password" className="btn-link small">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-100 d-flex justify-content-center align-items-center gap-2"
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-4 text-muted small border-top pt-3" style={{ borderColor: 'var(--cc-border-subtle)' }}>
          {selectedRole === 'admin' ? (
            <span>Admin registration is disabled.</span>
          ) : (
            <>
              Don't have an account?{' '}
              <Link to="/register" className="btn-link">
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
