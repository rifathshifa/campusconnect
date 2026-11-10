import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, FileText, UploadCloud, GraduationCap, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  {
    title: 'Textbooks',
    type: 'Textbook PDF',
    icon: BookOpen,
    desc: 'Core course reference books'
  },
  {
    title: 'Lecture Notes',
    type: 'Lecture Notes',
    icon: FileText,
    desc: 'Handwritten & curated notes'
  },
  {
    title: 'Lab Manuals',
    type: 'Lab Manual',
    icon: UploadCloud,
    desc: 'Experiment guides & programs'
  },
  {
    title: 'Question Papers',
    type: 'Previous Year Question Paper',
    icon: GraduationCap,
    desc: 'Solved past university exams'
  }
];

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="hero-gradient animated-fade-in py-5 min-vh-100 d-flex flex-column justify-content-center">
      <div className="container">
        {/* Hero Section */}
        <div className="row align-items-center justify-content-between g-5 mb-5">
          <div className="col-lg-6">
            <h1 className="display-4 fw-extrabold mb-3 font-heading text-light">
              College Study Materials, <br />
              <span className="gold-gradient-text">Verified.</span>
            </h1>

            <p className="lead text-light mb-4 opacity-90" style={{ fontSize: '1.15rem', maxWidth: '520px' }}>
              Peer-shared textbooks, lecture notes, lab manuals, and exam papers — reviewed and verified by college staff.
            </p>

            <div className="d-flex flex-wrap gap-3">
              {isAuthenticated ? (
                <>
                  <Link to="/study-materials" className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2.5 shadow-sm">
                    <BookOpen size={17} /> Browse Library
                  </Link>
                  <Link to="/dashboard" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-4 py-2.5">
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/study-materials" className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2.5 shadow-sm">
                    Browse Library <ArrowRight size={17} />
                  </Link>
                  <Link to="/login" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-4 py-2.5">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="col-lg-6">
            <div className="row g-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.title} className="col-sm-6">
                    <Link
                      to={`/study-materials?material_type=${encodeURIComponent(cat.type)}`}
                      className="cc-card p-3.5 d-block text-decoration-none h-100 border-gold-subtle hover-border-gold transition-all"
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="text-gold">
                          <Icon size={24} />
                        </div>
                        <ArrowRight size={14} className="text-muted" />
                      </div>
                      <h5 className="font-heading text-light fw-bold mb-1 fs-6">{cat.title}</h5>
                      <span className="text-muted fs-8 d-block">{cat.desc}</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
