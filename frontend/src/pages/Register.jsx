import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserPlus, User, Mail, Lock } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState('student'); // student, staff
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    major: '', // Student Major or Staff Department
    graduationYear: '', // Student graduation year
    password: '',
    confirmPassword: ''
  });
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

    if (formData.password !== formData.confirmPassword) {
      const msg = "Passwords do not match";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (formData.password.length < 6) {
      const msg = "Password must be at least 6 characters";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      await register(
        formData.username,
        formData.email,
        formData.password,
        role,
        formData.fullName || formData.username,
        formData.major,
        role === 'student' ? formData.graduationYear : ''
      );
      toast.success("Account created successfully!");
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Registration failed. Try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center min-vh-100 animated-fade-in">
      <div className="cc-card w-100" style={{ maxWidth: '520px' }}>
        <div className="text-center mb-4">
          <div className="text-gold mb-3 d-inline-block">
            <UserPlus size={40} />
          </div>
          <h2 className="font-heading fw-bold">
            {role === 'student' ? 'Student Registration' : 'Staff Registration'}
          </h2>
          <p className="text-muted">Register for the CampusConnect portal</p>
        </div>

        {/* Role Tabs */}
        <div className="cc-role-tab-group mb-4">
          <button
            type="button"
            className={`cc-role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => { setRole('student'); setError(null); }}
          >
            Register as Student
          </button>
          <button
            type="button"
            className={`cc-role-tab ${role === 'staff' ? 'active' : ''}`}
            onClick={() => { setRole('staff'); setError(null); }}
          >
            Register as Staff
          </button>
        </div>

        {error && (
          <div className="alert alert-cc-error py-2 px-3 mb-3 d-flex align-items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label d-flex align-items-center gap-2">
              <User size={16} className="text-gold" /> Username
            </label>
            <input
              type="text"
              name="username"
              required
              className="form-control"
              placeholder="e.g. johndoe"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label d-flex align-items-center gap-2">
              <User size={16} className="text-gold" /> Full Name
            </label>
            <input
              type="text"
              name="fullName"
              required
              className="form-control"
              placeholder="e.g. John Doe"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label d-flex align-items-center gap-2">
              <Mail size={16} className="text-gold" /> Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              className="form-control"
              placeholder="e.g. name@university.edu"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Dynamic Role-Based Fields */}
          {role === 'student' ? (
            <div className="row g-3 mb-3">
              <div className="col-md-7">
                <label className="form-label">Major</label>
                <input
                  type="text"
                  name="major"
                  required
                  className="form-control"
                  placeholder="e.g. Computer Science"
                  value={formData.major}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-5">
                <label className="form-label">Graduation Year</label>
                <input
                  type="number"
                  name="graduationYear"
                  required
                  className="form-control"
                  placeholder="e.g. 2028"
                  value={formData.graduationYear}
                  onChange={handleChange}
                />
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <label className="form-label">Department / Office</label>
              <input
                type="text"
                name="major"
                required
                className="form-control"
                placeholder="e.g. Academic Advising or administration"
                value={formData.major}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label d-flex align-items-center gap-2">
              <Lock size={16} className="text-gold" /> Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="form-control"
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="mb-4">
            <label className="form-label d-flex align-items-center gap-2">
              <Lock size={16} className="text-gold" /> Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              className="form-control"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-100 d-flex justify-content-center align-items-center gap-2"
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-4 text-muted small border-top border-secondary pt-3">
          Already have an account?{' '}
          <Link to="/login" className="btn-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
