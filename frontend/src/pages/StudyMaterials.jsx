import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkeletonLoader } from '../components/Common/Loader';
import {
  BookOpen, FileText, Download, Eye, UploadCloud, Search, Filter,
  CheckCircle2, Clock, XCircle, AlertCircle, ShieldCheck, ChevronRight,
  X, Plus, RefreshCw, GraduationCap, Building2, Calendar, FileCode,
  FileSpreadsheet, BookMarked, HelpCircle, Trash2, Check, ExternalLink,
  Info, Sparkles
} from 'lucide-react';

const StudyMaterials = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Active Main Tab: 'browse' | 'my_uploads' | 'pending'
  const initialTab = searchParams.get('tab') || 'browse';
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
  const [selectedType, setSelectedType] = useState('All');
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

  // Action Loading (e.g. approving)
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
      toast.error('Invalid file format. Only PDF files (.pdf) are permitted.');
      return;
    }
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      toast.error('File size exceeds the 50MB limit.');
      return;
    }
    setUploadFile(file);
    if (!uploadTitle) {
      // Suggest clean title from filename
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
      toast.error('Please select a valid PDF file.');
      return;
    }
    if (!uploadTitle.trim() || !uploadSubject.trim()) {
      toast.error('Title and Subject are required fields.');
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
        throw new Error(data.message || 'Failed to upload study material.');
      }

      toast.success('Document uploaded! It is currently Pending Approval and will be reviewed by college staff.');
      setShowUploadModal(false);
      // Reset form
      setUploadFile(null);
      setUploadTitle('');
      setUploadSubject('');
      setUploadDesc('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Switch to my_uploads tab to let student view their pending upload
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
      if (!res.ok) throw new Error(data.message || 'Failed to approve document.');

      toast.success(`Approved "${title}"! Published to College Library.`);
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

      toast.info('Study material rejected. Uploader can view feedback.');
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

  // Delete Material (uploader for pending/rejected, or staff)
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/study-materials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete.');

      toast.success('Study material deleted successfully.');
      fetchMaterials();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Open In-Browser PDF Preview
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
        throw new Error(err.message || 'Access denied or PDF preview unavailable.');
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

  // Secure Authenticated PDF Download
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
      toast.success('Download complete!');
    } catch (err) {
      toast.error('Download failed: ' + err.message);
    }
  };

  // Format File Size
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Badge Color for Material Type
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
      {/* 1. Header Banner */}
      <div className="card cc-glass-card mb-4 border-gold-subtle overflow-hidden">
        <div className="card-body p-4 p-md-5 position-relative">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-gold text-dark fw-bold px-3 py-2 text-uppercase tracking-wide d-inline-flex align-items-center gap-1">
                  <GraduationCap size={15} /> Official College Portal
                </span>
                <span className="badge bg-navy-light text-light px-3 py-2">
                  Role: <strong className="text-capitalize">{user?.role}</strong>
                </span>
              </div>
              <h1 className="display-6 fw-bold text-light mb-2 font-heading">
                College Digital <span className="text-gold">Study Materials</span> Library
              </h1>
              <p className="text-muted fs-6 mb-3 max-w-700">
                A verified repository for college seniors and students to share textbooks, lab manuals,
                lecture notes, and question papers. Every student upload is reviewed and verified by college staff before publication.
              </p>

              {/* Quick Summary Badges */}
              <div className="d-flex flex-wrap gap-2 pt-2">
                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded bg-navy-main border border-secondary border-opacity-25 text-light fs-7">
                  <CheckCircle2 size={16} className="text-success" />
                  <span><strong>{counts.approved}</strong> Approved Materials</span>
                </div>
                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded bg-navy-main border border-secondary border-opacity-25 text-light fs-7">
                  <UploadCloud size={16} className="text-gold" />
                  <span><strong>{counts.my_uploads}</strong> My Uploads</span>
                </div>
                {isStaff && (
                  <div className="d-flex align-items-center gap-2 px-3 py-2 rounded bg-navy-main border border-warning text-light fs-7">
                    <Clock size={16} className="text-warning" />
                    <span><strong>{counts.pending}</strong> Pending Staff Review</span>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn btn-primary d-inline-flex align-items-center gap-2 shadow-lg px-4 py-3"
              >
                <UploadCloud size={18} />
                <span>Upload Study Material</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 border-bottom border-secondary border-opacity-25 pb-2">
        <ul className="nav nav-pills gap-2">
          <li className="nav-item">
            <button
              className={`nav-link d-flex align-items-center gap-2 px-3 py-2 ${activeTab === 'browse' ? 'active bg-gold text-dark fw-bold' : 'text-light'}`}
              onClick={() => setActiveTab('browse')}
            >
              <BookOpen size={16} />
              <span>Browse Materials</span>
              <span className="badge bg-navy-main text-gold ms-1">{counts.approved}</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link d-flex align-items-center gap-2 px-3 py-2 ${activeTab === 'my_uploads' ? 'active bg-gold text-dark fw-bold' : 'text-light'}`}
              onClick={() => setActiveTab('my_uploads')}
            >
              <FileText size={16} />
              <span>My Uploads</span>
              <span className="badge bg-navy-main text-light ms-1">{counts.my_uploads}</span>
            </button>
          </li>
          {isStaff && (
            <li className="nav-item">
              <button
                className={`nav-link d-flex align-items-center gap-2 px-3 py-2 position-relative ${activeTab === 'pending' ? 'active bg-warning text-dark fw-bold' : 'text-warning'}`}
                onClick={() => setActiveTab('pending')}
              >
                <ShieldCheck size={16} />
                <span>Pending Approvals</span>
                {counts.pending > 0 && (
                  <span className="badge bg-danger text-light rounded-pill ms-1 animate-pulse">
                    {counts.pending}
                  </span>
                )}
              </button>
            </li>
          )}
        </ul>

        <button
          onClick={fetchMaterials}
          className="btn btn-sm btn-outline-secondary text-light d-flex align-items-center gap-1"
          title="Refresh materials list"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 3. Search and Academic Filter Bar (Visible on Browse & My Uploads) */}
      <div className="card cc-glass-card mb-4 border-0">
        <div className="card-body p-3">
          <form onSubmit={(e) => { e.preventDefault(); fetchMaterials(); }}>
            <div className="row g-2 align-items-center">
              {/* Search input */}
              <div className="col-12 col-md-4 col-xl-3">
                <div className="input-group">
                  <span className="input-group-text bg-navy-deep border-secondary border-opacity-25 text-gold">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control bg-navy-deep border-secondary border-opacity-25 text-light"
                    placeholder="Search by title, subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="btn btn-navy-deep border-secondary border-opacity-25 text-muted"
                      onClick={() => setSearchTerm('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Department filter */}
              <div className="col-6 col-md-4 col-xl-2">
                <select
                  className="form-select form-select-sm bg-navy-deep border-secondary border-opacity-25 text-light"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  {meta.departments.map((d) => (
                    <option key={d.code} value={d.name}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year filter */}
              <div className="col-6 col-md-4 col-xl-2">
                <select
                  className="form-select form-select-sm bg-navy-deep border-secondary border-opacity-25 text-light"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="All">All Years</option>
                  {meta.years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Semester filter */}
              <div className="col-6 col-md-4 col-xl-2">
                <select
                  className="form-select form-select-sm bg-navy-deep border-secondary border-opacity-25 text-light"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                >
                  <option value="All">All Semesters</option>
                  {meta.semesters.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Material Type filter */}
              <div className="col-6 col-md-4 col-xl-2">
                <select
                  className="form-select form-select-sm bg-navy-deep border-secondary border-opacity-25 text-light"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="All">All Material Types</option>
                  {meta.material_types.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Status filter (only in My Uploads) */}
              {activeTab === 'my_uploads' && (
                <div className="col-6 col-md-4 col-xl-1">
                  <select
                    className="form-select form-select-sm bg-navy-deep border-secondary border-opacity-25 text-light"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}

              {/* Reset button */}
              <div className="col-auto ms-auto">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-sm btn-outline-secondary text-light py-1 px-2"
                  title="Reset filters"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* 4. Active Tab Content Banner / Alerts */}
      {activeTab === 'pending' && isStaff && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4 bg-opacity-10 border-warning text-warning">
          <ShieldCheck size={20} className="flex-shrink-0" />
          <div className="fs-7">
            <strong>Staff Moderation Center:</strong> You are viewing documents uploaded by students awaiting approval.
            Please preview the PDF content to ensure academic accuracy and suitability before approving or rejecting.
          </div>
        </div>
      )}

      {activeTab === 'my_uploads' && (
        <div className="alert alert-info d-flex align-items-center gap-2 mb-4 bg-opacity-10 border-info text-info">
          <Info size={20} className="flex-shrink-0" />
          <div className="fs-7">
            <strong>Upload Status Policy:</strong> Every uploaded document begins with <em>Pending Approval</em> status.
            Once a college staff member reviews and approves your submission, it automatically becomes visible and downloadable to other students.
          </div>
        </div>
      )}

      {/* 5. Main Materials List / Grid */}
      {loading ? (
        <div className="row g-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="col-12 col-md-6 col-lg-4">
              <SkeletonLoader height="200px" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card cc-glass-card border-danger text-center p-5">
          <AlertCircle size={40} className="text-danger mx-auto mb-3" />
          <h5 className="text-light">Failed to load study materials</h5>
          <p className="text-muted">{error}</p>
          <button onClick={fetchMaterials} className="btn btn-sm btn-outline-danger mx-auto mt-2">
            Try Again
          </button>
        </div>
      ) : materials.length === 0 ? (
        <div className="card cc-glass-card text-center p-5 border-dashed border-secondary border-opacity-50">
          <BookOpen size={48} className="text-muted mx-auto mb-3 opacity-50" />
          <h4 className="text-light font-heading">No Study Materials Found</h4>
          <p className="text-muted max-w-500 mx-auto fs-6">
            {activeTab === 'browse'
              ? 'No approved study materials match your current search and filter criteria.'
              : activeTab === 'pending'
                ? 'All student uploads have been reviewed! There are currently no pending approvals.'
                : 'You have not uploaded any study materials yet. Share your notes and lab manuals with fellow students!'}
          </p>
          <div className="d-flex justify-content-center gap-2 mt-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary d-inline-flex align-items-center gap-2"
            >
              <UploadCloud size={16} />
              <span>Upload Document</span>
            </button>
            {(selectedDept !== 'All' || selectedYear !== 'All' || selectedSemester !== 'All' || selectedType !== 'All' || searchTerm) && (
              <button
                onClick={handleResetFilters}
                className="btn btn-outline-secondary text-light"
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
              <div className="card cc-glass-card h-100 border-secondary border-opacity-25 hover-border-gold transition-all d-flex flex-column">
                <div className="card-body p-4 d-flex flex-column">
                  {/* Top Badges */}
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <span className={`badge ${getTypeBadgeClass(item.material_type)} text-uppercase px-2 py-1`}>
                      {item.material_type}
                    </span>

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

                  {/* Title */}
                  <h5 className="card-title text-light font-heading fw-bold mb-2 line-clamp-2" title={item.title}>
                    {item.title}
                  </h5>

                  {/* Subject & Academic Tagging */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-1 text-gold fw-semibold fs-7 mb-1">
                      <BookMarked size={14} />
                      <span>{item.subject}</span>
                    </div>
                    <div className="d-flex flex-wrap gap-1 text-muted fs-8">
                      <span className="badge bg-navy-main text-light border border-secondary border-opacity-25">
                        {item.department}
                      </span>
                      <span className="badge bg-navy-main text-light border border-secondary border-opacity-25">
                        {item.semester}
                      </span>
                      <span className="badge bg-navy-main text-light border border-secondary border-opacity-25">
                        {item.year}
                      </span>
                    </div>
                  </div>

                  {/* Description if provided */}
                  {item.description && (
                    <p className="card-text text-muted fs-7 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Rejection Alert Box (if rejected) */}
                  {item.approval_status === 'rejected' && item.rejection_reason && (
                    <div className="p-2 mb-3 rounded bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger fs-8">
                      <strong className="d-flex align-items-center gap-1 mb-1">
                        <AlertCircle size={12} /> Rejection Reason:
                      </strong>
                      <span>{item.rejection_reason}</span>
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="mt-auto pt-3 border-top border-secondary border-opacity-25">
                    {/* Metadata footer */}
                    <div className="d-flex align-items-center justify-content-between text-muted fs-8 mb-3">
                      <div>
                        <span>By: </span>
                        <strong className="text-light">{item.uploader_name}</strong>
                      </div>
                      <div>
                        <span>Size: </span>
                        <strong className="text-light">{formatBytes(item.file_size)}</strong>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex flex-wrap gap-2">
                      {/* Preview PDF */}
                      <button
                        onClick={() => handleOpenPreview(item)}
                        className="btn btn-sm btn-outline-secondary text-light flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                      >
                        <Eye size={14} />
                        <span>Preview PDF</span>
                      </button>

                      {/* Download PDF (Visible if approved or uploader/staff) */}
                      {(item.approval_status === 'approved' || isStaff || item.uploader_id === user?.id) && (
                        <button
                          onClick={() => handleDownload(item)}
                          className="btn btn-sm btn-outline-primary flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                        >
                          <Download size={14} />
                          <span>Download</span>
                        </button>
                      )}

                      {/* Staff Moderation Buttons */}
                      {isStaff && item.approval_status === 'pending' && (
                        <div className="w-100 d-flex gap-2 pt-2 border-top border-warning border-opacity-25">
                          <button
                            onClick={() => handleApprove(item.id, item.title)}
                            disabled={actionLoadingId === item.id}
                            className="btn btn-sm btn-success flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                          >
                            <Check size={14} />
                            <span>{actionLoadingId === item.id ? 'Approving...' : 'Approve'}</span>
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(item.id)}
                            className="btn btn-sm btn-outline-danger flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {/* Delete option for uploader on pending/rejected items */}
                      {(isStaff || (item.uploader_id === user?.id && item.approval_status !== 'approved')) && (
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="btn btn-sm btn-outline-danger px-2"
                          title="Delete material"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. Upload Modal */}
      {showUploadModal && (
        <div className="modal show d-block cc-modal-backdrop" tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content bg-navy-main border border-secondary border-opacity-50 text-light shadow-2xl">
              <div className="modal-header border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-gold text-dark">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title font-heading fw-bold mb-0">Upload Study Material</h5>
                    <span className="text-muted fs-8">College Digital Library • Student & Staff Contribution</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowUploadModal(false)}
                />
              </div>

              <form onSubmit={handleUploadSubmit}>
                <div className="modal-body p-4">
                  {/* College Moderation Notice */}
                  <div className="p-3 mb-4 rounded bg-warning bg-opacity-10 border border-warning border-opacity-25 text-warning fs-7 d-flex align-items-start gap-2">
                    <ShieldCheck size={18} className="flex-shrink-0 mt-1" />
                    <div>
                      <strong>Approval Notice:</strong> Student uploads will be placed in <em>Pending Approval</em>.
                      To protect college academic integrity, documents will only be visible to other students once verified and approved by college faculty.
                    </div>
                  </div>

                  <div className="row g-3">
                    {/* Title */}
                    <div className="col-12">
                      <label className="form-label text-light fs-7 fw-semibold">
                        Document Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control bg-navy-deep border-secondary border-opacity-25 text-light"
                        placeholder="e.g., DBMS Complete Handwritten Lecture Notes (Unit 1 to 5)"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        required
                      />
                    </div>

                    {/* Subject */}
                    <div className="col-md-6">
                      <label className="form-label text-light fs-7 fw-semibold">
                        Subject Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control bg-navy-deep border-secondary border-opacity-25 text-light"
                        placeholder="e.g., Database Management Systems"
                        value={uploadSubject}
                        onChange={(e) => setUploadSubject(e.target.value)}
                        required
                      />
                    </div>

                    {/* Material Type */}
                    <div className="col-md-6">
                      <label className="form-label text-light fs-7 fw-semibold">
                        Material Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select bg-navy-deep border-secondary border-opacity-25 text-light"
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
                      <label className="form-label text-light fs-7 fw-semibold">
                        Department <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select bg-navy-deep border-secondary border-opacity-25 text-light"
                        value={uploadDept}
                        onChange={(e) => setUploadDept(e.target.value)}
                        required
                      >
                        {meta.departments.map((d) => (
                          <option key={d.code} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Year */}
                    <div className="col-md-4">
                      <label className="form-label text-light fs-7 fw-semibold">
                        Academic Year <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select bg-navy-deep border-secondary border-opacity-25 text-light"
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
                      <label className="form-label text-light fs-7 fw-semibold">
                        Semester <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select bg-navy-deep border-secondary border-opacity-25 text-light"
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
                      <label className="form-label text-light fs-7 fw-semibold">
                        Description / Syllabus Units (Optional)
                      </label>
                      <textarea
                        rows="2"
                        className="form-control bg-navy-deep border-secondary border-opacity-25 text-light"
                        placeholder="Add topics covered, lab experiment numbers, or exam year details..."
                        value={uploadDesc}
                        onChange={(e) => setUploadDesc(e.target.value)}
                      />
                    </div>

                    {/* PDF Dropzone */}
                    <div className="col-12">
                      <label className="form-label text-light fs-7 fw-semibold">
                        Upload PDF Document <span className="text-danger">*</span>
                      </label>
                      <div
                        className={`p-4 rounded border-2 border-dashed text-center transition-all ${dragActive ? 'border-gold bg-navy-deep' : 'border-secondary border-opacity-50 bg-navy-deep'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          className="d-none"
                          onChange={handleFileChange}
                        />

                        {uploadFile ? (
                          <div className="d-flex align-items-center justify-content-between p-3 bg-navy-main rounded border border-gold">
                            <div className="d-flex align-items-center gap-3 text-start">
                              <FileText size={32} className="text-gold" />
                              <div>
                                <h6 className="mb-0 text-light font-heading">{uploadFile.name}</h6>
                                <span className="text-muted fs-8">{formatBytes(uploadFile.size)} • PDF Document</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                            >
                              <X size={14} /> Remove
                            </button>
                          </div>
                        ) : (
                          <div>
                            <UploadCloud size={40} className="text-gold mb-2 opacity-75" />
                            <h6 className="text-light font-heading mb-1">
                              Drag & Drop your PDF file here, or click to browse
                            </h6>
                            <p className="text-muted fs-8 mb-0">
                              Only genuine PDF files (.pdf) are allowed. Maximum file size: 50 MB.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-secondary border-opacity-25">
                  <button
                    type="button"
                    className="btn btn-outline-secondary text-light"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary d-inline-flex align-items-center gap-2"
                    disabled={uploading || !uploadFile}
                  >
                    {uploading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} />
                        <span>Submit for Staff Approval</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 7. PDF Preview Modal */}
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

      {/* 8. Staff Rejection Reason Modal */}
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

export default StudyMaterials;
