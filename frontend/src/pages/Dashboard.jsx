import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config/api';
import { SkeletonLoader } from '../components/Common/Loader';
import {
  BookOpen, UploadCloud, ShieldCheck, CheckCircle2, Clock, XCircle,
  FileText, Download, Eye, ArrowRight, Plus, RefreshCw, GraduationCap,
  Building2, AlertCircle, Check, X, ChevronRight, User
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

      toast.success(`Approved "${title}"! Published to College Library.`);
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

      toast.info('Study material rejected with feedback.');
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
      toast.success('Download finished!');
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
      <div className="container py-5 min-vh-100">
        <div className="mb-4">
          <SkeletonLoader height="120px" />
        </div>
        <div className="row g-4 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-sm-6 col-lg-3">
              <SkeletonLoader height="100px" />
            </div>
          ))}
        </div>
        <SkeletonLoader height="300px" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 min-vh-100">
        <div className="card cc-glass-card border-danger text-center p-5">
          <AlertCircle size={40} className="text-danger mx-auto mb-3" />
          <h4 className="text-light">Unable to load dashboard</h4>
          <p className="text-muted">{error}</p>
          <button onClick={fetchDashboard} className="btn btn-sm btn-outline-danger mx-auto mt-2">
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
    <div className="container py-5 animated-fade-in min-vh-100">
      {/* 1. Welcome Header */}
      <div className="card cc-glass-card mb-4 border-gold-subtle overflow-hidden">
        <div className="card-body p-4 p-md-5">
          <div className="row align-items-center justify-content-between g-4">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-gold text-dark fw-bold px-3 py-1.5 text-uppercase">
                  {isStaff ? 'Staff Portal' : 'Student Portal'}
                </span>
                <span className="badge bg-navy-main text-light border border-secondary border-opacity-25 px-3 py-1.5">
                  {user?.department || user?.major || 'General Academics'}
                </span>
                {user?.graduation_year && (
                  <span className="badge bg-navy-main text-light border border-secondary border-opacity-25 px-3 py-1.5">
                    Class of {user.graduation_year}
                  </span>
                )}
              </div>

              <h2 className="display-6 font-heading fw-bold text-light mb-1">
                Welcome, <span className="text-gold">{user?.full_name || user?.username}</span>
              </h2>
              <p className="text-muted fs-6 mb-0">
                {isStaff
                  ? 'Review pending student submissions, preview uploaded PDFs, and publish verified study materials.'
                  : 'Access verified lecture notes, textbooks, and lab manuals shared by college seniors and peers.'}
              </p>
            </div>

            <div className="col-lg-4 text-lg-end">
              <div className="d-flex flex-wrap justify-content-lg-end gap-2">
                <Link to="/study-materials" className="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm">
                  <BookOpen size={16} />
                  <span>Open Library</span>
                </Link>
                <button
                  onClick={fetchDashboard}
                  className="btn btn-outline-secondary text-light d-inline-flex align-items-center gap-1"
                  title="Refresh"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stat Cards Grid */}
      <div className="row g-3 mb-4">
        {/* Card 1: Total Approved Library Materials */}
        <div className="col-6 col-lg-3">
          <div className="card cc-glass-card h-100 p-3 p-md-4 border-start border-4 border-primary">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted fs-8 fw-semibold text-uppercase">Library Materials</span>
              <BookOpen className="text-primary" size={20} />
            </div>
            <h3 className="font-heading text-light fw-bold mb-1">{counts.approved_materials || 0}</h3>
            <span className="text-muted fs-8">Staff-verified resources</span>
          </div>
        </div>

        {/* Card 2: My Uploads */}
        <div className="col-6 col-lg-3">
          <div className="card cc-glass-card h-100 p-3 p-md-4 border-start border-4 border-warning">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted fs-8 fw-semibold text-uppercase">My Uploads</span>
              <UploadCloud className="text-warning" size={20} />
            </div>
            <h3 className="font-heading text-light fw-bold mb-1">{counts.my_uploads || 0}</h3>
            <span className="text-muted fs-8">
              {counts.my_approved || 0} Approved • {counts.my_pending || 0} Pending
            </span>
          </div>
        </div>

        {/* Card 3: Approved Submissions */}
        <div className="col-6 col-lg-3">
          <div className="card cc-glass-card h-100 p-3 p-md-4 border-start border-4 border-success">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted fs-8 fw-semibold text-uppercase">Approved Submissions</span>
              <CheckCircle2 className="text-success" size={20} />
            </div>
            <h3 className="font-heading text-light fw-bold mb-1">{counts.my_approved || 0}</h3>
            <span className="text-success fs-8 fw-medium">Active in Library</span>
          </div>
        </div>

        {/* Card 4: Staff Pending Action or Student Pending */}
        <div className="col-6 col-lg-3">
          <div className="card cc-glass-card h-100 p-3 p-md-4 border-start border-4 border-gold">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted fs-8 fw-semibold text-uppercase">
                {isStaff ? 'Pending Review' : 'Under Review'}
              </span>
              <Clock className="text-gold" size={20} />
            </div>
            <h3 className="font-heading text-light fw-bold mb-1">
              {isStaff ? counts.pending_review || 0 : counts.my_pending || 0}
            </h3>
            <span className="text-gold fs-8 fw-medium">
              {isStaff ? 'Requires staff action' : 'Awaiting staff approval'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Staff Review Section (if Staff) */}
      {isStaff && (
        <div className="card cc-glass-card mb-4 border-warning border-opacity-50">
          <div className="card-header bg-navy-main border-secondary border-opacity-25 py-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <ShieldCheck className="text-warning" size={20} />
              <h5 className="font-heading fw-bold text-light mb-0">Pending Submissions Requiring Approval</h5>
              <span className="badge bg-warning text-dark ms-2">{pendingApprovals.length} Pending</span>
            </div>
            <Link to="/study-materials?tab=pending" className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1">
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="card-body p-3 p-md-4">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <CheckCircle2 size={36} className="text-success mb-2" />
                <p className="mb-0">All student uploads have been reviewed! There are no pending approvals.</p>
              </div>
            ) : (
              <div className="row g-3">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="col-12 col-md-6 col-xl-4">
                    <div className="p-3 rounded bg-navy-deep border border-secondary border-opacity-25 h-100 d-flex flex-column">
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                        <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-50 fs-8">
                          {item.material_type}
                        </span>
                        <span className="text-muted fs-8">{formatBytes(item.file_size)}</span>
                      </div>

                      <h6 className="text-light fw-bold mb-1 font-heading line-clamp-2" title={item.title}>
                        {item.title}
                      </h6>
                      <p className="text-gold fs-8 mb-2 fw-medium">{item.subject} • {item.department}</p>
                      <p className="text-muted fs-8 mb-3">By: <strong className="text-light">{item.uploader_name}</strong></p>

                      <div className="mt-auto d-flex gap-2 pt-2 border-top border-secondary border-opacity-25">
                        <button
                          onClick={() => handleOpenPreview(item)}
                          className="btn btn-sm btn-outline-secondary text-light flex-grow-1 d-flex align-items-center justify-content-center gap-1 fs-8"
                        >
                          <Eye size={12} /> Preview
                        </button>
                        <button
                          onClick={() => handleApprove(item.id, item.title)}
                          disabled={actionLoadingId === item.id}
                          className="btn btn-sm btn-success flex-grow-1 d-flex align-items-center justify-content-center gap-1 fs-8"
                        >
                          <Check size={12} /> {actionLoadingId === item.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(item.id)}
                          className="btn btn-sm btn-outline-danger px-2 fs-8"
                          title="Reject with reason"
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

      {/* 4. Student View: My Uploads & Recent Library Materials */}
      <div className="row g-4">
        {/* Left: My Recent Uploads with Approval Status */}
        <div className="col-lg-7">
          <div className="card cc-glass-card h-100 border-0">
            <div className="card-header bg-navy-main border-secondary border-opacity-25 py-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <UploadCloud className="text-gold" size={18} />
                <h5 className="font-heading fw-bold text-light mb-0">My Uploaded Study Materials</h5>
              </div>
              <Link to="/study-materials?tab=my_uploads" className="btn btn-sm btn-outline-primary fs-8">
                View All ({counts.my_uploads || 0})
              </Link>
            </div>

            <div className="card-body p-3 p-md-4">
              {myRecentUploads.length === 0 ? (
                <div className="text-center py-5">
                  <UploadCloud size={40} className="text-muted opacity-50 mb-2" />
                  <h6 className="text-light">You haven't uploaded any study materials yet</h6>
                  <p className="text-muted fs-8 max-w-500 mx-auto mb-3">
                    Help your college peers and juniors by sharing your lecture notes, lab manuals, and question papers.
                  </p>
                  <Link to="/study-materials" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1">
                    <Plus size={14} /> Upload Your First Document
                  </Link>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {myRecentUploads.map((item) => (
                    <div key={item.id} className="p-3 rounded bg-navy-deep border border-secondary border-opacity-25">
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                        <div>
                          <h6 className="text-light fw-bold mb-1 font-heading" title={item.title}>
                            {item.title}
                          </h6>
                          <div className="text-gold fs-8 fw-medium mb-1">
                            {item.subject} • {item.semester} • {item.material_type}
                          </div>
                        </div>

                        {/* Status Badge */}
                        {item.approval_status === 'approved' && (
                          <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 d-inline-flex align-items-center gap-1">
                            <CheckCircle2 size={12} /> Approved
                          </span>
                        )}
                        {item.approval_status === 'pending' && (
                          <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-50 d-inline-flex align-items-center gap-1">
                            <Clock size={12} /> Pending Review
                          </span>
                        )}
                        {item.approval_status === 'rejected' && (
                          <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50 d-inline-flex align-items-center gap-1">
                            <XCircle size={12} /> Rejected
                          </span>
                        )}
                      </div>

                      {/* Rejection Reason Box */}
                      {item.approval_status === 'rejected' && item.rejection_reason && (
                        <div className="p-2 mb-2 rounded bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger fs-8">
                          <strong>Staff Feedback: </strong>{item.rejection_reason}
                        </div>
                      )}

                      <div className="d-flex align-items-center justify-content-between text-muted fs-8 pt-2 border-top border-secondary border-opacity-10">
                        <span>{formatBytes(item.file_size)} • {item.original_filename}</span>
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => handleOpenPreview(item)}
                            className="btn btn-sm btn-link text-light p-0 fs-8 text-decoration-none d-flex align-items-center gap-1"
                          >
                            <Eye size={12} /> Preview
                          </button>
                          {item.approval_status === 'approved' && (
                            <button
                              onClick={() => handleDownload(item)}
                              className="btn btn-sm btn-link text-gold p-0 fs-8 text-decoration-none d-flex align-items-center gap-1"
                            >
                              <Download size={12} /> Download
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Recently Approved Study Materials */}
        <div className="col-lg-5">
          <div className="card cc-glass-card h-100 border-0">
            <div className="card-header bg-navy-main border-secondary border-opacity-25 py-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <BookOpen className="text-primary" size={18} />
                <h5 className="font-heading fw-bold text-light mb-0">Recently Approved Library Materials</h5>
              </div>
              <Link to="/study-materials" className="btn btn-sm btn-outline-primary fs-8">
                Browse All
              </Link>
            </div>

            <div className="card-body p-3 p-md-4">
              {recentMaterials.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <BookOpen size={30} className="opacity-50 mb-2" />
                  <p className="mb-0 fs-7">No approved materials available yet.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {recentMaterials.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded bg-navy-deep border border-secondary border-opacity-25 d-flex align-items-center justify-content-between gap-3"
                    >
                      <div className="overflow-hidden">
                        <span className="badge bg-navy-main text-gold border border-gold border-opacity-25 fs-8 mb-1">
                          {file.material_type}
                        </span>
                        <h6 className="text-light fw-bold mb-0 text-truncate font-heading" title={file.title}>
                          {file.title}
                        </h6>
                        <span className="text-muted fs-8 d-block text-truncate">
                          {file.subject} • {file.department}
                        </span>
                      </div>

                      <div className="d-flex align-items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleOpenPreview(file)}
                          className="btn btn-sm btn-outline-secondary text-light p-2"
                          title="Preview PDF"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="btn btn-sm btn-primary p-2"
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 text-center">
                <Link to="/study-materials" className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2">
                  <span>Explore College Digital Library</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. In-Browser PDF Preview Modal */}
      {previewMaterial && (
        <div className="modal show d-block cc-modal-backdrop" tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered h-90">
            <div className="modal-content bg-navy-main border border-secondary border-opacity-50 text-light h-100 d-flex flex-column">
              <div className="modal-header border-secondary border-opacity-25 py-2 px-3">
                <div className="d-flex align-items-center gap-2 overflow-hidden me-3">
                  <FileText size={20} className="text-gold flex-shrink-0" />
                  <div className="overflow-hidden">
                    <h6 className="modal-title font-heading fw-bold text-truncate mb-0">
                      {previewMaterial.title}
                    </h6>
                    <span className="text-muted fs-8">
                      {previewMaterial.subject} • {previewMaterial.material_type} • {previewMaterial.department}
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    onClick={() => handleDownload(previewMaterial)}
                    className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                  >
                    <Download size={14} />
                    <span className="d-none d-sm-inline">Download PDF</span>
                  </button>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={handleClosePreview}
                  />
                </div>
              </div>

              <div className="modal-body p-0 flex-grow-1 position-relative bg-navy-deep">
                {previewLoading ? (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100">
                    <RefreshCw size={36} className="animate-spin text-gold mb-3" />
                    <p className="text-muted">Loading secure PDF document...</p>
                  </div>
                ) : previewBlobUrl ? (
                  <iframe
                    src={previewBlobUrl}
                    title={previewMaterial.title}
                    className="w-100 h-100 border-0"
                    style={{ minHeight: '600px' }}
                  />
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4 text-center">
                    <AlertCircle size={40} className="text-warning mb-2" />
                    <h5 className="text-light">Preview not available in this browser</h5>
                    <p className="text-muted fs-7">
                      You can download the PDF file directly to view it on your device.
                    </p>
                    <button
                      onClick={() => handleDownload(previewMaterial)}
                      className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    >
                      <Download size={14} /> Download Document
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
            <div className="modal-content bg-navy-main border border-danger border-opacity-50 text-light shadow-2xl">
              <div className="modal-header border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-2 text-danger">
                  <XCircle size={20} />
                  <h5 className="modal-title font-heading fw-bold mb-0">Reject Study Material</h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowRejectModal(false)}
                />
              </div>

              <form onSubmit={handleConfirmReject}>
                <div className="modal-body p-4">
                  <p className="text-muted fs-7 mb-3">
                    Please provide a clear reason for rejecting this document so the student understands how to improve or resubmit their material.
                  </p>

                  <div className="mb-3">
                    <label className="form-label text-light fs-7 fw-semibold">
                      Rejection Reason / Guidance
                    </label>
                    <textarea
                      rows="4"
                      className="form-control bg-navy-deep border-secondary border-opacity-25 text-light"
                      placeholder="e.g., Unclear scans, duplicate content, missing Unit 4 syllabus, or inappropriate file format..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-secondary border-opacity-25">
                  <button
                    type="button"
                    className="btn btn-outline-secondary text-light"
                    onClick={() => setShowRejectModal(false)}
                    disabled={rejecting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger d-inline-flex align-items-center gap-2"
                    disabled={rejecting}
                  >
                    {rejecting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Rejecting...</span>
                      </>
                    ) : (
                      <>
                        <X size={14} />
                        <span>Confirm Rejection</span>
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
