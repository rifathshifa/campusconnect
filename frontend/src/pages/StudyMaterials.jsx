import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkeletonLoader } from '../components/Common/Loader';
import { API_URL } from '../config/api';
import {
  BookOpen, FileText, Download, Eye, UploadCloud, Search,
  CheckCircle2, Clock, XCircle, AlertCircle, ShieldCheck,
  X, RefreshCw, BookMarked, Trash2, Check
} from 'lucide-react';

const StudyMaterials = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  // Active Main Tab: 'browse' | 'my_uploads' | 'pending'
  const initialTab = searchParams.get('tab') || 'browse';
  const initialType = searchParams.get('material_type') || 'All';

  const [activeTab, setActiveTabState] = useState(initialTab);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    const tabUrl = searchParams.get('tab');
    if (tabUrl && ['browse', 'my_uploads', 'pending'].includes(tabUrl)) {
      setActiveTabState(tabUrl);
    }
  }, [searchParams]);

  // Materials & Counts
  const [materials, setMaterials] = useState([]);
  const [counts, setCounts] = useState({ approved: 0, my_uploads: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Metadata for dropdowns
  const [meta, setMeta] = useState({
    departments: [
      { code: 'CSE', name: 'Computer Science & Engineering' },
      { code: 'IT', name: 'Information Technology' },
      { code: 'ECE', name: 'Electronics & Communication Engineering' },
      { code: 'EEE', name: 'Electrical & Electronics Engineering' },
      { code: 'MECH', name: 'Mechanical Engineering' },
      { code: 'CIVIL', name: 'Civil Engineering' },
      { code: 'AIDS', name: 'Artificial Intelligence & Data Science' }
    ],
    material_types: [
      'Textbook PDF',
      'Lab Manual',
      'Lab Program',
      'Lecture Notes',
      'Previous Year Question Paper',
      'Study Material'
    ],
    semesters: [
      'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
      'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'
    ],
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    subjects: []
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadDept, setUploadDept] = useState('Computer Science & Engineering');
  const [uploadYear, setUploadYear] = useState('2nd Year');
  const [uploadSemester, setUploadSemester] = useState('Semester 4');
  const [uploadType, setUploadType] = useState('Lecture Notes');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // PDF Preview Modal State
  const [previewMaterial, setPreviewMaterial] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Staff Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectMaterialId, setRejectMaterialId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Action Loading
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // 1. Fetch Metadata once
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await fetch(`${API_URL}/study-materials/meta`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMeta((prev) => ({
            ...prev,
            departments: data.departments?.length ? data.departments : prev.departments,
            material_types: data.material_types?.length ? data.material_types : prev.material_types,
            semesters: data.semesters?.length ? data.semesters : prev.semesters,
            years: data.years?.length ? data.years : prev.years,
            subjects: data.subjects || []
          }));
        }
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    };
    if (token) fetchMeta();
  }, [token]);

  // 2. Fetch Study Materials
  const fetchMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('tab', activeTab);
      if (selectedDept !== 'All') params.append('department', selectedDept);
      if (selectedYear !== 'All') params.append('year', selectedYear);
      if (selectedSemester !== 'All') params.append('semester', selectedSemester);
      if (selectedType !== 'All') params.append('material_type', selectedType);
      if (activeTab === 'my_uploads' && selectedStatus !== 'All') {
        params.append('status', selectedStatus);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const res = await fetch(`${API_URL}/study-materials?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch study materials.');
      }

      const data = await res.json();
      setMaterials(data.materials || []);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMaterials();
    }
  }, [token, activeTab, selectedDept, selectedYear, selectedSemester, selectedType, selectedStatus]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDept('All');
    setSelectedYear('All');
    setSelectedSemester('All');
    setSelectedType('All');
    setSelectedStatus('All');
  };

  const hasActiveFilters = selectedDept !== 'All' || selectedYear !== 'All' || selectedSemester !== 'All' || selectedType !== 'All' || searchTerm.trim() !== '' || (activeTab === 'my_uploads' && selectedStatus !== 'All');

  // Drag and Drop File Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files (.pdf) are permitted.');
      return;
    }
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      toast.error('File size exceeds the 50MB limit.');
      return;
    }
    setUploadFile(file);
    if (!uploadTitle) {
      const suggested = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setUploadTitle(suggested);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Submit Upload Form
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a PDF file.');
      return;
    }
    if (!uploadTitle.trim() || !uploadSubject.trim()) {
      toast.error('Title and Subject are required.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle.trim());
    formData.append('subject', uploadSubject.trim());
    formData.append('department', uploadDept);
    formData.append('year', uploadYear);
    formData.append('semester', uploadSemester);
    formData.append('material_type', uploadType);
    formData.append('description', uploadDesc.trim());

    try {
      const res = await fetch(`${API_URL}/study-materials/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Upload failed.');
      }

      toast.success('Document uploaded');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadSubject('');
      setUploadDesc('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      setActiveTab('my_uploads');
      fetchMaterials();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Staff Approve Action
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
      fetchMaterials();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Staff Reject Action
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
      if (!res.ok) throw new Error(data.message || 'Failed to reject document.');

      toast.info('Document rejected');
      setShowRejectModal(false);
      setRejectMaterialId(null);
      setRejectReason('');
      fetchMaterials();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRejecting(false);
    }
  };

  // Delete Material
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/study-materials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete.');

      toast.success('Document deleted');
      fetchMaterials();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // PDF Preview
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Preview unavailable.');
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPreviewBlobUrl(objectUrl);
    } catch (err) {
      toast.error('Preview error: ' + err.message);
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Download forbidden.');
      }

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
      toast.success('Download complete');
    } catch (err) {
      toast.error('Download failed: ' + err.message);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'Textbook PDF':
        return 'badge-type-textbook';
      case 'Lab Manual':
        return 'badge-type-labmanual';
      case 'Lab Program':
        return 'badge-type-labprog';
      case 'Lecture Notes':
        return 'badge-type-notes';
      case 'Previous Year Question Paper':
        return 'badge-type-pyq';
      default:
        return 'badge-type-general';
    }
  };

  return (
    <div className="container-fluid py-4 px-3 px-md-5 min-vh-100">
      {/* 1. Linear-Style Header Strip */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div className="d-flex align-items-center gap-3">
          <h1 className="h4 font-heading fw-bold text-light mb-0">Library</h1>

          {/* Segmented View Control */}
          <div className="cc-role-tab-group">
            <button
              type="button"
              className={`cc-role-tab ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              Browse <span className="ms-1 fs-8 opacity-75">{counts.approved}</span>
            </button>
            <button
              type="button"
              className={`cc-role-tab ${activeTab === 'my_uploads' ? 'active' : ''}`}
              onClick={() => setActiveTab('my_uploads')}
            >
              My Uploads <span className="ms-1 fs-8 opacity-75">{counts.my_uploads}</span>
            </button>
            {isStaff && (
              <button
                type="button"
                className={`cc-role-tab ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending <span className="ms-1 fs-8 opacity-75">{counts.pending}</span>
              </button>
            )}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5 shadow-sm px-3 py-1.5"
          >
            <UploadCloud size={15} />
            <span>Upload PDF</span>
          </button>
          <button
            onClick={fetchMaterials}
            className="btn btn-outline-secondary btn-sm p-1.5"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Inline Filter Strip */}
      <div className="card cc-glass-card mb-4 border-0">
        <div className="card-body p-2.5">
          <form onSubmit={(e) => { e.preventDefault(); fetchMaterials(); }}>
            <div className="row g-2 align-items-center">
              {/* Search input */}
              <div className="col-12 col-md-4 col-xl-3">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-transparent border-0 text-muted ps-2.5 pe-1">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-sm border-0 bg-transparent text-light"
                    placeholder="Search by title, subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-muted p-1"
                      onClick={() => setSearchTerm('')}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Department */}
              <div className="col-6 col-md-4 col-xl-2">
                <select
                  className="form-select form-select-sm"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  {meta.departments.map((d) => (
                    <option key={d.code} value={d.name}>
                      {d.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div className="col-6 col-md-4 col-xl-2">
                <select
                  className="form-select form-select-sm"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="All">All Years</option>
                  {meta.years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div className="col-6 col-md-4 col-xl-2">
                <select
                  className="form-select form-select-sm"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                >
                  <option value="All">All Semesters</option>
                  {meta.semesters.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Material Type */}
              <div className="col-6 col-md-4 col-xl-2">
                <select
                  className="form-select form-select-sm"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="All">All Types</option>
                  {meta.material_types.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Status filter (in My Uploads) */}
              {activeTab === 'my_uploads' && (
                <div className="col-6 col-md-4 col-xl-1">
                  <select
                    className="form-select form-select-sm"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="All">Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}

              {/* Reset button */}
              {hasActiveFilters && (
                <div className="col-auto ms-auto">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn btn-sm btn-link text-muted p-0 fs-8"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* 3. Materials Cards */}
      {loading ? (
        <div className="row g-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="col-12 col-md-6 col-lg-4">
              <SkeletonLoader height="160px" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card cc-glass-card border-danger text-center p-4">
          <AlertCircle size={32} className="text-danger mx-auto mb-2" />
          <h6 className="text-light">Failed to load materials</h6>
          <p className="text-muted small mb-3">{error}</p>
          <button onClick={fetchMaterials} className="btn btn-sm btn-outline-danger mx-auto">
            Retry
          </button>
        </div>
      ) : materials.length === 0 ? (
        <div className="card cc-glass-card text-center p-5 border-dashed" style={{ borderColor: 'var(--cc-border-subtle)' }}>
          <BookOpen size={36} className="text-muted mx-auto mb-2 opacity-40" />
          <h6 className="text-light font-heading">No materials found</h6>
          <div className="d-flex justify-content-center gap-2 mt-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5"
            >
              <UploadCloud size={14} />
              <span>Upload PDF</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="btn btn-outline-secondary btn-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {materials.map((item) => (
            <div key={item.id} className="col-12 col-md-6 col-xl-4">
              <div className="card cc-glass-card h-100 transition-all d-flex flex-column" style={{ borderColor: 'var(--cc-border-subtle)' }}>
                <div className="card-body p-3.5 d-flex flex-column">
                  {/* Top Badges */}
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <span className={`badge ${getTypeBadgeClass(item.material_type)} text-uppercase px-2 py-0.5 fs-8`}>
                      {item.material_type}
                    </span>

                    {/* Status Badge */}
                    {item.approval_status === 'approved' && (
                      <span className="badge bg-success bg-opacity-20 text-success fs-8">
                        Approved
                      </span>
                    )}
                    {item.approval_status === 'pending' && (
                      <span className="badge bg-warning bg-opacity-20 text-warning fs-8">
                        Pending
                      </span>
                    )}
                    {item.approval_status === 'rejected' && (
                      <span className="badge bg-danger bg-opacity-20 text-danger fs-8">
                        Rejected
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h6 className="card-title text-light font-heading fw-bold mb-1.5 line-clamp-2 fs-7" title={item.title}>
                    {item.title}
                  </h6>

                  {/* Academic Details */}
                  <div className="text-gold fs-8 fw-medium mb-1 d-flex align-items-center gap-1">
                    <BookMarked size={12} />
                    <span>{item.subject}</span>
                  </div>
                  <div className="text-muted fs-8 mb-2">
                    {item.department} • {item.semester} • {item.year}
                  </div>

                  {/* Description if present */}
                  {item.description && (
                    <p className="text-muted fs-8 mb-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Rejection alert */}
                  {item.approval_status === 'rejected' && item.rejection_reason && (
                    <div className="p-1.5 mb-2 rounded bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger fs-8">
                      {item.rejection_reason}
                    </div>
                  )}

                  {/* Footer & Actions */}
                  <div className="mt-auto pt-2.5 border-top d-flex flex-column gap-2" style={{ borderColor: 'var(--cc-border-subtle)' }}>
                    <div className="d-flex align-items-center justify-content-between text-muted fs-8">
                      <span>{item.uploader_name}</span>
                      <span>{formatBytes(item.file_size)}</span>
                    </div>

                    <div className="d-flex align-items-center gap-1.5">
                      <button
                        onClick={() => handleOpenPreview(item)}
                        className="btn btn-sm btn-outline-secondary flex-grow-1 py-1 fs-8"
                      >
                        <Eye size={12} className="me-1" /> Preview
                      </button>

                      {(item.approval_status === 'approved' || isStaff || item.uploader_id === user?.id) && (
                        <button
                          onClick={() => handleDownload(item)}
                          className="btn btn-sm btn-outline-primary flex-grow-1 py-1 fs-8"
                        >
                          <Download size={12} className="me-1" /> Download
                        </button>
                      )}

                      {/* Delete */}
                      {(isStaff || (item.uploader_id === user?.id && item.approval_status !== 'approved')) && (
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="btn btn-sm btn-outline-danger p-1"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* Staff Moderation Bar */}
                    {isStaff && item.approval_status === 'pending' && (
                      <div className="d-flex gap-1.5 pt-1.5 border-top" style={{ borderColor: 'var(--cc-border-subtle)' }}>
                        <button
                          onClick={() => handleApprove(item.id, item.title)}
                          disabled={actionLoadingId === item.id}
                          className="btn btn-sm btn-success flex-grow-1 py-1 fs-8"
                        >
                          <Check size={12} className="me-1" /> Approve
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(item.id)}
                          className="btn btn-sm btn-outline-danger flex-grow-1 py-1 fs-8"
                        >
                          <X size={12} className="me-1" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Upload Modal */}
      {showUploadModal && (
        <div className="modal show d-block cc-modal-backdrop" tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border" style={{ backgroundColor: 'var(--cc-bg-surface)', borderColor: 'var(--cc-border-strong)' }}>
              <div className="modal-header py-2.5 px-3 border-bottom" style={{ borderColor: 'var(--cc-border-subtle)' }}>
                <h6 className="modal-title font-heading fw-bold mb-0 fs-6 d-flex align-items-center gap-2">
                  <UploadCloud size={18} className="text-gold" /> Upload Study Material
                </h6>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowUploadModal(false)}
                />
              </div>

              <form onSubmit={handleUploadSubmit}>
                <div className="modal-body p-3.5">
                  <div className="row g-2.5">
                    {/* PDF Dropzone */}
                    <div className="col-12 mb-1">
                      <div
                        className={`p-3 rounded border-2 border-dashed text-center transition-all ${dragActive ? 'border-gold' : ''}`}
                        style={{ backgroundColor: 'var(--cc-bg-elevated)', borderColor: 'var(--cc-border-strong)', cursor: 'pointer' }}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          className="d-none"
                          onChange={handleFileChange}
                        />

                        {uploadFile ? (
                          <div className="d-flex align-items-center justify-content-between p-2 rounded border" style={{ backgroundColor: 'var(--cc-bg-surface)', borderColor: 'var(--cc-border-subtle)' }}>
                            <div className="d-flex align-items-center gap-2 text-start overflow-hidden">
                              <FileText size={22} className="text-gold flex-shrink-0" />
                              <div className="text-truncate">
                                <div className="text-light fw-medium fs-7 text-truncate">{uploadFile.name}</div>
                                <span className="text-muted fs-8">{formatBytes(uploadFile.size)}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-danger p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="py-2">
                            <UploadCloud size={28} className="text-gold mb-1 opacity-75" />
                            <div className="text-light fs-7 fw-medium">
                              Drop PDF here or click to browse
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="col-12">
                      <label className="form-label fs-7 fw-semibold">Title</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Document title"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        required
                      />
                    </div>

                    {/* Subject */}
                    <div className="col-md-6">
                      <label className="form-label fs-7 fw-semibold">Subject</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Subject name"
                        value={uploadSubject}
                        onChange={(e) => setUploadSubject(e.target.value)}
                        required
                      />
                    </div>

                    {/* Material Type */}
                    <div className="col-md-6">
                      <label className="form-label fs-7 fw-semibold">Type</label>
                      <select
                        className="form-select form-select-sm"
                        value={uploadType}
                        onChange={(e) => setUploadType(e.target.value)}
                        required
                      >
                        {meta.material_types.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Department */}
                    <div className="col-md-4">
                      <label className="form-label fs-7 fw-semibold">Department</label>
                      <select
                        className="form-select form-select-sm"
                        value={uploadDept}
                        onChange={(e) => setUploadDept(e.target.value)}
                        required
                      >
                        {meta.departments.map((d) => (
                          <option key={d.code} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Year */}
                    <div className="col-md-4">
                      <label className="form-label fs-7 fw-semibold">Year</label>
                      <select
                        className="form-select form-select-sm"
                        value={uploadYear}
                        onChange={(e) => setUploadYear(e.target.value)}
                        required
                      >
                        {meta.years.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    {/* Semester */}
                    <div className="col-md-4">
                      <label className="form-label fs-7 fw-semibold">Semester</label>
                      <select
                        className="form-select form-select-sm"
                        value={uploadSemester}
                        onChange={(e) => setUploadSemester(e.target.value)}
                        required
                      >
                        {meta.semesters.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label fs-7 fw-semibold">Description (Optional)</label>
                      <textarea
                        rows="2"
                        className="form-control form-control-sm"
                        placeholder="Topics covered, unit summary..."
                        value={uploadDesc}
                        onChange={(e) => setUploadDesc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer py-2 px-3 border-top" style={{ borderColor: 'var(--cc-border-subtle)' }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5"
                    disabled={uploading || !uploadFile}
                  >
                    {uploading ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={13} />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. PDF Preview Modal */}
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

export default StudyMaterials;
