import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkeletonLoader } from '../components/Common/Loader';
import { 
  UploadCloud, FileText, Film, Image as ImageIcon, Music, Archive, FileSpreadsheet,
  AlertCircle, CheckCircle, Clock, Search, History, Eye, Download, Plus, 
  X, Info, ShieldAlert, Check, RefreshCw, ChevronRight
} from 'lucide-react';

const FileManager = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const isApproved = user?.verification_status === 'approved' || user?.verification_status === 'verified' || user?.verification_status === 'Verified';
  const isPending = user?.verification_status === 'pending' || user?.verification_status === 'Pending';
  const isRejected = user?.verification_status === 'rejected' || user?.verification_status === 'Rejected';

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFileType, setSelectedFileType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All'); // For admins: 'All', 'pending', 'approved', 'rejected'
  
  // Modal / Detail drawer State
  const [selectedFile, setSelectedFile] = useState(null);
  const [allVersions, setAllVersions] = useState([]);
  const [previewVersionId, setPreviewVersionId] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewTextContent, setPreviewTextContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // New Version States
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionFile, setVersionFile] = useState(null);
  const [versionChangelog, setVersionChangelog] = useState('');
  const [versionUploading, setVersionUploading] = useState(false);
  
  // Rejection Workflow
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectFileId, setRejectFileId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const fileInputRef = useRef(null);
  const versionFileInputRef = useRef(null);

  // Fetch all files
  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_URL}/files?category=${selectedCategory}&file_type=${selectedFileType}&search=${searchTerm}`;
      if (user?.role === 'admin' || user?.role === 'staff') {
        if (selectedStatus !== 'All') {
          url += `&status=${selectedStatus}`;
        }
      }
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to load files.");
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFiles();
    }
  }, [token, selectedCategory, selectedFileType, selectedStatus]);

  // Handle Search Trigger (debounced or manually run on click)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFiles();
  };

  // Drag and Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isApproved) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!isApproved) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
      setShowUploadModal(true);
    }
  };

  const handleFileSelect = (e) => {
    if (!isApproved) return;
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setShowUploadModal(true);
    }
  };

  // Upload File Submit
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('description', uploadDescription);
    formData.append('category', uploadCategory);

    try {
      const response = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to upload file.");
      
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadDescription('');
      setUploadCategory('General');
      fetchFiles();
      toast.success("File uploaded successfully! " + (user?.role === 'admin' || user?.role === 'staff' ? "Auto-approved." : "Sent for approval."));
    } catch (err) {
      toast.error("Upload error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Upload New Version Submit
  const handleVersionSubmit = async (e) => {
    e.preventDefault();
    if (!versionFile || !selectedFile) return;

    setVersionUploading(true);
    const formData = new FormData();
    formData.append('file', versionFile);
    formData.append('changelog', versionChangelog);

    try {
      const response = await fetch(`${API_URL}/files/${selectedFile.id}/new-version`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to upload new version.");

      setShowVersionModal(false);
      setVersionFile(null);
      setVersionChangelog('');
      
      // Refresh current file details & list
      handleSelectFile(selectedFile.id);
      fetchFiles();
      toast.success("New version uploaded successfully! " + (user?.role === 'admin' || user?.role === 'staff' ? "Auto-approved." : "Sent for approval."));
    } catch (err) {
      toast.error("Version upload error: " + err.message);
    } finally {
      setVersionUploading(false);
    }
  };

  // Fetch file details including versions
  const handleSelectFile = async (fileId) => {
    // Revoke old object URL if any
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setPreviewTextContent('');
    setSelectedFile(null);
    setAllVersions([]);
    
    try {
      const response = await fetch(`${API_URL}/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to load file details.");
      const data = await response.json();
      setSelectedFile(data.file);
      setAllVersions(data.file.all_versions || []);
      
      // Default to preview latest version
      if (data.file.latest_version) {
        handleLoadPreview(data.file.latest_version.id, data.file.file_type);
      }
    } catch (err) {
      toast.error("Error loading file details: " + err.message);
    }
  };

  // Load preview blob
  const handleLoadPreview = async (versionId, fileType) => {
    setPreviewVersionId(versionId);
    setPreviewLoading(true);
    
    // Revoke old blob URL
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setPreviewTextContent('');

    try {
      if (['Image', 'Video', 'Audio', 'PDF'].includes(fileType)) {
        const response = await fetch(`${API_URL}/files/version/${versionId}/preview`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error("Failed to download preview stream.");
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setPreviewBlobUrl(objectUrl);
      } else if (fileType === 'Text') {
        const response = await fetch(`${API_URL}/files/version/${versionId}/preview`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error("Failed to fetch text preview.");
        const text = await response.text();
        setPreviewTextContent(text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Secure File Download trigger
  const handleDownload = async (versionId, originalFilename) => {
    try {
      const response = await fetch(`${API_URL}/files/version/${versionId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Download failed.");
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = originalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error("Download error: " + err.message);
    }
  };

  // Approve File (Admins & Staff)
  const handleApproveFile = async (fileId) => {
    const confirmApprove = window.confirm("Are you sure you want to approve this file? It will be visible to all users.");
    if (!confirmApprove) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/files/${fileId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to approve file.");
      
      toast.success("File approved successfully.");
      fetchFiles();
      // Reload selected file details
      handleSelectFile(fileId);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject File trigger
  const handleOpenRejectModal = (fileId) => {
    setRejectFileId(fileId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // Confirm Reject
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectFileId) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/files/${rejectFileId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to reject file.");

      setShowRejectModal(false);
      setRejectFileId(null);
      setRejectReason('');
      toast.success("File rejected successfully.");
      fetchFiles();
      
      // Reload selected file details if same
      if (selectedFile && selectedFile.id === rejectFileId) {
        handleSelectFile(rejectFileId);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Close preview drawer & clean up URL
  const handleCloseDetail = () => {
    setSelectedFile(null);
    setAllVersions([]);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setPreviewTextContent('');
  };

  // Render Category styling badges
  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Academic': return 'bg-info text-dark';
      case 'Arts': return 'bg-warning text-dark';
      case 'Sports': return 'bg-success text-light';
      case 'Technology': return 'bg-primary text-light';
      default: return 'bg-secondary text-light';
    }
  };

  // File size formatter
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Icon mapping helper based on file_type
  const getFileIcon = (fileType, size = 20) => {
    switch (fileType) {
      case 'PDF': return <FileText size={size} className="text-danger" />;
      case 'Image': return <ImageIcon size={size} className="text-success" />;
      case 'Video': return <Film size={size} className="text-warning" />;
      case 'Audio': return <Music size={size} className="text-info" />;
      case 'Excel': return <FileSpreadsheet size={size} className="text-success" />;
      case 'Text': return <FileText size={size} className="text-light" />;
      case 'ZIP': return <Archive size={size} className="text-warning" />;
      default: return <FileText size={size} className="text-muted" />;
    }
  };

  // Status badges helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 px-2 py-1 d-inline-flex align-items-center gap-1">
            <CheckCircle size={12} /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50 px-2 py-1 d-inline-flex align-items-center gap-1">
            <AlertCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-1 d-inline-flex align-items-center gap-1">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="container py-5 animated-fade-in">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
        <div>
          <h2 className="font-heading text-gold mb-1 d-flex align-items-center gap-2">
            <UploadCloud size={28} /> Campus File Hub
          </h2>
          <p className="text-muted mb-0">Secure documents, course projects, archives, and multimedia uploads</p>
        </div>
        <button 
          onClick={fetchFiles} 
          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
        >
          <RefreshCw size={14} /> Refresh Files
        </button>
      </div>

      {/* Verification Warning Banners */}
      {isPending && (
        <div className="alert alert-cc py-3 px-4 mb-4 d-flex align-items-center gap-3">
          <AlertCircle size={28} className="text-gold flex-shrink-0" />
          <div>
            <h5 className="font-heading fw-bold mb-1 text-gold">Registration Pending Verification</h5>
            <p className="mb-0 text-light opacity-90 small">
              Your staff account is currently pending administrator verification. File uploads and updates are restricted until your account is approved.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="alert alert-cc-error py-3 px-4 mb-4 d-flex align-items-center gap-3">
          <AlertCircle size={28} className="text-danger flex-shrink-0" />
          <div>
            <h5 className="font-heading fw-bold mb-1 text-danger">Verification Rejected</h5>
            <p className="mb-0 text-light opacity-90 small">
              Your staff verification request has been rejected by the administrator. File uploads and updates are disabled.
            </p>
          </div>
        </div>
      )}

      {/* Grid Layout: Main & Detail Drawer */}
      <div className="row g-4">
        {/* LEFT COLUMN: upload area + search & filters + file list */}
        <div className={selectedFile ? "col-lg-7" : "col-lg-12"}>
          
          {/* Drag & Drop Zone */}
          <div 
            className={`cc-card p-4 text-center mb-4 d-flex flex-column align-items-center justify-content-center border-2 border-dashed ${
              !isApproved 
                ? 'border-danger bg-danger bg-opacity-10' 
                : dragActive 
                ? 'border-primary bg-primary bg-opacity-10' 
                : 'border-secondary'
            }`}
            style={{ 
              minHeight: '160px', 
              cursor: isApproved ? 'pointer' : 'not-allowed', 
              transition: 'all 0.3s' 
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => {
              if (isApproved) {
                fileInputRef.current?.click();
              }
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="d-none" 
              onChange={handleFileSelect} 
              disabled={!isApproved}
            />
            <UploadCloud size={48} className={isApproved ? "text-gold mb-2" : "text-danger mb-2"} />
            {!isApproved ? (
              <>
                <h5 className="font-heading text-danger mb-1">Uploads Restricted</h5>
                <p className="text-muted small mb-0">
                  {isPending 
                    ? "Your account is pending administrator verification. File uploads are disabled until approved." 
                    : "Your account verification request was rejected. File uploads are disabled."}
                </p>
              </>
            ) : (
              <>
                <h5 className="font-heading text-light mb-1">Drag & drop your files here</h5>
                <p className="text-muted small mb-0">PDF, Word, PPT, Excel, ZIP, videos, images up to 25MB (Click to browse)</p>
              </>
            )}
          </div>

          {/* Search, Filter Cards */}
          <div className="cc-card p-4 mb-4">
            <form onSubmit={handleSearchSubmit} className="row g-3">
              <div className="col-md-5">
                <div className="position-relative">
                  <Search className="position-absolute text-muted" size={16} style={{ left: '12px', top: '14px' }} />
                  <input 
                    type="text" 
                    className="form-control ps-5" 
                    placeholder="Search by file name or info..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-3">
                <select 
                  className="form-select form-control" 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  <option value="Academic">Academic</option>
                  <option value="Arts">Arts</option>
                  <option value="Sports">Sports</option>
                  <option value="Technology">Technology</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="col-md-2">
                <select 
                  className="form-select form-control" 
                  value={selectedFileType} 
                  onChange={(e) => setSelectedFileType(e.target.value)}
                >
                  <option value="All">All Formats</option>
                  <option value="PDF">PDF Docs</option>
                  <option value="Image">Images</option>
                  <option value="Video">Videos</option>
                  <option value="Audio">Audio</option>
                  <option value="Word">Word Docs</option>
                  <option value="Excel">Spreadsheets</option>
                  <option value="ZIP">ZIP Archives</option>
                  <option value="Text">Plain Text</option>
                  <option value="Other">Others</option>
                </select>
              </div>

              {/* Admin-only status filter */}
              {(user?.role === 'admin' || user?.role === 'staff') && (
                <div className="col-md-2">
                  <select 
                    className="form-select form-control" 
                    value={selectedStatus} 
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
              
              {!(user?.role === 'admin' || user?.role === 'staff') && (
                <div className="col-md-2 d-grid">
                  <button type="submit" className="btn btn-primary py-2 px-3">Search</button>
                </div>
              )}
            </form>
          </div>

          {/* Files Grid / List */}
          {error && (
            <div className="alert alert-cc-error p-3 mb-4 d-flex align-items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <SkeletonLoader type="list" count={4} />
          ) : files.length === 0 ? (
            <div className="cc-card p-5 text-center">
              <Clock size={48} className="text-muted mb-3" />
              <h4 className="text-light font-heading">No files found</h4>
              <p className="text-muted small">Upload your first file above, or change search query/filters.</p>
            </div>
          ) : (
            <div className="row g-3">
              {files.map((file) => (
                <div key={file.id} className="col-12">
                  <div 
                    onClick={() => handleSelectFile(file.id)}
                    className={`dashboard-card p-3 d-flex align-items-center justify-content-between cursor-pointer border-start border-4 ${selectedFile?.id === file.id ? 'border-primary bg-navy-light bg-opacity-25' : 'border-secondary'}`}
                    style={{ transition: 'all 0.2s', cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 rounded bg-navy-deep border border-secondary">
                        {getFileIcon(file.file_type, 24)}
                      </div>
                      <div>
                        <h6 className="text-light font-heading mb-1 text-truncate" style={{ maxWidth: '300px' }}>
                          {file.filename}
                        </h6>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className={`badge ${getCategoryColor(file.category)}`} style={{ fontSize: '0.7rem' }}>
                            {file.category}
                          </span>
                          <span className="text-muted small">v{file.latest_version?.version_number || 1}</span>
                          <span className="text-muted small">•</span>
                          <span className="text-muted small">{file.latest_version ? formatBytes(file.latest_version.file_size) : '0B'}</span>
                          <span className="text-muted small">•</span>
                          <span className="text-muted small">by {file.uploader_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      {getStatusBadge(file.approval_status)}
                      <ChevronRight size={18} className="text-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAIL VIEW / PREVIEWER DRAWER */}
        {selectedFile && (
          <div className="col-lg-5">
            <div className="cc-card p-4 border-top border-4 border-primary position-sticky" style={{ top: '90px' }}>
              {/* Header */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex align-items-center gap-2">
                  {getFileIcon(selectedFile.file_type, 28)}
                  <div>
                    <h5 className="font-heading text-light mb-0 text-truncate" style={{ maxWidth: '240px' }} title={selectedFile.filename}>
                      {selectedFile.filename}
                    </h5>
                    <span className="text-muted small">Uploaded by {selectedFile.uploader_name}</span>
                  </div>
                </div>
                <button 
                  onClick={handleCloseDetail} 
                  className="btn btn-sm btn-link p-0 text-muted"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status Banner */}
              <div className="mb-3">
                {selectedFile.approval_status === 'rejected' && (
                  <div className="alert alert-danger p-2 border-0 bg-danger bg-opacity-10 d-flex flex-column gap-1 mb-0">
                    <div className="d-flex align-items-center gap-1 fw-semibold text-danger small">
                      <ShieldAlert size={14} /> Rejected
                    </div>
                    <p className="small mb-0 text-light opacity-75">{selectedFile.rejection_reason || 'No reason provided.'}</p>
                  </div>
                )}
                {selectedFile.approval_status === 'pending' && (
                  <div className="alert alert-warning p-2 border-0 bg-warning bg-opacity-10 d-flex align-items-center gap-1 mb-0">
                    <Clock size={14} className="text-warning" />
                    <span className="small text-light opacity-75">Pending Admin Approval</span>
                  </div>
                )}
              </div>

              {/* Preview Panel */}
              <div className="preview-container bg-navy-deep border border-secondary rounded p-2 mb-3 position-relative" style={{ minHeight: '200px' }}>
                {previewLoading ? (
                  <div className="position-absolute top-50 start-50 translate-middle d-flex flex-column align-items-center">
                    <div className="spinner-border spinner-border-sm text-gold" role="status" />
                    <span className="small text-muted mt-2">Loading preview...</span>
                  </div>
                ) : previewBlobUrl ? (
                  <>
                    {selectedFile.file_type === 'Image' && (
                      <img 
                        src={previewBlobUrl} 
                        alt={selectedFile.filename} 
                        className="img-fluid rounded w-100" 
                        style={{ maxHeight: '280px', objectFit: 'contain' }}
                      />
                    )}
                    {selectedFile.file_type === 'Video' && (
                      <video 
                        src={previewBlobUrl} 
                        controls 
                        className="w-100 rounded" 
                        style={{ maxHeight: '280px' }}
                      />
                    )}
                    {selectedFile.file_type === 'Audio' && (
                      <div className="p-3 text-center">
                        <Music size={48} className="text-info mb-2" />
                        <audio src={previewBlobUrl} controls className="w-100" />
                      </div>
                    )}
                    {selectedFile.file_type === 'PDF' && (
                      <iframe 
                        src={previewBlobUrl} 
                        className="w-100 rounded" 
                        title="PDF Preview"
                        style={{ height: '300px', border: 'none' }}
                      />
                    )}
                  </>
                ) : previewTextContent ? (
                  <pre 
                    className="text-light bg-dark p-3 rounded mb-0 text-start small font-monospace" 
                    style={{ maxHeight: '260px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}
                  >
                    <code>{previewTextContent}</code>
                  </pre>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
                    {getFileIcon(selectedFile.file_type, 36)}
                    <p className="text-muted small mt-2 mb-0">Preview not supported for {selectedFile.file_type} files.</p>
                    <button 
                      onClick={() => handleDownload(previewVersionId || selectedFile.latest_version?.id, selectedFile.filename)}
                      className="btn btn-outline-primary btn-sm mt-3 d-flex align-items-center gap-1"
                    >
                      <Download size={14} /> Download File
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-3">
                <h6 className="text-gold font-heading mb-1 small d-flex align-items-center gap-1">
                  <Info size={14} /> Description
                </h6>
                <p className="text-muted small mb-0">
                  {selectedFile.description || 'No description provided.'}
                </p>
              </div>

              {/* Admin Actions Panel */}
              {(user?.role === 'admin' || user?.role === 'staff') && selectedFile.approval_status === 'pending' && (
                <div className="mb-4 p-3 bg-navy-deep border border-warning border-opacity-25 rounded">
                  <span className="text-gold font-heading small d-block mb-2">Admin Approval Actions</span>
                  <div className="d-flex gap-2">
                    <button 
                      onClick={() => handleApproveFile(selectedFile.id)}
                      disabled={actionLoading}
                      className="btn btn-success btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button 
                      onClick={() => handleOpenRejectModal(selectedFile.id)}
                      disabled={actionLoading}
                      className="btn btn-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Version History & Actions */}
              <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom border-secondary">
                <span className="text-gold font-heading small d-flex align-items-center gap-1">
                  <History size={14} /> Version History
                </span>
                {/* Only uploader or admin can upload new version if approved */}
                {isApproved && (selectedFile.uploader_id === user?.id || user?.role === 'admin' || user?.role === 'staff') && (
                  <button 
                    onClick={() => setShowVersionModal(true)} 
                    className="btn btn-link btn-sm p-0 d-flex align-items-center gap-1 font-heading small text-decoration-none"
                  >
                    <Plus size={14} /> Upload New Version
                  </button>
                )}
              </div>

              {/* Scrollable Timeline */}
              <div className="version-timeline" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {allVersions.map((v) => (
                  <div 
                    key={v.id} 
                    className={`p-2 border-bottom border-secondary border-opacity-50 small d-flex align-items-center justify-content-between ${previewVersionId === v.id ? 'bg-navy-light bg-opacity-10' : ''}`}
                  >
                    <div style={{ maxWidth: '75%' }}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold text-light">v{v.version_number}</span>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>{formatBytes(v.file_size)}</span>
                      </div>
                      <p className="text-muted mb-0 small text-truncate" title={v.changelog}>{v.changelog}</p>
                      <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                        by {v.uploader_name} on {new Date(v.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="d-flex gap-2">
                      <button 
                        onClick={() => handleLoadPreview(v.id, selectedFile.file_type)}
                        className="btn btn-sm btn-outline-primary p-1 border-0"
                        title="Preview this version"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        onClick={() => handleDownload(v.id, selectedFile.filename)}
                        className="btn btn-sm btn-outline-primary p-1 border-0"
                        title="Download this version"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border border-secondary" style={{ backgroundColor: 'var(--cc-navy-card)', color: 'var(--cc-text-primary)' }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title font-heading text-gold">Upload File Details</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => { setShowUploadModal(false); setUploadFile(null); }} />
              </div>
              <form onSubmit={handleUploadSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-muted small">File Selected</label>
                    <div className="p-3 bg-navy-deep border border-secondary rounded d-flex align-items-center gap-2">
                      {uploadFile && getFileIcon(get_file_type(uploadFile.name), 20)}
                      <span className="fw-semibold small text-truncate d-block" style={{ maxWidth: '380px' }}>
                        {uploadFile?.name}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="upload-description" className="form-label">Description</label>
                    <textarea 
                      id="upload-description"
                      className="form-control" 
                      placeholder="Add brief details about the document contents..." 
                      rows="3"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="upload-category" className="form-label">Category</label>
                    <select 
                      id="upload-category"
                      className="form-select form-control" 
                      value={uploadCategory} 
                      onChange={(e) => setUploadCategory(e.target.value)}
                    >
                      <option value="General">General</option>
                      <option value="Academic">Academic</option>
                      <option value="Arts">Arts</option>
                      <option value="Sports">Sports</option>
                      <option value="Technology">Technology</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-outline-primary" onClick={() => { setShowUploadModal(false); setUploadFile(null); }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={uploading} className="btn btn-primary d-flex align-items-center gap-2">
                    {uploading ? <div className="spinner-border spinner-border-sm" /> : <UploadCloud size={16} />} 
                    {uploading ? "Uploading..." : "Upload File"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VERSION MODAL */}
      {showVersionModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border border-secondary" style={{ backgroundColor: 'var(--cc-navy-card)', color: 'var(--cc-text-primary)' }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title font-heading text-gold">Upload New Version</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => { setShowVersionModal(false); setVersionFile(null); }} />
              </div>
              <form onSubmit={handleVersionSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="version-file-input" className="form-label">Select Updated File</label>
                    <div 
                      className="p-4 bg-navy-deep border border-secondary border-dashed rounded text-center cursor-pointer"
                      onClick={() => versionFileInputRef.current?.click()}
                    >
                      <input 
                        id="version-file-input"
                        type="file" 
                        ref={versionFileInputRef} 
                        className="d-none"
                        onChange={(e) => e.target.files && setVersionFile(e.target.files[0])}
                      />
                      <UploadCloud size={32} className="text-gold mb-2 mx-auto d-block" />
                      <span className="small text-muted d-block">
                        {versionFile ? versionFile.name : "Click to select the updated version"}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="version-changelog" className="form-label">Changelog / Version Notes</label>
                    <input 
                      id="version-changelog"
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Added section 3, fixed formatting errors..." 
                      value={versionChangelog}
                      onChange={(e) => setVersionChangelog(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-outline-primary" onClick={() => { setShowVersionModal(false); setVersionFile(null); }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={versionUploading} className="btn btn-primary d-flex align-items-center gap-2">
                    {versionUploading ? <div className="spinner-border spinner-border-sm" /> : <UploadCloud size={16} />}
                    {versionUploading ? "Uploading..." : "Upload Version"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border border-secondary" style={{ backgroundColor: 'var(--cc-navy-card)', color: 'var(--cc-text-primary)' }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title font-heading text-danger d-flex align-items-center gap-2">
                  <ShieldAlert size={20} /> Reject File Upload
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRejectModal(false)} />
              </div>
              <form onSubmit={handleConfirmReject}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="reject-reason" className="form-label">Rejection Reason</label>
                    <textarea 
                      id="reject-reason"
                      className="form-control" 
                      placeholder="Provide details on why this file does not meet campus policies..." 
                      rows="3"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-outline-primary" onClick={() => setShowRejectModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={actionLoading} className="btn btn-danger">
                    Confirm Rejection
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

// Internal utility helper to resolve file types for preview categories matching backend returns
const get_file_type = (filename) => {
  const ext = filename.rsplit ? filename.rsplit('.', 1)[-1].lower() : (filename.split('.').pop() || '').toLowerCase();
  if (['pdf'].includes(ext)) return 'PDF';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'Image';
  if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv'].includes(ext)) return 'Video';
  if (['mp3', 'wav', 'aac', 'flac', 'm4a'].includes(ext)) return 'Audio';
  if (['doc', 'docx'].includes(ext)) return 'Word';
  if (['ppt', 'pptx'].includes(ext)) return 'PPT';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'Excel';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'ZIP';
  if (['txt', 'md', 'py', 'js', 'html', 'css', 'json', 'sql', 'c', 'cpp', 'java'].includes(ext)) return 'Text';
  return 'Other';
};

export default FileManager;
