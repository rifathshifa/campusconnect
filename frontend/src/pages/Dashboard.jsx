import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config/api';
import { SkeletonLoader } from '../components/Common/Loader';
import {
  BookOpen, UploadCloud, ShieldCheck, CheckCircle2, Clock, XCircle,
  FileText, Download, Eye, ArrowRight, RefreshCw,
  AlertCircle, Check, X, ChevronRight, User
} from 'lucide-react';

const Dashboard = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Rejection modal state for staff
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectMaterialId, setRejectMaterialId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // PDF Preview modal state
  const [previewMaterial, setPreviewMaterial] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to load dashboard.');
      }
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboard();
    }
  }, [token]);

  // Handle staff approve
  const handleApprove = async (id, title) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API_URL}/study-materials/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Approval failed.');

      toast.success(`Approved "${title}"`);
      fetchDashboard();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle staff reject
  const handleOpenRejectModal = (id) => {
    setRejectMaterialId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectMaterialId) return;

    setRejecting(true);
    try {
      const res = await fetch(`${API_URL}/study-materials/${rejectMaterialId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Rejection failed.');

      toast.info('Document rejected');
      setShowRejectModal(false);
      setRejectMaterialId(null);
      setRejectReason('');
      fetchDashboard();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRejecting(false);
    }
  };

  // Preview PDF in modal
  const handleOpenPreview = async (material) => {
    setPreviewMaterial(material);
    setPreviewLoading(true);

    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }

    try {
      const res = await fetch(`${API_URL}/study-materials/${material.id}/preview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load PDF preview.');

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPreviewBlobUrl(objectUrl);
    } catch (err) {
      toast.error(err.message);
      setPreviewMaterial(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setPreviewMaterial(null);
  };

  // Download PDF
  const handleDownload = async (material) => {
    try {
      toast.info(`Downloading "${material.original_filename}"...`);
      const res = await fetch(`${API_URL}/study-materials/${material.id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = material.original_filename.endsWith('.pdf')
        ? material.original_filename
        : `${material.original_filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download finished');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="container py-4 min-vh-100">
        <div className="mb-4">
          <SkeletonLoader height="72px" />
        </div>
        <div className="row g-3 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-6 col-lg-3">
              <SkeletonLoader height="86px" />
            </div>
          ))}
        </div>
        <SkeletonLoader height="340px" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 min-vh-100">
        <div className="card cc-glass-card border-danger text-center p-4">
          <AlertCircle size={32} className="text-danger mx-auto mb-2" />
          <h5 className="text-light">Unable to load dashboard</h5>
          <p className="text-muted small mb-3">{error}</p>
          <button onClick={fetchDashboard} className="btn btn-sm btn-outline-danger mx-auto">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const counts = dashboardData?.counts || {};
  const myRecentUploads = dashboardData?.my_recent_uploads || [];
  const recentMaterials = dashboardData?.recent_materials || [];
  const pendingApprovals = dashboardData?.pending_approvals || [];

  return (
    <div className="container py-4 animated-fade-in min-vh-100">
      {/* 1. Workspace Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--cc-border-subtle)' }}>
        <div className="d-flex align-items-center gap-3">
          <div className="p-2.5 rounded border d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--cc-bg-surface)', borderColor: 'var(--cc-border-subtle)' }}>
            <User size={22} className="text-gold" />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h1 className="h4 font-heading fw-bold text-light mb-0">
                {user?.full_name || user?.username}
              </h1>
              <span className="badge bg-gold text-dark text-capitalize font-heading" style={{ fontSize: '0.7rem' }}>
                {user?.role}
              </span>
            </div>
            <div className="text-muted fs-8 mt-0.5">
              <span>{user?.department || user?.major || 'Academics'}</span>
              {user?.graduation_year && <span> • Class of {user.graduation_year}</span>}
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link to="/study-materials" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 shadow-sm">
            <BookOpen size={15} />
            <span>Library</span>
          </Link>
          <button
            onClick={fetchDashboard}
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center p-1.5"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 2. Linear-Style Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card cc-glass-card h-100 p-3 border-start border-3 border-primary">
            <span className="text-muted fs-8 fw-semibold text-uppercase tracking-wider">Library Materials</span>
            <div className="h3 font-heading text-light fw-bold my-1">{counts.approved_materials || 0}</div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card cc-glass-card h-100 p-3 border-start border-3 border-warning">
            <span className="text-muted fs-8 fw-semibold text-uppercase tracking-wider">My Uploads</span>
            <div className="h3 font-heading text-light fw-bold my-1">{counts.my_uploads || 0}</div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card cc-glass-card h-100 p-3 border-start border-3 border-success">
            <span className="text-muted fs-8 fw-semibold text-uppercase tracking-wider">Approved</span>
            <div className="h3 font-heading text-light fw-bold my-1">{counts.my_approved || 0}</div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card cc-glass-card h-100 p-3 border-start border-3 border-gold">
            <span className="text-muted fs-8 fw-semibold text-uppercase tracking-wider">
              {isStaff ? 'Pending Review' : 'Under Review'}
            </span>
            <div className="h3 font-heading text-light fw-bold my-1">
              {isStaff ? counts.pending_review || 0 : counts.my_pending || 0}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Staff Review Queue (if Staff) */}
      {isStaff && (
        <div className="card cc-glass-card mb-4 border-warning border-opacity-40">
          <div className="card-header bg-transparent border-bottom py-2.5 px-3 d-flex align-items-center justify-content-between" style={{ borderColor: 'var(--cc-border-subtle)' }}>
            <div className="d-flex align-items-center gap-2">
              <ShieldCheck className="text-warning" size={17} />
              <span className="font-heading fw-bold text-light fs-7">Pending Submissions</span>
              <span className="badge bg-warning text-dark fs-8">{pendingApprovals.length}</span>
            </div>
            <Link to="/study-materials?tab=pending" className="btn btn-sm btn-link text-warning p-0 fs-8 d-flex align-items-center gap-0.5">
              <span>View All</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="card-body p-3">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-3 text-muted fs-8">
                <CheckCircle2 size={24} className="text-success mb-1" />
                <div>No pending approvals</div>
              </div>
            ) : (
              <div className="row g-2">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="col-12 col-md-6 col-xl-4">
                    <div className="p-2.5 rounded border h-100 d-flex flex-column" style={{ backgroundColor: 'var(--cc-bg-surface)', borderColor: 'var(--cc-border-subtle)' }}>
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1.5">
                        <span className="badge bg-warning bg-opacity-20 text-warning fs-8">
                          {item.material_type}
                        </span>
                        <span className="text-muted fs-8">{formatBytes(item.file_size)}</span>
                      </div>

                      <h6 className="text-light fw-bold mb-1 font-heading fs-7 text-truncate" title={item.title}>
                        {item.title}
                      </h6>
                      <div className="text-gold fs-8 mb-1">{item.subject} • {item.department}</div>
                      <div className="text-muted fs-8 mb-2">By: {item.uploader_name}</div>

                      <div className="mt-auto d-flex gap-1.5 pt-2 border-top" style={{ borderColor: 'var(--cc-border-subtle)' }}>
                        <button
                          onClick={() => handleOpenPreview(item)}
                          className="btn btn-sm btn-outline-secondary flex-grow-1 py-1 fs-8"
                        >
                          <Eye size={12} className="me-1" /> Preview
                        </button>
                        <button
                          onClick={() => handleApprove(item.id, item.title)}
                          disabled={actionLoadingId === item.id}
                          className="btn btn-sm btn-success flex-grow-1 py-1 fs-8"
                        >
                          <Check size={12} className="me-1" /> Approve
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(item.id)}
                          className="btn btn-sm btn-outline-danger px-2 py-1 fs-8"
                          title="Reject"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Two-Column Workspace: My Uploads & Recent Additions */}
      <div className="row g-3">
        {/* Left: My Uploads */}
        <div className="col-lg-7">
          <div className="card cc-glass-card h-100 border-0">
            <div className="card-header bg-transparent border-bottom py-2.5 px-3 d-flex align-items-center justify-content-between" style={{ borderColor: 'var(--cc-border-subtle)' }}>
              <div className="d-flex align-items-center gap-2">
                <UploadCloud className="text-gold" size={17} />
                <span className="font-heading fw-bold text-light fs-7">My Uploads</span>
              </div>
              <Link to="/study-materials?tab=my_uploads" className="btn btn-sm btn-link text-primary p-0 fs-8">
                View All ({counts.my_uploads || 0})
              </Link>
            </div>

            <div className="card-body p-3">
              {myRecentUploads.length === 0 ? (
                <div className="text-center py-4 text-muted fs-8">
                  <UploadCloud size={28} className="opacity-40 mb-1" />
                  <p className="mb-2">No documents uploaded yet</p>
                  <Link to="/study-materials" className="btn btn-sm btn-primary py-1 px-2.5 fs-8">
                    Upload PDF
                  </Link>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {myRecentUploads.map((item) => (
                    <div key={item.id} className="p-2.5 rounded border" style={{ backgroundColor: 'var(--cc-bg-surface)', borderColor: 'var(--cc-border-subtle)' }}>
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <div className="overflow-hidden">
                          <h6 className="text-light fw-bold mb-0.5 font-heading fs-7 text-truncate" title={item.title}>
                            {item.title}
                          </h6>
                          <div className="text-muted fs-8">
                            {item.subject} • {item.semester} • {formatBytes(item.file_size)}
                          </div>
                        </div>

                        {item.approval_status === 'approved' && (
                          <span className="badge bg-success bg-opacity-20 text-success fs-8 flex-shrink-0">
                            Approved
                          </span>
                        )}
                        {item.approval_status === 'pending' && (
                          <span className="badge bg-warning bg-opacity-20 text-warning fs-8 flex-shrink-0">
                            Pending
                          </span>
                        )}
                        {item.approval_status === 'rejected' && (
                          <span className="badge bg-danger bg-opacity-20 text-danger fs-8 flex-shrink-0">
                            Rejected
                          </span>
                        )}
                      </div>

                      {item.approval_status === 'rejected' && item.rejection_reason && (
                        <div className="mt-2 p-1.5 rounded bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger fs-8">
                          {item.rejection_reason}
                        </div>
                      )}

                      <div className="d-flex justify-content-end gap-2 mt-2 pt-1.5 border-top" style={{ borderColor: 'var(--cc-border-subtle)' }}>
                        <button
                          onClick={() => handleOpenPreview(item)}
                          className="btn btn-sm btn-link text-light p-0 fs-8 text-decoration-none"
                        >
                          <Eye size={12} className="me-1" /> Preview
                        </button>
                        {item.approval_status === 'approved' && (
                          <button
                            onClick={() => handleDownload(item)}
                            className="btn btn-sm btn-link text-gold p-0 fs-8 text-decoration-none ms-2"
                          >
                            <Download size={12} className="me-1" /> Download
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Recent Library Additions */}
        <div className="col-lg-5">
          <div className="card cc-glass-card h-100 border-0">
            <div className="card-header bg-transparent border-bottom py-2.5 px-3 d-flex align-items-center justify-content-between" style={{ borderColor: 'var(--cc-border-subtle)' }}>
              <div className="d-flex align-items-center gap-2">
                <BookOpen className="text-primary" size={17} />
                <span className="font-heading fw-bold text-light fs-7">Recent Additions</span>
              </div>
              <Link to="/study-materials" className="btn btn-sm btn-link text-primary p-0 fs-8">
                Browse All
              </Link>
            </div>

            <div className="card-body p-3">
              {recentMaterials.length === 0 ? (
                <div className="text-center py-4 text-muted fs-8">
                  <BookOpen size={28} className="opacity-40 mb-1" />
                  <p className="mb-0">No materials available yet</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {recentMaterials.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 rounded border d-flex align-items-center justify-content-between gap-2"
                      style={{ backgroundColor: 'var(--cc-bg-surface)', borderColor: 'var(--cc-border-subtle)' }}
                    >
                      <div className="overflow-hidden">
                        <h6 className="text-light fw-bold mb-0.5 text-truncate font-heading fs-7" title={file.title}>
                          {file.title}
                        </h6>
                        <span className="text-muted fs-8 d-block text-truncate">
                          {file.subject} • {file.department}
                        </span>
                      </div>

                      <div className="d-flex align-items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleOpenPreview(file)}
                          className="btn btn-sm btn-outline-secondary p-1.5"
                          title="Preview"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="btn btn-sm btn-primary p-1.5"
                          title="Download"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. In-Browser PDF Preview Modal */}
      {previewMaterial && (
        <div className="modal show d-block cc-modal-backdrop" tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered h-90">
            <div className="modal-content h-100 d-flex flex-column border" style={{ backgroundColor: 'var(--cc-bg-surface)', borderColor: 'var(--cc-border-strong)' }}>
              <div className="modal-header py-2 px-3 border-bottom" style={{ borderColor: 'var(--cc-border-subtle)' }}>
                <div className="d-flex align-items-center gap-2 overflow-hidden me-3">
                  <FileText size={18} className="text-gold flex-shrink-0" />
                  <div className="overflow-hidden">
                    <h6 className="modal-title font-heading fw-bold text-truncate mb-0 fs-7">
                      {previewMaterial.title}
                    </h6>
                    <span className="text-muted fs-8">
                      {previewMaterial.subject} • {previewMaterial.material_type}
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    onClick={() => handleDownload(previewMaterial)}
                    className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 py-1 px-2.5 fs-8"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={handleClosePreview}
                  />
                </div>
              </div>

              <div className="modal-body p-0 flex-grow-1 position-relative" style={{ backgroundColor: 'var(--cc-bg-deep)' }}>
                {previewLoading ? (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100">
                    <RefreshCw size={28} className="animate-spin text-gold mb-2" />
                    <span className="text-muted fs-8">Loading document...</span>
                  </div>
                ) : previewBlobUrl ? (
                  <iframe
                    src={previewBlobUrl}
                    title={previewMaterial.title}
                    className="w-100 h-100 border-0"
                  />
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4 text-center">
                    <AlertCircle size={32} className="text-warning mb-2" />
                    <h6 className="text-light">Preview not available</h6>
                    <button
                      onClick={() => handleDownload(previewMaterial)}
                      className="btn btn-primary btn-sm d-flex align-items-center gap-1 mt-2"
                    >
                      <Download size={13} /> Download PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Staff Rejection Modal */}
      {showRejectModal && (
        <div className="modal show d-block cc-modal-backdrop" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border" style={{ backgroundColor: 'var(--cc-bg-surface)', borderColor: 'var(--cc-border-strong)' }}>
              <div className="modal-header py-2.5 px-3 border-bottom" style={{ borderColor: 'var(--cc-border-subtle)' }}>
                <h6 className="modal-title font-heading fw-bold mb-0 fs-6 text-danger d-flex align-items-center gap-2">
                  <XCircle size={17} /> Reject Document
                </h6>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowRejectModal(false)}
                />
              </div>

              <form onSubmit={handleConfirmReject}>
                <div className="modal-body p-3">
                  <label className="form-label fs-7 fw-semibold">
                    Reason
                  </label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Specify rejection reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-footer py-2 px-3 border-top" style={{ borderColor: 'var(--cc-border-subtle)' }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setShowRejectModal(false)}
                    disabled={rejecting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger btn-sm d-inline-flex align-items-center gap-1.5"
                    disabled={rejecting}
                  >
                    {rejecting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Rejecting...</span>
                      </>
                    ) : (
                      <>
                        <X size={13} />
                        <span>Reject</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
