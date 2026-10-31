import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { API_URL } from '../../config/api';
import { LogOut, User, LayoutDashboard, Home, LogIn, UserPlus, ShieldCheck, Sun, Moon, BookOpen } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  // Check pending approvals count if staff
  useEffect(() => {
    let isMounted = true;
    const fetchPendingCount = async () => {
      if (!token || !isStaff) return;
      try {
        const res = await fetch(`${API_URL}/study-materials/pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPendingCount(data.materials?.length || 0);
          }
        }
      } catch (err) {
        // Silently handle count polling
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000); // Polling every 15s for staff
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, isStaff]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-danger text-light';
      case 'staff':
        return 'bg-success text-light';
      default:
        return 'bg-secondary text-light';
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark cc-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand cc-navbar-brand d-flex align-items-center gap-2" to="/">
          <BookOpen className="text-gold" size={24} />
          <span>Campus<span>Connect</span></span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-1" to="/">
                <Home size={16} /> Home
              </Link>
            </li>
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link className="nav-link d-flex align-items-center gap-1" to="/dashboard">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link d-flex align-items-center gap-1 text-gold fw-semibold" to="/study-materials">
                    <BookOpen size={16} className="text-gold" /> Study Materials
                  </Link>
                </li>
                {isStaff && (
                  <li className="nav-item">
                    <Link className="nav-link d-flex align-items-center gap-1 text-warning fw-semibold" to="/study-materials?tab=pending">
                      <ShieldCheck size={16} />
                      <span>Pending Approvals</span>
                      {pendingCount > 0 && (
                        <span className="badge bg-danger text-light ms-1 rounded-pill animate-pulse">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {isAuthenticated ? (
              <>
                <span className="text-light d-flex align-items-center gap-1 font-heading me-1">
                  <User size={16} className="text-gold" />
                  Hi, <strong className="text-gold">{user?.full_name || user?.username}</strong>
                  <span className={`badge ms-2 text-capitalize ${getBadgeClass(user?.role)}`} style={{ fontSize: '0.75rem', padding: '0.3em 0.6em', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    {user?.role}
                  </span>
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 py-1 px-3"
                >
                  <LogOut size={14} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-link btn-sm d-flex align-items-center gap-1 text-light">
                  <LogIn size={16} /> Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm d-flex align-items-center gap-1 py-1 px-3">
                  <UserPlus size={16} /> Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
