import React, { Component } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-fluid py-5 d-flex flex-column justify-content-center align-items-center min-vh-100 bg-navy-deep text-center px-4">
          <div className="cc-card p-5 border border-danger shadow-lg" style={{ maxWidth: '550px' }}>
            <div className="text-danger mb-4 d-inline-block p-3 rounded-circle" style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)' }}>
              <AlertOctagon size={48} />
            </div>
            <h2 className="font-heading text-gold mb-3">Something went wrong</h2>
            <p className="text-light opacity-75 mb-4">
              We encountered a runtime rendering exception. This might be due to outdated cached data or an unexpected response from our backend services.
            </p>
            {this.state.error && (
              <div className="p-3 mb-4 rounded text-start text-danger bg-dark border border-secondary small overflow-auto font-monospace" style={{ maxHeight: '150px', whiteSpace: 'pre-wrap' }}>
                {this.state.error.toString()}
              </div>
            )}
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <button 
                onClick={this.handleReset}
                className="btn btn-primary d-flex align-items-center gap-2 py-2 px-4"
              >
                <RefreshCw size={16} /> Return to Home
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-outline-primary py-2 px-4"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
