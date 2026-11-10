import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, UserPlus } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    major: '',
    graduationYear: ''
  });
  const [role, setRole] = useState('student'); // 'student' or 'staff'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: formData.username,
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: role,
        major: formData.major,
        graduation_year: role === 'student' ? parseInt(formData.graduationYear, 10) : null
      });

      toast.success('Account created successfully! Welcome to CampusConnect.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Registration failed. Please check your credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4 py-sm-5 d-flex justify-content-center align-items-center min-vh-100 animated-fade-in">
      <div className="cc-card w-100 p-4 p-sm-5" style={{ maxWidth: '520px' }}>
        <div className="text-center mb-4">
          <div className="text-gold mb-2 d-inline-block">
            <UserPlus size={32} />
          </div>
          <h2 className="font-heading fw-bold fs-4 mb-0">
            {role === 'student' ? 'Student Registration' : 'Staff Registration'}
          </h2>
        </div>

        {/* Role Tabs */}
        <div className="cc-role-tab-group mb-4">
          <button
            type="button"
            className={`cc-role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => { setRole('student'); setError(null); }}
          >
            Student
          </button>
          <button
            type="button"
            className={`cc-role-tab ${role === 'staff' ? 'active' : ''}`}
            onClick={() => { setRole('staff'); setError(null); }}
          >
            Staff
          </button>
        </div>

        {error && (
          <div className="alert alert-cc-error py-2 px-3 mb-3 d-flex align-items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label fs-7">Username</label>
              <input
                type="text"
                name="username"
                required
                className="form-control"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fs-7">Full Name</label>
              <input
                type="text"
                name="fullName"
                required
                className="form-control"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fs-7">Email Address</label>
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

          {/* Dynamic Role-Based Fields */}
          {role === 'student' ? (
            <div className="row g-3 mb-3">
              <div className="col-md-7">
                <label className="form-label fs-7">Department / Major</label>
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
                <label className="form-label fs-7">Graduation Year</label>
                <input
                  type="number"
                  name="graduationYear"
                  required
                  className="form-control"
                  placeholder="Year (e.g. 2026)"
                  value={formData.graduationYear}
                  onChange={handleChange}
                />
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <label className="form-label fs-7">Department</label>
              <input
                type="text"
                name="major"
                required
                className="form-control"
                placeholder="Department name"
                value={formData.major}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label fs-7">Password</label>
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
            <div className="col-md-6">
              <label className="form-label fs-7">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                className="form-control"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
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

        <div className="text-center mt-4 text-muted small border-top pt-3" style={{ borderColor: 'var(--cc-border-subtle)' }}>
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
