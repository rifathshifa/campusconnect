import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, User, LayoutDashboard, Home, LogIn, UserPlus, ShieldCheck, UploadCloud, Sparkles, Sun, Moon } from 'lucide-react';


const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
      case 'club_leader':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary text-light';
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark cc-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand cc-navbar-brand" to="/">
          Campus<span>Connect</span>
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
                  <Link className="nav-link d-flex align-items-center gap-1" to="/files">
                    <UploadCloud size={16} /> Files
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link d-flex align-items-center gap-1 text-gold" to="/study-assistant">
                    <Sparkles size={16} className="text-gold" /> AI Assistant
                  </Link>
                </li>
              </>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center gap-1" to="/admin/panel">
                  <ShieldCheck size={16} className="text-gold" /> Admin Panel
                </Link>
              </li>
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
                  Hi, <strong className="text-gold">{user?.username}</strong>
                  <span className={`badge ms-2 text-capitalize ${getBadgeClass(user?.role)}`} style={{ fontSize: '0.75rem', padding: '0.3em 0.6em', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    {user?.role === 'club_leader' ? 'Club Leader' : user?.role}
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
                <Link to="/login" className="btn btn-link btn-sm d-flex align-items-center gap-1">
                  <LogIn size={16} /> Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm d-flex align-items-center gap-1 py-1 px-3">
                  <UserPlus size={16} /> Sign Up
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
