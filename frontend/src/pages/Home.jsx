import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, MessageSquare, Compass, ArrowRight } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="hero-gradient animated-fade-in">
      <div className="container py-5">
        <div className="row align-items-center justify-content-between g-5">
          <div className="col-lg-6">
            <h1 className="display-4 fw-extrabold mb-4 font-heading">
              Connect and Excel on <span className="gold-gradient-text">Your Campus</span>
            </h1>
            <p className="lead text-light mb-5 opacity-90" style={{ fontSize: '1.2rem', lineHeight: '1.7' }}>
              CampusConnect is the unified portal for students to find events, connect with clubs, share academic projects, and stay updated with live campus announcements.
            </p>
            <div className="d-flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-primary d-flex align-items-center gap-2 px-4 py-3">
                  Go to Dashboard <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary d-flex align-items-center gap-2 px-4 py-3">
                    Get Started <ArrowRight size={18} />
                  </Link>
                  <Link to="/login" className="btn btn-outline-primary px-4 py-3">
                    Login to Portal
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="col-lg-5">
            <div className="row g-4">
              <div className="col-sm-6">
                <div className="cc-card h-100 p-4">
                  <div className="text-gold mb-3">
                    <Users size={32} />
                  </div>
                  <h4 className="h5 mb-2 font-heading">Student Clubs</h4>
                  <p className="text-muted small mb-0">Join interest groups and attend community meetups.</p>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="cc-card h-100 p-4">
                  <div className="text-gold mb-3">
                    <MessageSquare size={32} />
                  </div>
                  <h4 className="h5 mb-2 font-heading">Discussions</h4>
                  <p className="text-muted small mb-0">Ask questions, share advice, and chat with peers.</p>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="cc-card h-100 p-4">
                  <div className="text-gold mb-3">
                    <Compass size={32} />
                  </div>
                  <h4 className="h5 mb-2 font-heading">Resources</h4>
                  <p className="text-muted small mb-0">Discover study guides, courses, and exam archives.</p>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="cc-card h-100 p-4">
                  <div className="text-gold mb-3">
                    <Shield size={32} />
                  </div>
                  <h4 className="h5 mb-2 font-heading">Verified Portal</h4>
                  <p className="text-muted small mb-0">Secure JWT login restricted to verified accounts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
