import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, ShieldCheck, UploadCloud, FileText, ArrowRight, CheckCircle2, GraduationCap, Sparkles } from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="hero-gradient animated-fade-in py-5 min-vh-100 d-flex flex-column justify-content-center">
      <div className="container">
        {/* Hero Section */}
        <div className="row align-items-center justify-content-between g-5 mb-5">
          <div className="col-lg-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="badge bg-gold text-dark fw-bold px-3 py-2 text-uppercase tracking-wide d-inline-flex align-items-center gap-1">
                <GraduationCap size={15} /> Official College Platform
              </span>
              <span className="badge bg-navy-light text-light px-3 py-2">
                100% Staff Verified
              </span>
            </div>

            <h1 className="display-4 fw-extrabold mb-4 font-heading text-light">
              College Digital <br />
              <span className="gold-gradient-text">Study Materials Library</span>
            </h1>

            <p className="lead text-light mb-5 opacity-90" style={{ fontSize: '1.15rem', lineHeight: '1.7' }}>
              Access and share verified college resources. Seniors and students upload textbooks,
              lab manuals, lecture notes, and solved previous year question papers. Every document
              is reviewed by college staff before becoming publicly available.
            </p>

            <div className="d-flex flex-wrap gap-3">
              {isAuthenticated ? (
                <>
                  <Link to="/study-materials" className="btn btn-primary d-flex align-items-center gap-2 px-4 py-3 shadow-lg">
                    <BookOpen size={18} /> Browse Study Library
                  </Link>
                  <Link to="/dashboard" className="btn btn-outline-primary px-4 py-3">
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-primary d-flex align-items-center gap-2 px-4 py-3 shadow-lg">
                    Sign In to College Library <ArrowRight size={18} />
                  </Link>
                  <Link to="/register" className="btn btn-outline-primary px-4 py-3">
                    Register Student Account
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="col-lg-5">
            <div className="row g-4">
              <div className="col-sm-6">
                <div className="cc-card h-100 p-4 border-gold-subtle hover-border-gold transition-all">
                  <div className="text-gold mb-3">
                    <BookOpen size={30} />
                  </div>
                  <h4 className="h5 mb-2 font-heading text-light">Textbooks & Notes</h4>
                  <p className="text-muted fs-7 mb-0">High-quality handwritten notes and reference book PDFs organized by semester.</p>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="cc-card h-100 p-4 border-gold-subtle hover-border-gold transition-all">
                  <div className="text-gold mb-3">
                    <FileText size={30} />
                  </div>
                  <h4 className="h5 mb-2 font-heading text-light">Lab Manuals & Code</h4>
                  <p className="text-muted fs-7 mb-0">Complete lab experiment manuals and code listings for engineering laboratories.</p>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="cc-card h-100 p-4 border-gold-subtle hover-border-gold transition-all">
                  <div className="text-gold mb-3">
                    <UploadCloud size={30} />
                  </div>
                  <h4 className="h5 mb-2 font-heading text-light">Solved PYQ Papers</h4>
                  <p className="text-muted fs-7 mb-0">Previous year university exam question papers with answer solutions.</p>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="cc-card h-100 p-4 border-gold-subtle hover-border-gold transition-all">
                  <div className="text-gold mb-3">
                    <ShieldCheck size={30} />
                  </div>
                  <h4 className="h5 mb-2 font-heading text-light">Staff Moderation</h4>
                  <p className="text-muted fs-7 mb-0">Every upload requires staff review and approval before becoming public.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="card cc-glass-card border-0 p-4 p-md-5 mt-4">
          <div className="row g-4 text-center">
            <div className="col-md-4">
              <div className="d-flex flex-column align-items-center">
                <div className="p-3 rounded-circle bg-navy-main border border-gold text-gold mb-3">
                  <UploadCloud size={24} />
                </div>
                <h5 className="text-light font-heading fw-bold">1. Student Uploads</h5>
                <p className="text-muted fs-7 mb-0">Students upload helpful notes and PDFs with title, subject, semester, and department.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="d-flex flex-column align-items-center">
                <div className="p-3 rounded-circle bg-navy-main border border-warning text-warning mb-3">
                  <ShieldCheck size={24} />
                </div>
                <h5 className="text-light font-heading fw-bold">2. Staff Verification</h5>
                <p className="text-muted fs-7 mb-0">College staff inspect and preview documents, approving valid materials or providing feedback.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="d-flex flex-column align-items-center">
                <div className="p-3 rounded-circle bg-navy-main border border-success text-success mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <h5 className="text-light font-heading fw-bold">3. Campus Access</h5>
                <p className="text-muted fs-7 mb-0">Approved resources instantly become available for all college students to view and download.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
