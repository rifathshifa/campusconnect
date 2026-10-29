import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { 
  ShieldCheck, UserCheck, UserX, Clock, Search, RefreshCw, AlertCircle, 
  LayoutDashboard, Users, UserCog, FileCheck, FileSpreadsheet, Plus, 
  Edit3, Trash2, Download, Eye, X, Check, Info, FileText
} from 'lucide-react';

const AdminPanel = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Dashboard & Content States
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, students, staff, verify-staff, approve-files, reports
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [verifyingUserId, setVerifyingUserId] = useState(null);

  // Search Terms
  const [searchStudent, setSearchStudent] = useState('');
  const [searchStaff, setSearchStaff] = useState('');
  const [searchPendingFiles, setSearchPendingFiles] = useState('');

  // Modals States
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalMode, setUserModalMode] = useState('create'); // 'create', 'edit'
  const [userModalType, setUserModalType] = useState('student'); // 'student', 'staff', 'club_leader', 'admin'
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    major: '',
    graduation_year: '',
    verification_status: 'Verified'
  });

  // Rejection/Approve Details Drawer
  const [selectedFile, setSelectedFile] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Reports Generation State
  const [selectedReportType, setSelectedReportType] = useState('students'); // students, staff, files, system
  const [reportPreview, setReportPreview] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Check auth privilege
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch admin dashboard datasets
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch Analytics
      const analRes = await fetch(`${API_URL}/admin/analytics`, { headers });
      if (!analRes.ok) throw new Error("Failed to load dashboard metrics.");
      const analData = await analRes.json();
      setAnalytics(analData);

      // 2. Fetch Users
      const usersRes = await fetch(`${API_URL}/admin/users`, { headers });
      if (!usersRes.ok) throw new Error("Failed to load platform directory.");
      const usersData = await usersRes.json();
      
      const allUsers = usersData.users || [];
      setStudents(allUsers.filter(u => u.role === 'student' || u.role === 'club_leader'));
      setStaff(allUsers.filter(u => u.role === 'staff'));

      // 3. Fetch Pending Files
      const filesRes = await fetch(`${API_URL}/files/pending`, { headers });
      if (!filesRes.ok) throw new Error("Failed to load pending uploads.");
      const filesData = await filesRes.json();
      setPendingFiles(filesData.files || []);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  // Run dynamic report compilations on-demand
  useEffect(() => {
    if (selectedReportType === 'students') {
      setReportPreview(students.slice(0, 10));
    } else if (selectedReportType === 'staff') {
      setReportPreview(staff.slice(0, 10));
    } else if (selectedReportType === 'files') {
      setReportPreview(pendingFiles.slice(0, 10));
    } else {
      setReportPreview([
        { metric: 'Total Registered Students', value: analytics?.users?.students || 0 },
        { metric: 'Total Active Faculty/Staff', value: analytics?.users?.staff || 0 },
        { metric: 'Total Pending Verifications', value: analytics?.users?.pending_staff || 0 },
        { metric: 'Total Uploaded Materials', value: analytics?.files?.total || 0 },
        { metric: 'Approved Study Files', value: analytics?.files?.approved || 0 },
        { metric: 'Active Clubs / Organizations', value: analytics?.clubs_count || 0 },
        { metric: 'Scheduled Events', value: analytics?.events_count || 0 },
        { metric: 'Total Social/Discussion Posts', value: analytics?.posts_count || 0 },
      ]);
    }
  }, [selectedReportType, students, staff, pendingFiles, analytics]);

  // Handle Save User (Create/Update)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const isEdit = userModalMode === 'edit';
      const url = isEdit 
        ? `${API_URL}/admin/users/${editingUser.id}` 
        : `${API_URL}/admin/users`;
      
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        username: userFormData.username,
        email: userFormData.email,
        full_name: userFormData.full_name,
        role: userFormData.role,
        major: userFormData.major,
        graduation_year: userFormData.graduation_year || null,
        verification_status: userFormData.verification_status,
      };

      if (userFormData.password || !isEdit) {
        payload.password = userFormData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save user account details.");
      }

      setShowUserModal(false);
      toast.success(isEdit ? "Account updated successfully!" : "Account created successfully!");
      fetchAllData();
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open User Modal
  const openUserModal = (mode, type, record = null) => {
    setUserModalMode(mode);
    setUserModalType(type);
    setEditingUser(record);
    if (mode === 'edit' && record) {
      setUserFormData({
        username: record.username || '',
        email: record.email || '',
        password: '',
        full_name: record.full_name || '',
        role: record.role || type,
        major: record.major || '',
        graduation_year: record.graduation_year || '',
        verification_status: record.verification_status || 'Verified'
      });
    } else {
      setUserFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: type,
        major: '',
        graduation_year: '',
        verification_status: type === 'staff' ? 'pending' : 'Verified'
      });
    }
    setShowUserModal(true);
  };

  // Handle Delete User
  const handleDeleteUser = async (userId, name) => {
    const confirmation = window.confirm(`WARNING: Are you sure you want to permanently delete the account of ${name}? All associated records, posts, memberships, and files will be deleted.`);
    if (!confirmation) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete user.");

      toast.success("User deleted successfully.");
      fetchAllData();
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Staff Quick Verifications (Approve/Reject)
  const handleVerifyStaff = async (userId, newStatus) => {
    const confirmation = window.confirm(`Verify status change to ${newStatus} for this staff member?`);
    if (!confirmation) return;

    setVerifyingUserId(userId);
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/verify-staff/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to verify staff registration.");

      toast.success(`Staff status set to ${newStatus} successfully.`);
      fetchAllData();
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setActionLoading(false);
      setVerifyingUserId(null);
    }
  };

  // File Quick Actions
  const handleApproveFile = async (fileId) => {
    const confirmApprove = window.confirm("Approve this file for system-wide access?");
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
      
      toast.success("File approved successfully!");
      setSelectedFile(null);
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectFileModal = (file) => {
    setSelectedFile(file);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmRejectFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/files/${selectedFile.id}/reject`, {
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
      setSelectedFile(null);
      setRejectReason('');
      toast.success("File rejected.");
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
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
      toast.success("Download started!");
    } catch (err) {
      toast.error("Download error: " + err.message);
    }
  };

  // Generate and download CSV Report
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (selectedReportType === 'students') {
      headers = ['ID', 'Username', 'Email', 'Full Name', 'Role', 'Major', 'Graduation Year', 'Joined Date'];
      rows = students.map(s => [
        s.id, 
        s.username, 
        s.email, 
        s.full_name || '', 
        s.role,
        s.major || '', 
        s.graduation_year || '', 
        s.created_at ? s.created_at.slice(0,10) : ''
      ]);
      filename = 'students_directory_report.csv';
    } else if (selectedReportType === 'staff') {
      headers = ['ID', 'Username', 'Email', 'Full Name', 'Department', 'Verification Status', 'Joined Date'];
      rows = staff.map(s => [
        s.id, 
        s.username, 
        s.email, 
        s.full_name || '', 
        s.major || '', 
        s.verification_status, 
        s.created_at ? s.created_at.slice(0,10) : ''
      ]);
      filename = 'faculty_staff_report.csv';
    } else if (selectedReportType === 'files') {
      headers = ['File ID', 'Filename', 'Category', 'File Type', 'Uploader', 'Approval Status', 'Upload Date'];
      rows = pendingFiles.map(f => [
        f.id, 
        f.filename, 
        f.category, 
        f.file_type, 
        f.uploader_name, 
        f.approval_status, 
        f.created_at ? f.created_at.slice(0,10) : ''
      ]);
      filename = 'pending_files_ledger_report.csv';
    } else {
      headers = ['System Summary Metric', 'Record Count / Storage'];
      rows = [
        ['Total Registered Students', analytics?.users?.students || 0],
        ['Total Active Faculty/Staff', analytics?.users?.staff || 0],
        ['Total Pending Verifications', analytics?.users?.pending_staff || 0],
        ['Total Uploaded Materials', analytics?.files?.total || 0],
        ['Approved Study Files', analytics?.files?.approved || 0],
        ['Active Clubs / Organizations', analytics?.clubs_count || 0],
        ['Scheduled Events', analytics?.events_count || 0],
        ['Total Social/Discussion Posts', analytics?.posts_count || 0],
        ['Total File Size Storage (MB)', ((analytics?.files?.total_bytes || 0) / (1024 * 1024)).toFixed(2)]
      ];
      filename = 'system_summary_report.csv';
    }

    const csvContent = [
      headers.join(','), 
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    if (status === 'approved' || status === 'verified' || status === 'Verified') {
      return <span className="badge bg-success px-2 py-1">Verified</span>;
    }
    if (status === 'rejected' || status === 'Rejected') {
      return <span className="badge bg-danger px-2 py-1">Rejected</span>;
    }
    return <span className="badge bg-warning text-dark px-2 py-1">Pending</span>;
  };

  // Filter students & staff
  const filteredStudents = students.filter(s => 
    `${s.full_name} ${s.username} ${s.email} ${s.major}`.toLowerCase().includes(searchStudent.toLowerCase())
  );

  const filteredStaff = staff.filter(s => 
    `${s.full_name} ${s.username} ${s.email} ${s.major}`.toLowerCase().includes(searchStaff.toLowerCase())
  );

  const filteredPendingFiles = pendingFiles.filter(f => 
    `${f.filename} ${f.category} ${f.uploader_name}`.toLowerCase().includes(searchPendingFiles.toLowerCase())
  );

  return (
    <div className="container-fluid py-4 min-vh-100 animated-fade-in" style={{ backgroundColor: 'var(--cc-navy-deep)' }}>
      <div className="row g-4">
        
        {/* Left Sidebar Navigation */}
        <div className="col-lg-3 col-md-4">
          <div className="cc-card p-3 h-100 d-flex flex-column" style={{ minHeight: 'calc(100vh - 120px)', background: 'var(--cc-navy-card)', borderColor: 'var(--cc-navy-light)', borderTop: '2px solid var(--cc-gold-metallic)' }}>
            <div className="mb-4 text-center pb-3 border-bottom border-secondary">
              <h4 className="font-heading text-gold mb-1 d-flex align-items-center justify-content-center gap-2">
                <ShieldCheck size={24} /> Admin Hub
              </h4>
              <span className="badge bg-dark text-muted px-2 py-1">Platform Superuser</span>
            </div>

            <nav className="nav flex-column gap-2 mb-4">
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`btn text-start d-flex align-items-center gap-3 py-2 px-3 rounded border-0 transition-all font-heading ${activeTab === 'analytics' ? 'btn-primary text-navy' : 'text-light opacity-75 hover-gold'}`}
                style={activeTab !== 'analytics' ? { background: 'transparent' } : {}}
              >
                <LayoutDashboard size={18} /> Dashboard Analytics
              </button>

              <button 
                onClick={() => setActiveTab('students')}
                className={`btn text-start d-flex align-items-center gap-3 py-2 px-3 rounded border-0 transition-all font-heading ${activeTab === 'students' ? 'btn-primary text-navy' : 'text-light opacity-75 hover-gold'}`}
                style={activeTab !== 'students' ? { background: 'transparent' } : {}}
              >
                <Users size={18} /> Manage Students
              </button>

              <button 
                onClick={() => setActiveTab('staff')}
                className={`btn text-start d-flex align-items-center gap-3 py-2 px-3 rounded border-0 transition-all font-heading ${activeTab === 'staff' ? 'btn-primary text-navy' : 'text-light opacity-75 hover-gold'}`}
                style={activeTab !== 'staff' ? { background: 'transparent' } : {}}
              >
                <UserCog size={18} /> Manage Faculty/Staff
              </button>

              <button 
                onClick={() => setActiveTab('verify-staff')}
                className={`btn text-start d-flex align-items-center justify-content-between py-2 px-3 rounded border-0 transition-all font-heading ${activeTab === 'verify-staff' ? 'btn-primary text-navy' : 'text-light opacity-75 hover-gold'}`}
                style={activeTab !== 'verify-staff' ? { background: 'transparent' } : {}}
              >
                <div className="d-flex align-items-center gap-3">
                  <ShieldCheck size={18} /> Verify Faculty
                </div>
                {analytics?.users?.pending_staff > 0 && (
                  <span className="badge bg-danger rounded-pill text-light">{analytics.users.pending_staff}</span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab('approve-files')}
                className={`btn text-start d-flex align-items-center justify-content-between py-2 px-3 rounded border-0 transition-all font-heading ${activeTab === 'approve-files' ? 'btn-primary text-navy' : 'text-light opacity-75 hover-gold'}`}
                style={activeTab !== 'approve-files' ? { background: 'transparent' } : {}}
              >
                <div className="d-flex align-items-center gap-3">
                  <FileCheck size={18} /> Approve Course Materials
                </div>
                {pendingFiles.length > 0 && (
                  <span className="badge bg-gold text-dark rounded-pill fw-semibold">{pendingFiles.length}</span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab('reports')}
                className={`btn text-start d-flex align-items-center gap-3 py-2 px-3 rounded border-0 transition-all font-heading ${activeTab === 'reports' ? 'btn-primary text-navy' : 'text-light opacity-75 hover-gold'}`}
                style={activeTab !== 'reports' ? { background: 'transparent' } : {}}
              >
                <FileSpreadsheet size={18} /> Reports Exporter
              </button>
            </nav>

            <div className="mt-auto border-top border-secondary pt-3">
              <button 
                onClick={fetchAllData} 
                disabled={loading}
                className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Synchronize Hub
              </button>
            </div>
          </div>
        </div>

        {/* Right Main Dashboard Panel */}
        <div className="col-lg-9 col-md-8">
          
          {loading && !analytics ? (
            <div className="cc-card p-5 d-flex justify-content-center align-items-center h-100" style={{ background: 'var(--cc-navy-card)', minHeight: 'calc(100vh - 120px)' }}>
              <div className="text-center">
                <div className="spinner-border text-gold mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                <h5 className="text-light">Synchronizing CampusConnect Data...</h5>
              </div>
            </div>
          ) : (
            <div className="h-100">
              
              {/* Error Callout */}
              {error && (
                <div className="alert alert-cc-error py-3 px-4 mb-4 d-flex align-items-center gap-2">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {/* TAB CONTENT: ANALYTICS OVERVIEW */}
              {activeTab === 'analytics' && (
                <div className="row g-4">
                  {/* Stats Cards Row */}
                  <div className="col-md-3">
                    <div className="cc-card p-3 text-center border-secondary h-100" style={{ background: 'var(--cc-navy-card)' }}>
                      <Users size={32} className="text-info mb-2 mx-auto" />
                      <h3 className="fw-bold mb-0 text-light">{analytics?.users?.students || 0}</h3>
                      <p className="text-muted small mb-0 font-heading">Total Students</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="cc-card p-3 text-center border-secondary h-100" style={{ background: 'var(--cc-navy-card)' }}>
                      <UserCog size={32} className="text-success mb-2 mx-auto" />
                      <h3 className="fw-bold mb-0 text-light">{analytics?.users?.staff || 0}</h3>
                      <p className="text-muted small mb-0 font-heading">Faculty & Staff</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="cc-card p-3 text-center border-secondary h-100" style={{ background: 'var(--cc-navy-card)' }}>
                      <ShieldCheck size={32} className="text-warning mb-2 mx-auto" />
                      <h3 className="fw-bold mb-0 text-light">{analytics?.users?.pending_staff || 0}</h3>
                      <p className="text-muted small mb-0 font-heading">Pending Staff</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="cc-card p-3 text-center border-secondary h-100" style={{ background: 'var(--cc-navy-card)' }}>
                      <FileCheck size={32} className="text-gold mb-2 mx-auto" />
                      <h3 className="fw-bold mb-0 text-light">{analytics?.files?.pending || 0}</h3>
                      <p className="text-muted small mb-0 font-heading">Pending Materials</p>
                    </div>
                  </div>

                  {/* Visual charts using HTML/CSS */}
                  <div className="col-md-6">
                    <div className="cc-card p-4 h-100 border-secondary" style={{ background: 'var(--cc-navy-card)' }}>
                      <h5 className="text-gold mb-3 font-heading border-bottom pb-2 border-secondary">Files by Department Category</h5>
                      {analytics?.categories && Object.entries(analytics.categories).map(([cat, count]) => {
                        const total = analytics?.files?.total || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={cat} className="mb-3">
                            <div className="d-flex justify-content-between text-light opacity-75 small mb-1">
                              <span className="fw-semibold">{cat}</span>
                              <span>{count} files ({pct}%)</span>
                            </div>
                            <div className="progress" style={{ height: '8px', backgroundColor: 'var(--cc-navy-light)' }}>
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{ width: `${pct}%`, backgroundColor: 'var(--cc-gold-metallic)' }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="cc-card p-4 h-100 border-secondary" style={{ background: 'var(--cc-navy-card)' }}>
                      <h5 className="text-gold mb-3 font-heading border-bottom pb-2 border-secondary">Files by Document Type</h5>
                      {analytics?.file_types && Object.entries(analytics.file_types).map(([ft, count]) => {
                        const total = analytics?.files?.total || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={ft} className="mb-3">
                            <div className="d-flex justify-content-between text-light opacity-75 small mb-1">
                              <span className="fw-semibold">{ft}</span>
                              <span>{count} documents ({pct}%)</span>
                            </div>
                            <div className="progress" style={{ height: '8px', backgroundColor: 'var(--cc-navy-light)' }}>
                              <div 
                                className="progress-bar bg-info" 
                                role="progressbar" 
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* General Stats Column */}
                  <div className="col-md-12">
                    <div className="cc-card p-4 border-secondary" style={{ background: 'var(--cc-navy-card)' }}>
                      <h5 className="text-gold mb-3 font-heading border-bottom pb-2 border-secondary">Platform Records Ledger</h5>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <div className="p-3 rounded border border-secondary text-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                            <div className="text-muted small">Registered Clubs</div>
                            <h4 className="fw-bold mb-0 text-light mt-1">{analytics?.clubs_count || 0}</h4>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="p-3 rounded border border-secondary text-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                            <div className="text-muted small">Scheduled Activities</div>
                            <h4 className="fw-bold mb-0 text-light mt-1">{analytics?.events_count || 0}</h4>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="p-3 rounded border border-secondary text-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                            <div className="text-muted small">Marketplace & Discussions</div>
                            <h4 className="fw-bold mb-0 text-light mt-1">{analytics?.posts_count || 0}</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: MANAGE STUDENTS */}
              {activeTab === 'students' && (
                <div className="cc-card p-4 border-secondary" style={{ background: 'var(--cc-navy-card)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
                    <div>
                      <h4 className="text-gold mb-0 font-heading">Manage Students</h4>
                      <p className="text-muted small mb-0">Create, update, or remove student accounts and metadata</p>
                    </div>
                    <button 
                      onClick={() => openUserModal('create', 'student')}
                      className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    >
                      <Plus size={16} /> Add Student
                    </button>
                  </div>

                  <div className="position-relative mb-4">
                    <Search className="position-absolute text-muted" size={16} style={{ left: '12px', top: '14px' }} />
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="Search students by username, email, full name, major..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                    />
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <Users size={48} className="mb-3" />
                      <h5>No students found</h5>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                        <thead>
                          <tr className="text-muted border-secondary" style={{ fontSize: '0.85rem' }}>
                            <th scope="col" className="pb-3 ps-0">Full Name / Username</th>
                            <th scope="col" className="pb-3">Email Address</th>
                            <th scope="col" className="pb-3">Field of Study</th>
                            <th scope="col" className="pb-3">Grad Year</th>
                            <th scope="col" className="pb-3 text-end pe-0">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="border-secondary">
                          {filteredStudents.map((stud) => (
                            <tr key={stud.id} className="border-secondary">
                              <td className="ps-0 py-3">
                                <div className="fw-semibold text-light">{stud.full_name}</div>
                                <small className="text-muted">@{stud.username} {stud.role === 'club_leader' && <span className="badge bg-info text-dark ms-1">Club Leader</span>}</small>
                              </td>
                              <td className="py-3 text-light opacity-75">{stud.email}</td>
                              <td className="py-3 text-light opacity-75">{stud.major || 'Undecided'}</td>
                              <td className="py-3 text-light opacity-75">{stud.graduation_year || 'N/A'}</td>
                              <td className="text-end pe-0 py-3">
                                <div className="d-flex justify-content-end gap-2">
                                  <button 
                                    onClick={() => openUserModal('edit', 'student', stud)}
                                    className="btn btn-outline-primary btn-sm p-1 d-flex align-items-center justify-content-center"
                                    title="Edit Student Info"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(stud.id, stud.full_name || stud.username)}
                                    className="btn btn-outline-danger btn-sm p-1 d-flex align-items-center justify-content-center"
                                    title="Delete Student"
                                    style={{ border: '1px solid rgba(220, 53, 69, 0.4)' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: MANAGE STAFF */}
              {activeTab === 'staff' && (
                <div className="cc-card p-4 border-secondary" style={{ background: 'var(--cc-navy-card)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
                    <div>
                      <h4 className="text-gold mb-0 font-heading">Manage Faculty & Staff</h4>
                      <p className="text-muted small mb-0">Manage credentials, approval status, and departments for campus staff</p>
                    </div>
                    <button 
                      onClick={() => openUserModal('create', 'staff')}
                      className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    >
                      <Plus size={16} /> Add Staff Member
                    </button>
                  </div>

                  <div className="position-relative mb-4">
                    <Search className="position-absolute text-muted" size={16} style={{ left: '12px', top: '14px' }} />
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="Search faculty and staff by username, email, full name, department..."
                      value={searchStaff}
                      onChange={(e) => setSearchStaff(e.target.value)}
                    />
                  </div>

                  {filteredStaff.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <UserCog size={48} className="mb-3" />
                      <h5>No faculty or staff found</h5>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                        <thead>
                          <tr className="text-muted border-secondary" style={{ fontSize: '0.85rem' }}>
                            <th scope="col" className="pb-3 ps-0">Full Name / Username</th>
                            <th scope="col" className="pb-3">Email Address</th>
                            <th scope="col" className="pb-3">Department</th>
                            <th scope="col" className="pb-3">Verification Status</th>
                            <th scope="col" className="pb-3 text-end pe-0">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="border-secondary">
                          {filteredStaff.map((st) => (
                            <tr key={st.id} className="border-secondary">
                              <td className="ps-0 py-3">
                                <div className="fw-semibold text-light">{st.full_name}</div>
                                <small className="text-muted">@{st.username}</small>
                              </td>
                              <td className="py-3 text-light opacity-75">{st.email}</td>
                              <td className="py-3 text-light opacity-75">{st.major || 'Not specified'}</td>
                              <td className="py-3">{getStatusBadge(st.verification_status)}</td>
                              <td className="text-end pe-0 py-3">
                                <div className="d-flex justify-content-end gap-2">
                                  {st.verification_status === 'pending' && (
                                    <>
                                      <button 
                                        onClick={() => handleVerifyStaff(st.id, 'Verified')}
                                        disabled={actionLoading}
                                        className="btn btn-success btn-sm py-1 px-2 d-flex align-items-center gap-1 border-0"
                                        title="Approve registration"
                                      >
                                        {actionLoading && verifyingUserId === st.id ? (
                                          <RefreshCw size={12} className="animate-spin" />
                                        ) : (
                                          <UserCheck size={12} />
                                        )} Verify
                                      </button>
                                      <button 
                                        onClick={() => handleVerifyStaff(st.id, 'Rejected')}
                                        disabled={actionLoading}
                                        className="btn btn-danger btn-sm py-1 px-2 d-flex align-items-center gap-1 border-0"
                                        title="Reject registration"
                                      >
                                        {actionLoading && verifyingUserId === st.id ? (
                                          <RefreshCw size={12} className="animate-spin" />
                                        ) : (
                                          <UserX size={12} />
                                        )} Reject
                                      </button>
                                    </>
                                  )}
                                  <button 
                                    onClick={() => openUserModal('edit', 'staff', st)}
                                    className="btn btn-outline-primary btn-sm p-1 d-flex align-items-center justify-content-center"
                                    title="Edit Staff Member"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(st.id, st.full_name || st.username)}
                                    className="btn btn-outline-danger btn-sm p-1 d-flex align-items-center justify-content-center"
                                    title="Delete Staff Account"
                                    style={{ border: '1px solid rgba(220, 53, 69, 0.4)' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: VERIFY STAFF */}
              {activeTab === 'verify-staff' && (
                <div className="cc-card p-4 border-secondary" style={{ background: 'var(--cc-navy-card)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
                    <div>
                      <h4 className="text-gold mb-0 font-heading">Verify Staff Registrations</h4>
                      <p className="text-muted small mb-0">Approve or decline uploading credentials for newly registered staff</p>
                    </div>
                  </div>

                  {staff.filter(st => st.verification_status === 'pending').length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <Clock size={48} className="mb-3 text-muted" />
                      <h5>No pending verifications</h5>
                      <p className="small text-muted mt-1">All faculty registrations are verified and up-to-date.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                        <thead>
                          <tr className="text-muted border-secondary" style={{ fontSize: '0.85rem' }}>
                            <th scope="col" className="pb-3 ps-0">Full Name / Username</th>
                            <th scope="col" className="pb-3">Email Address</th>
                            <th scope="col" className="pb-3">Department</th>
                            <th scope="col" className="pb-3 text-end pe-0">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="border-secondary">
                          {staff.filter(st => st.verification_status === 'pending').map((st) => (
                            <tr key={st.id} className="border-secondary">
                              <td className="ps-0 py-3">
                                <div className="fw-semibold text-light">{st.full_name}</div>
                                <small className="text-muted">@{st.username}</small>
                              </td>
                              <td className="py-3 text-light opacity-75">{st.email}</td>
                              <td className="py-3 text-light opacity-75">{st.major || 'Not specified'}</td>
                              <td className="text-end pe-0 py-3">
                                <div className="d-flex justify-content-end gap-2">
                                  <button 
                                    onClick={() => handleVerifyStaff(st.id, 'Verified')}
                                    disabled={actionLoading}
                                    className="btn btn-success btn-sm py-1 px-3 d-flex align-items-center gap-1 border-0"
                                  >
                                    {actionLoading && verifyingUserId === st.id ? (
                                      <RefreshCw size={14} className="animate-spin" />
                                    ) : (
                                      <UserCheck size={14} />
                                    )} Approve Staff
                                  </button>
                                  <button 
                                    onClick={() => handleVerifyStaff(st.id, 'Rejected')}
                                    disabled={actionLoading}
                                    className="btn btn-danger btn-sm py-1 px-3 d-flex align-items-center gap-1 border-0"
                                  >
                                    {actionLoading && verifyingUserId === st.id ? (
                                      <RefreshCw size={14} className="animate-spin" />
                                    ) : (
                                      <UserX size={14} />
                                    )} Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: APPROVE FILES */}
              {activeTab === 'approve-files' && (
                <div className="cc-card p-4 border-secondary" style={{ background: 'var(--cc-navy-card)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
                    <div>
                      <h4 className="text-gold mb-0 font-heading">Course Material Moderation</h4>
                      <p className="text-muted small mb-0">Approve or reject student submissions for the shared study archive</p>
                    </div>
                  </div>

                  <div className="position-relative mb-4">
                    <Search className="position-absolute text-muted" size={16} style={{ left: '12px', top: '14px' }} />
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="Search pending uploads by filename, uploader, category..."
                      value={searchPendingFiles}
                      onChange={(e) => setSearchPendingFiles(e.target.value)}
                    />
                  </div>

                  {filteredPendingFiles.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <FileCheck size={48} className="mb-3 text-muted" />
                      <h5>No pending submissions found</h5>
                      <p className="small text-muted mt-1">There are no files waiting for approval.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                        <thead>
                          <tr className="text-muted border-secondary" style={{ fontSize: '0.85rem' }}>
                            <th scope="col" className="pb-3 ps-0">Filename</th>
                            <th scope="col" className="pb-3">Uploader</th>
                            <th scope="col" className="pb-3">Category</th>
                            <th scope="col" className="pb-3">Type</th>
                            <th scope="col" className="pb-3 text-end pe-0">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="border-secondary">
                          {filteredPendingFiles.map((file) => (
                            <tr key={file.id} className="border-secondary">
                              <td className="ps-0 py-3">
                                <div className="fw-semibold text-light">{file.filename}</div>
                                <small className="text-muted">{file.description || 'No description provided'}</small>
                              </td>
                              <td className="py-3 text-light opacity-75">{file.uploader_name}</td>
                              <td className="py-3 text-light opacity-75">{file.category}</td>
                              <td className="py-3 text-light opacity-75">
                                <span className="badge bg-secondary text-capitalize">{file.file_type}</span>
                              </td>
                              <td className="text-end pe-0 py-3">
                                <div className="d-flex justify-content-end gap-2">
                                  {file.latest_version && (
                                    <button 
                                      onClick={() => handleDownload(file.latest_version.id, file.filename)}
                                      className="btn btn-outline-info btn-sm p-1 d-flex align-items-center justify-content-center"
                                      title="Download File"
                                    >
                                      <Download size={14} />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleApproveFile(file.id)}
                                    className="btn btn-success btn-sm py-1 px-3 d-flex align-items-center gap-1 border-0"
                                  >
                                    <Check size={14} /> Approve
                                  </button>
                                  <button 
                                    onClick={() => handleOpenRejectFileModal(file)}
                                    className="btn btn-danger btn-sm py-1 px-3 d-flex align-items-center gap-1 border-0"
                                  >
                                    <X size={14} /> Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: REPORTS EXPORTER */}
              {activeTab === 'reports' && (
                <div className="cc-card p-4 border-secondary" style={{ background: 'var(--cc-navy-card)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
                    <div>
                      <h4 className="text-gold mb-0 font-heading">Platform Reports Center</h4>
                      <p className="text-muted small mb-0">Generate, review, and export platform metrics and directory sheets</p>
                    </div>
                    <button 
                      onClick={handleExportCSV}
                      className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                    >
                      <Download size={16} /> Export to CSV
                    </button>
                  </div>

                  {/* Select Report Type */}
                  <div className="row g-3 mb-4 align-items-center">
                    <div className="col-md-4">
                      <label className="form-label font-heading text-muted small">Select Report Domain</label>
                      <select 
                        className="form-select bg-navy-main border-secondary text-light form-control" 
                        value={selectedReportType} 
                        onChange={(e) => setSelectedReportType(e.target.value)}
                        style={{ border: '1px solid var(--cc-navy-light)' }}
                      >
                        <option value="students">Students Directory</option>
                        <option value="staff">Faculty/Staff Ledger</option>
                        <option value="files">Moderation Audit Logs</option>
                        <option value="system">System Metrics Summary</option>
                      </select>
                    </div>
                    <div className="col-md-8 text-end pt-4">
                      <span className="text-muted small">Generated dynamic report contains <b>{selectedReportType === 'system' ? reportPreview.length : (selectedReportType === 'students' ? students.length : (selectedReportType === 'staff' ? staff.length : pendingFiles.length))}</b> total rows.</span>
                    </div>
                  </div>

                  <h5 className="font-heading text-gold mb-3">On-screen Preview (First 10 records)</h5>
                  <div className="table-responsive rounded border border-secondary" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    
                    {/* Render preview headers and rows depending on selection */}
                    {selectedReportType === 'students' && (
                      <table className="table table-dark mb-0">
                        <thead>
                          <tr className="text-muted border-secondary">
                            <th>Username</th>
                            <th>Email</th>
                            <th>Full Name</th>
                            <th>Field / Major</th>
                            <th>Year</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportPreview.map((item, idx) => (
                            <tr key={idx} className="border-secondary">
                              <td>{item.username}</td>
                              <td>{item.email}</td>
                              <td>{item.full_name}</td>
                              <td>{item.major || 'N/A'}</td>
                              <td>{item.graduation_year || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {selectedReportType === 'staff' && (
                      <table className="table table-dark mb-0">
                        <thead>
                          <tr className="text-muted border-secondary">
                            <th>Username</th>
                            <th>Email</th>
                            <th>Full Name</th>
                            <th>Department</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportPreview.map((item, idx) => (
                            <tr key={idx} className="border-secondary">
                              <td>{item.username}</td>
                              <td>{item.email}</td>
                              <td>{item.full_name}</td>
                              <td>{item.major || 'N/A'}</td>
                              <td>{getStatusBadge(item.verification_status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {selectedReportType === 'files' && (
                      <table className="table table-dark mb-0">
                        <thead>
                          <tr className="text-muted border-secondary">
                            <th>Filename</th>
                            <th>Uploader</th>
                            <th>Category</th>
                            <th>File Type</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportPreview.map((item, idx) => (
                            <tr key={idx} className="border-secondary">
                              <td>{item.filename}</td>
                              <td>{item.uploader_name}</td>
                              <td>{item.category}</td>
                              <td>{item.file_type}</td>
                              <td>{getStatusBadge(item.approval_status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {selectedReportType === 'system' && (
                      <table className="table table-dark mb-0">
                        <thead>
                          <tr className="text-muted border-secondary">
                            <th>Core System Metric</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportPreview.map((item, idx) => (
                            <tr key={idx} className="border-secondary">
                              <td>{item.metric}</td>
                              <td className="fw-semibold text-gold">{item.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* USER CREATE / EDIT MODAL */}
      {showUserModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.65)' }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="cc-card p-4 border-secondary w-100 modal-content text-light" style={{ background: 'var(--cc-navy-card)', position: 'relative' }}>
              
              <button 
                onClick={() => setShowUserModal(false)}
                className="btn position-absolute text-muted hover-gold border-0" 
                style={{ right: '16px', top: '16px', background: 'transparent' }}
              >
                <X size={20} />
              </button>

              <h4 className="font-heading text-gold mb-3 pb-2 border-bottom border-secondary">
                {userModalMode === 'edit' ? 'Update User Account' : `Create New ${userModalType === 'student' ? 'Student' : 'Staff'} Account`}
              </h4>

              <form onSubmit={handleSaveUser}>
                <div className="mb-3">
                  <label className="form-label font-heading text-muted small">Username</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label font-heading text-muted small">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label font-heading text-muted small">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={userFormData.full_name}
                    onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label font-heading text-muted small">
                    Password {userModalMode === 'edit' && <span className="text-muted">(leave blank to keep current)</span>}
                  </label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    required={userModalMode === 'create'}
                    placeholder={userModalMode === 'edit' ? '••••••••' : ''}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label font-heading text-muted small">Role</label>
                  <select 
                    className="form-select bg-navy-main border-secondary text-light form-control" 
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="club_leader">Club Leader</option>
                    <option value="staff">Staff/Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {userFormData.role === 'staff' ? (
                  <>
                    <div className="mb-3">
                      <label className="form-label font-heading text-muted small">Department</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={userFormData.major}
                        onChange={(e) => setUserFormData({ ...userFormData, major: e.target.value })}
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label font-heading text-muted small">Verification Status</label>
                      <select 
                        className="form-select bg-navy-main border-secondary text-light form-control" 
                        value={userFormData.verification_status}
                        onChange={(e) => setUserFormData({ ...userFormData, verification_status: e.target.value })}
                      >
                        <option value="pending">Pending Verification</option>
                        <option value="Verified">Verified</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="row g-2 mb-3">
                    <div className="col-md-8">
                      <label className="form-label font-heading text-muted small">Major</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={userFormData.major}
                        onChange={(e) => setUserFormData({ ...userFormData, major: e.target.value })}
                        placeholder="e.g. Electrical Engineering"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label font-heading text-muted small">Graduation Year</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={userFormData.graduation_year}
                        onChange={(e) => setUserFormData({ ...userFormData, graduation_year: e.target.value })}
                        placeholder="e.g. 2027"
                      />
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowUserModal(false)}
                    className="btn btn-outline-primary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={actionLoading}
                    className="btn btn-primary"
                  >
                    {actionLoading ? (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* REJECT FILE REASON MODAL */}
      {showRejectModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.65)' }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="cc-card p-4 border-secondary w-100 modal-content text-light" style={{ background: 'var(--cc-navy-card)', position: 'relative' }}>
              
              <button 
                onClick={() => setShowRejectModal(false)}
                className="btn position-absolute text-muted hover-gold border-0" 
                style={{ right: '16px', top: '16px', background: 'transparent' }}
              >
                <X size={20} />
              </button>

              <h4 className="font-heading text-gold mb-3 pb-2 border-bottom border-secondary">
                File Rejection Audit Reason
              </h4>

              <form onSubmit={handleConfirmRejectFile}>
                <div className="mb-3">
                  <label className="form-label font-heading text-muted small">Reason for Rejection</label>
                  <textarea 
                    className="form-control" 
                    rows="3"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide audit reason to be sent to uploader..."
                    required
                  ></textarea>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowRejectModal(false)}
                    className="btn btn-outline-primary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={actionLoading}
                    className="btn btn-danger border-0"
                    style={{ backgroundColor: 'var(--bs-danger)' }}
                  >
                    {actionLoading ? (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    ) : (
                      'Reject Submission'
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

export default AdminPanel;
