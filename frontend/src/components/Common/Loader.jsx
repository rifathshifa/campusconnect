import React from 'react';
import { GraduationCap } from 'lucide-react';

export const Spinner = ({ size = 'sm', color = 'light' }) => {
  const sizeClass = size === 'sm' ? 'spinner-border-sm' : '';
  const textClass = `text-${color}`;
  return (
    <div className={`spinner-border ${sizeClass} ${textClass}`} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );
};

export const LoadingScreen = ({ message = 'Loading CampusConnect...' }) => {
  return (
    <div className="container py-5 d-flex flex-column justify-content-center align-items-center min-vh-100 bg-navy-deep cc-loading-screen">
      <div className="cc-loader-logo-wrap mb-4 animated-pulse">
        <div className="cc-loader-ring"></div>
        <GraduationCap size={48} className="text-gold cc-loader-icon" />
      </div>
      <h5 className="font-heading text-gold mb-2 animated-fade-in">{message}</h5>
      <p className="text-muted small">Connecting to servers...</p>
    </div>
  );
};

export const SkeletonLoader = ({ type = 'card', count = 1, height }) => {
  const renderItems = () => {
    const items = [];
    for (let i = 0; i < count; i++) {
      if (type === 'card') {
        items.push(
          <div key={i} className="dashboard-card h-100 p-4 skeleton-container mb-3" style={{ borderLeft: '3px solid var(--cc-navy-light)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="skeleton-line w-50" style={{ height: '14px' }}></div>
              <div className="skeleton-circle" style={{ width: '20px', height: '20px' }}></div>
            </div>
            <div className="skeleton-line w-75 mb-2" style={{ height: '28px' }}></div>
            <div className="skeleton-line w-40" style={{ height: '12px' }}></div>
          </div>
        );
      } else if (type === 'table') {
        items.push(
          <div key={i} className="skeleton-container mb-2 p-2 border-bottom border-secondary d-flex flex-column gap-2">
            <div className="d-flex justify-content-between">
              <div className="skeleton-line w-30" style={{ height: '14px' }}></div>
              <div className="skeleton-line w-20" style={{ height: '14px' }}></div>
              <div className="skeleton-line w-15" style={{ height: '14px' }}></div>
            </div>
            <div className="d-flex justify-content-between">
              <div className="skeleton-line w-50" style={{ height: '10px' }}></div>
              <div className="skeleton-line w-10" style={{ height: '10px' }}></div>
            </div>
          </div>
        );
      } else if (type === 'list') {
        items.push(
          <div key={i} className="skeleton-container d-flex align-items-center gap-3 p-3 mb-2 rounded border border-secondary">
            <div className="skeleton-circle" style={{ width: '40px', height: '40px' }}></div>
            <div className="flex-grow-1">
              <div className="skeleton-line w-50 mb-2" style={{ height: '16px' }}></div>
              <div className="skeleton-line w-80" style={{ height: '12px' }}></div>
            </div>
            <div className="skeleton-line w-10" style={{ height: '14px' }}></div>
          </div>
        );
      } else if (type === 'chat') {
        items.push(
          <div key={i} className="skeleton-container mb-3 d-flex flex-column gap-2">
            <div className="skeleton-line w-25 align-self-start" style={{ height: '12px', borderRadius: '4px' }}></div>
            <div className="skeleton-line w-75 p-3 rounded" style={{ height: '50px', borderRadius: '12px' }}></div>
          </div>
        );
      } else {
        items.push(
          <div key={i} className="skeleton-container mb-3" style={{ height: height || '20px' }}>
            <div className="skeleton-line w-100 h-100"></div>
          </div>
        );
      }
    }
    return items;
  };

  return <>{renderItems()}</>;
};
