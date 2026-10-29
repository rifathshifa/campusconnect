import React from 'react';

const Footer = () => {
  return (
    <footer className="cc-footer py-4 mt-auto">
      <div className="container text-center">
        <p className="mb-1">
          &copy; {new Date().getFullYear()} <span className="text-gold fw-bold">CampusConnect</span>. All rights reserved.
        </p>
        <small className="text-muted">
          Connecting students, resources, and campus updates.
        </small>
      </div>
    </footer>
  );
};

export default Footer;
