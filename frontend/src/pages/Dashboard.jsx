import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingScreen, SkeletonLoader } from '../components/Common/Loader';
import { 
  Bell, Calendar, MessageSquare, AlertCircle, Compass, Radio, Users, Plus, X, 
  GraduationCap, Award, CheckSquare, BookOpen, Clock, MapPin, UserCheck, 
  Download, Send, Bot, Sparkles, RefreshCw, ChevronRight, FileText,
  UploadCloud, History, FileCheck, BarChart2, Check, XCircle, File, HardDrive, ShieldAlert, Eye
} from 'lucide-react';

const Dashboard = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isStaff = user?.role === 'staff';
  const isPending = user?.verification_status === 'pending' || user?.verification_status === 'Pending';
  const isRejected = user?.verification_status === 'rejected' || user?.verification_status === 'Rejected';

  // Timetable Day Selector
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const today = new Date().getDay();
  const defaultDay = today >= 1 && today <= 5 ? daysOfWeek[today - 1] : 'Monday';
  const [selectedDay, setSelectedDay] = useState(defaultDay);

  // Content Creation Modal State (for Staff/Admins or Feed posting)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contentType, setContentType] = useState('post'); // 'post', 'announcement', 'event'
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Discussions');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [volunteerNeeded, setVolunteerNeeded] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // AI Assistant Floating Widget State
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { 
      sender: 'bot', 
      text: `Hello ${user?.full_name || user?.username}! I am your CampusConnect AI Study Buddy. I can check your timetable, assignments, attendance, or suggest resources. Ask me anything!` 
    }
  ]);
  const [sendingChat, setSendingChat] = useState(false);
  const chatHistoryRef = useRef(null);

  // Staff Dashboard States
  const [staffTab, setStaffTab] = useState('upload_center'); // upload_center, history, approvals, analytics
  const [pendingFiles, setPendingFiles] = useState([]);
  const [staffFiles, setStaffFiles] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Moderation (Reject) Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectFileId, setRejectFileId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [moderating, setModerating] = useState(false);

  // New Version Upload State
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionFileId, setVersionFileId] = useState(null);
  const [versionFile, setVersionFile] = useState(null);
  const [versionChangelog, setVersionChangelog] = useState('');
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [versionError, setVersionError] = useState(null);
  const [versionSuccess, setVersionSuccess] = useState(null);

  // File Upload Center State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchStaffDashboardData = async () => {
    if (!token || !isStaff) return;
    
    setLoadingPending(true);
    setLoadingHistory(true);
    setLoadingAnalytics(true);
    
    // Fetch Pending
    try {
      const response = await fetch(`${API_URL}/files/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingFiles(data.files || []);
      }
    } catch (err) {
      console.error("Error fetching pending files:", err);
    } finally {
      setLoadingPending(false);
    }

    // Fetch Analytics
    try {
      const response = await fetch(`${API_URL}/staff/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error("Error fetching staff analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }

    // Fetch Upload History (All files, will filter locally)
    try {
      const response = await fetch(`${API_URL}/files`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStaffFiles(data.files || []);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle file approval
  const handleApproveFile = async (fileId) => {
    try {
      const response = await fetch(`${API_URL}/files/${fileId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to approve file');
      }
      toast.success("File approved successfully!");
      fetchStaffDashboardData();
    } catch (err) {
      toast.error("Error approving file: " + err.message);
    }
  };

  // Open reject modal
  const openRejectModal = (fileId) => {
    setRejectFileId(fileId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Handle file rejection submission
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    
    setModerating(true);
    try {
      const response = await fetch(`${API_URL}/files/${rejectFileId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectionReason })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject file');
      }
      
      toast.success("File rejected successfully.");
      setShowRejectModal(false);
      fetchStaffDashboardData();
    } catch (err) {
      toast.error("Error rejecting file: " + err.message);
    } finally {
      setModerating(false);
    }
  };

  // Open version modal
  const openVersionModal = (fileId) => {
    setVersionFileId(fileId);
    setVersionFile(null);
    setVersionChangelog('');
    setVersionError(null);
    setVersionSuccess(null);
    setShowVersionModal(true);
  };

  // Handle upload new version submission
  const handleNewVersionSubmit = async (e) => {
    e.preventDefault();
    if (!versionFile) {
      setVersionError("Please select a file.");
      return;
    }

    setUploadingVersion(true);
    setVersionError(null);
    setVersionSuccess(null);

    const formData = new FormData();
    formData.append('file', versionFile);
    formData.append('changelog', versionChangelog || "Updated version");

    try {
      const response = await fetch(`${API_URL}/files/${versionFileId}/new-version`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Failed to upload new version.');
      }

      setVersionSuccess(`Version uploaded successfully!`);
      setTimeout(() => {
        setShowVersionModal(false);
        fetchStaffDashboardData();
      }, 1500);

    } catch (err) {
      setVersionError(err.message);
    } finally {
      setUploadingVersion(false);
    }
  };

  // Handle main file upload (Upload Center)
  const handleFileUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select or drop a file first.");
      return;
    }

    setUploadingFile(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('category', uploadCategory);
    formData.append('description', uploadDescription);

    try {
      const response = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Failed to upload file.');
      }

      setUploadSuccess(`File "${uploadFile.name}" uploaded and auto-approved successfully!`);
      setUploadFile(null);
      setUploadDescription('');
      fetchStaffDashboardData();

    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType) => {
    switch (fileType?.toUpperCase()) {
      case 'PDF':
        return <FileText size={18} className="text-danger" />;
      case 'IMAGE':
        return <FileText size={18} className="text-info" />;
      case 'WORD':
        return <FileText size={18} className="text-primary" />;
      case 'PPT':
        return <FileText size={18} className="text-warning" />;
      case 'ZIP':
        return <FileText size={18} className="text-secondary" />;
      default:
        return <FileText size={18} className="text-gold" />;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard content');
      }

      const resData = await response.json();
      setData(resData);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      if (isStaff) {
        fetchStaffDashboardData();
      }
    }
  }, [token, API_URL, isStaff]);

  // Scroll to bottom of chat history when messages update
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatMessages, showAIChat]);

  // Secure File Download trigger for Recent Materials
  const handleDownloadFile = async (versionId, originalFilename) => {
    try {
      const response = await fetch(`${API_URL}/files/version/${versionId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Unable to download this file version.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started!");
    } catch (err) {
      toast.error("Download error: " + err.message);
    }
  };

  // Submit AI Assistant message
  const handleSendChatMessage = async (msgText) => {
    const textToSubmit = msgText || chatInput;
    if (!textToSubmit.trim() || sendingChat) return;

    // Add user message to state
    const newUserMessage = { sender: 'user', text: textToSubmit };
    setChatMessages(prev => [...prev, newUserMessage]);
    if (!msgText) setChatInput(''); // clear text box if manual typing
    
    setSendingChat(true);

    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: textToSubmit })
      });

      if (!response.ok) {
        throw new Error("I had trouble reaching my knowledge center. Please try again.");
      }

      const chatData = await response.json();
      setChatMessages(prev => [...prev, { sender: 'bot', text: chatData.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: `Sorry: ${err.message}` }]);
    } finally {
      setSendingChat(false);
    }
  };

  const handleSendSuggestion = (text) => {
    handleSendChatMessage(text);
  };

  // Handle feed content uploads
  const handleSubmitContent = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    let endpoint = '/posts';
    let bodyData = {};

    if (contentType === 'post') {
      endpoint = '/posts';
      bodyData = {
        title,
        content,
        category,
        price: category === 'Marketplace' && price ? parseFloat(price) : null
      };
    } else if (contentType === 'announcement') {
      endpoint = '/announcements';
      bodyData = { title, content };
    } else if (contentType === 'event') {
      endpoint = '/events';
      bodyData = {
        title,
        description: content,
        location,
        event_date: eventDate,
        volunteer_needed: volunteerNeeded
      };
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Failed to create content.');
      }

      setSuccessMessage('Content shared successfully!');
      
      // Clear inputs
      setTitle('');
      setContent('');
      setPrice('');
      setLocation('');
      setEventDate('');
      setVolunteerNeeded(false);

      // Refresh feed
      fetchDashboardData();

      // Close modal after delay
      setTimeout(() => {
        setShowCreateModal(false);
        setSuccessMessage(null);
      }, 1500);

    } catch (err) {
      console.error("Submission error:", err);
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Parser helper for AI messages to render simple markdown tags
  const renderMessageContent = (text) => {
    if (!text) return '';
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/^### (.*$)/gim, '<h6 class="fw-bold text-gold mt-2 mb-1">$1</h6>')
      .replace(/^## (.*$)/gim, '<h5 class="fw-bold text-gold mt-2 mb-1">$1</h5>')
      .replace(/^# (.*$)/gim, '<h4 class="fw-bold text-gold mt-2 mb-1">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li class="small ms-3 my-1">$1</li>');
    
    return <div dangerouslySetInnerHTML={{ __html: html.replace(/\n/g, '<br />') }} />;
  };

  // Determine if student role
  const isStudent = (data?.role || user?.role) === 'student';

  if (loading) {
    return <LoadingScreen message="Loading CampusConnect Dashboard..." />;
  }

  // If student dashboard role
  if (isStudent) {
    // Seeding sample Fallback data if server returns empty objects/offline mode
    const timetable = data?.timetable || [];
    const assignments = data?.assignments || [];
    const attendance = data?.attendance || { overall_percentage: 92.4, courses: [] };
    const recentMaterials = data?.recent_materials || [];
    const announcements = data?.announcements || [
      'Enrollment for Fall Semester ends in 3 days.',
      'Main Library will be closed on Sunday for maintenance.'
    ];

    // Filter timetable slots for active day
    const timetableForSelectedDay = timetable.filter(
      slot => slot.day_of_week.toLowerCase() === selectedDay.toLowerCase()
    ).sort((a, b) => a.start_time.localeCompare(b.start_time));

    return (
      <div className="container py-5 animated-fade-in">
        
        {/* Welcome Header */}
        <div className="cc-card p-4 mb-4" style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="p-3 rounded bg-navy-light text-gold">
              <GraduationCap size={40} />
            </div>
            <div>
              <h2 className="font-heading mb-1 text-gold">Welcome back, {user?.full_name || user?.username}!</h2>
              <p className="text-light opacity-75 mb-0 small d-flex flex-wrap gap-x-3 gap-y-1">
                <span><strong>Major:</strong> {user?.major || 'Computer Science'}</span>
                <span className="text-muted">|</span>
                <span><strong>Year:</strong> {user?.graduation_year || 2028} Graduation</span>
              </p>
            </div>
          </div>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05, transform: 'scale(1.5)' }}>
            <GraduationCap size={150} />
          </div>
        </div>

        {/* Dashboard Cards Row */}
        <div className="row g-4 mb-5">
          {/* Card 1: Cumulative GPA */}
          <div className="col-6 col-lg-3">
            <div className="dashboard-card h-100 d-flex flex-column justify-content-between p-4" style={{ borderLeft: '3px solid var(--cc-gold-metallic)' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <span className="text-muted small uppercase fw-medium">Cumulative GPA</span>
                <Award className="text-gold" size={20} />
              </div>
              <div>
                <h3 className="font-heading text-light mb-1">{data?.gpa || '3.85'}</h3>
                <span className="text-gold small fw-medium">Excellent Standing</span>
              </div>
            </div>
          </div>

          {/* Card 2: Overall Attendance */}
          <div className="col-6 col-lg-3">
            <div className="dashboard-card h-100 d-flex flex-column justify-content-between p-4" style={{ borderLeft: '3px solid #2ECC71' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <span className="text-muted small uppercase fw-medium">Attendance</span>
                <UserCheck className="text-success" size={20} />
              </div>
              <div>
                <h3 className="font-heading text-light mb-1">{attendance?.overall_percentage || '92.4'}%</h3>
                <span className="text-success small fw-medium">Safe Zone (&gt;75%)</span>
              </div>
            </div>
          </div>

          {/* Card 3: Pending Tasks */}
          <div className="col-6 col-lg-3">
            <div className="dashboard-card h-100 d-flex flex-column justify-content-between p-4" style={{ borderLeft: '3px solid #E74C3C' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <span className="text-muted small uppercase fw-medium">Pending Tasks</span>
                <CheckSquare className="text-danger" size={20} />
              </div>
              <div>
                <h3 className="font-heading text-light mb-1">{data?.pending_assignments || '2'}</h3>
                <span className="text-danger small fw-medium">Due this week</span>
              </div>
            </div>
          </div>

          {/* Card 4: Active Credits */}
          <div className="col-6 col-lg-3">
            <div className="dashboard-card h-100 d-flex flex-column justify-content-between p-4" style={{ borderLeft: '3px solid #9B59B6' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <span className="text-muted small uppercase fw-medium">Enrolled Credits</span>
                <BookOpen className="text-purple" style={{ color: '#9B59B6' }} size={20} />
              </div>
              <div>
                <h3 className="font-heading text-light mb-1">{data?.credits || '15'} Credits</h3>
                <span className="text-muted small fw-medium">Active Semester</span>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-5">
          {/* Left Column: Timetable Scheduler */}
          <div className="col-lg-8">
            <div className="cc-card p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h4 font-heading text-gold mb-0 d-flex align-items-center gap-2">
                  <Calendar size={22} /> Daily Timetable
                </h3>
              </div>

              {/* Day Selector Row */}
              <div className="d-flex gap-2 mb-4 overflow-x-auto pb-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`cc-day-tab flex-fill ${selectedDay === day ? 'active' : ''}`}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>

              {/* Classes Schedule Slots */}
              {timetableForSelectedDay.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {timetableForSelectedDay.map((slot) => (
                    <div key={slot.id} className="dashboard-card p-3 border border-secondary border-opacity-20 hover-opacity-100">
                      <div className="row align-items-center">
                        <div className="col-md-7 mb-2 mb-md-0">
                          <h5 className="font-heading mb-1 text-light">{slot.course}</h5>
                          <span className="text-muted small d-flex align-items-center gap-1">
                            <GraduationCap size={14} className="text-gold" /> {slot.instructor}
                          </span>
                        </div>
                        <div className="col-md-5 d-flex flex-column gap-1 text-md-end">
                          <span className="text-gold small fw-medium d-flex align-items-center justify-content-md-end gap-1">
                            <Clock size={14} /> {slot.start_time} - {slot.end_time}
                          </span>
                          <span className="text-light opacity-75 small d-flex align-items-center justify-content-md-end gap-1">
                            <MapPin size={14} className="text-muted" /> {slot.room}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 border border-dashed rounded border-secondary border-opacity-35">
                  <Calendar size={48} className="text-muted mb-2 opacity-50" />
                  <p className="text-muted mb-0">No classes scheduled on {selectedDay}. Enjoy your day off!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Attendance Statistics Breakdown */}
          <div className="col-lg-4">
            <div className="cc-card p-4 h-100">
              <h3 className="h5 font-heading text-gold mb-4 d-flex align-items-center gap-2">
                <UserCheck size={20} /> Class Attendance
              </h3>
              
              {attendance.courses && attendance.courses.length > 0 ? (
                <div className="d-flex flex-column gap-4">
                  {attendance.courses.map((courseStat, i) => {
                    const pct = courseStat.percentage;
                    // Color code based on threshold
                    const barColor = pct >= 90 ? 'bg-success' : (pct >= 75 ? 'bg-warning' : 'bg-danger');
                    const textClass = pct >= 90 ? 'text-success' : (pct >= 75 ? 'text-warning' : 'text-danger');

                    return (
                      <div key={i} className="attendance-item">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="small text-light fw-medium truncate-text" style={{ maxWidth: '70%' }} title={courseStat.course}>
                            {courseStat.course}
                          </span>
                          <span className={`small fw-bold ${textClass}`}>{pct}%</span>
                        </div>
                        <div className="progress" style={{ height: '8px', backgroundColor: 'var(--cc-navy-main)' }}>
                          <div 
                            className={`progress-bar ${barColor}`} 
                            role="progressbar" 
                            style={{ width: `${pct}%`, borderRadius: '4px' }}
                            aria-valuenow={pct} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <div className="d-flex justify-content-between mt-1 text-muted" style={{ fontSize: '0.7rem' }}>
                          <span>Attended: {courseStat.present + courseStat.late}/{courseStat.total}</span>
                          <span>Absences: {courseStat.absent}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5">
                  <UserCheck size={36} className="text-muted opacity-50 mb-2" />
                  <p className="text-muted small mb-0">No attendance data logs recorded.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assignments Table & Study Materials / Announcements */}
        <div className="row g-4">
          
          {/* Assignments Widget */}
          <div className="col-lg-8">
            <div className="cc-card p-4 h-100">
              <h3 className="h4 font-heading text-gold mb-4 d-flex align-items-center gap-2">
                <CheckSquare size={22} /> Course Assignments
              </h3>

              {assignments.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-dark table-borderless align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                    <thead>
                      <tr className="border-bottom border-secondary border-opacity-35 text-muted" style={{ fontSize: '0.85rem' }}>
                        <th className="pb-3" style={{ background: 'transparent' }}>Course</th>
                        <th className="pb-3" style={{ background: 'transparent' }}>Task</th>
                        <th className="pb-3" style={{ background: 'transparent' }}>Due Date</th>
                        <th className="pb-3 text-end" style={{ background: 'transparent' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((item) => {
                        const isGraded = item.status === 'Graded';
                        const isSubmitted = item.status === 'Submitted';
                        const isPending = item.status === 'Pending';
                        
                        let badgeClass = 'bg-warning text-dark';
                        if (isGraded) badgeClass = 'bg-success text-light';
                        if (isSubmitted) badgeClass = 'bg-info text-dark';

                        return (
                          <tr key={item.id} className="border-bottom border-secondary border-opacity-10">
                            <td className="py-3 text-gold fw-medium small" style={{ background: 'transparent' }}>
                              {item.course.split(' - ')[0]}
                            </td>
                            <td className="py-3" style={{ background: 'transparent' }}>
                              <div className="text-light small fw-medium">{item.title}</div>
                              {item.description && <div className="text-muted small opacity-75 mt-1" style={{ fontSize: '0.75rem' }}>{item.description}</div>}
                            </td>
                            <td className="py-3 text-muted small" style={{ background: 'transparent' }}>
                              {item.due_date ? new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                            </td>
                            <td className="py-3 text-end" style={{ background: 'transparent' }}>
                              <span className={`badge ${badgeClass} small text-capitalize px-2.5 py-1.5`}>
                                {item.status} {item.grade ? `(${item.grade})` : ''}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <CheckSquare size={40} className="text-muted opacity-50 mb-2" />
                  <p className="text-muted mb-0">No assignments posted for your courses.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Recent Materials & Announcements */}
          <div className="col-lg-4 d-flex flex-column gap-4">
            
            {/* Recent Course Materials */}
            <div className="cc-card p-4">
              <h3 className="h5 font-heading text-gold mb-3 d-flex align-items-center gap-2">
                <BookOpen size={20} /> Recent Study Materials
              </h3>
              
              {recentMaterials.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {recentMaterials.map((file) => (
                    <div key={file.id} className="d-flex align-items-center justify-content-between pb-3 border-bottom border-secondary border-opacity-20 last-border-none">
                      <div className="d-flex align-items-center gap-2" style={{ maxWidth: '75%' }}>
                        <FileText size={18} className="text-gold flex-shrink-0" />
                        <div className="truncate-text">
                          <p className="mb-0 text-light small fw-medium truncate-text" title={file.filename}>
                            {file.filename}
                          </p>
                          <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {file.category}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(file.latest_version?.id, file.filename)}
                        disabled={!file.latest_version?.id}
                        className="btn btn-sm btn-outline-primary p-2 d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px', borderRadius: '50%', padding: '0 !important' }}
                        title="Download Material"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <BookOpen size={24} className="text-muted opacity-50 mb-2" />
                  <p className="text-muted small mb-0">No study materials uploaded yet.</p>
                </div>
              )}
            </div>

            {/* Academic Announcements */}
            <div className="cc-card p-4">
              <h3 className="h5 font-heading text-gold mb-3 d-flex align-items-center gap-2">
                <Bell size={20} /> Academic Notices
              </h3>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                {announcements.map((ann, i) => (
                  <li key={i} className="pb-3 border-bottom border-secondary border-opacity-20 last-border-none">
                    <p className="mb-0 text-light opacity-90 small d-flex gap-2">
                      <ChevronRight size={14} className="text-gold flex-shrink-0 mt-1" />
                      <span>{ann}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* AI Study Assistant Float Widget */}
        <button
          onClick={() => setShowAIChat(!showAIChat)}
          className="ai-floating-btn"
          title="Open AI Companion"
        >
          {showAIChat ? <X size={26} /> : <Bot size={26} />}
        </button>

        {showAIChat && (
          <div className="ai-chat-panel">
            {/* Header */}
            <div className="ai-chat-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <Sparkles size={18} className="text-gold" />
                <div>
                  <h6 className="font-heading mb-0 text-light fw-bold" style={{ fontSize: '0.95rem' }}>AI Study Companion</h6>
                  <span className="text-success small d-flex align-items-center gap-1" style={{ fontSize: '0.65rem' }}>
                    <span className="d-inline-block rounded-circle bg-success" style={{ width: '6px', height: '6px' }}></span>
                    Online & Academic DB Synced
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowAIChat(false)}
                className="btn btn-link p-0 text-light opacity-75 hover-opacity-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Message History */}
            <div className="ai-chat-history" ref={chatHistoryRef}>
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`ai-message ${msg.sender === 'user' ? 'ai-message-user' : 'ai-message-bot'}`}
                >
                  {msg.sender === 'user' ? (
                    <div>{msg.text}</div>
                  ) : (
                    renderMessageContent(msg.text)
                  )}
                </div>
              ))}
              {sendingChat && (
                <div className="ai-message ai-message-bot d-flex align-items-center gap-2">
                  <span className="spinner-border spinner-border-sm text-gold" role="status"></span>
                  <span className="text-muted small">AI thinking...</span>
                </div>
              )}
            </div>

            {/* Quick Suggestions Chips */}
            <div className="px-3 py-2 border-top border-secondary border-opacity-10 d-flex gap-2 overflow-x-auto" style={{ background: 'rgba(7, 17, 30, 0.4)' }}>
              <button 
                onClick={() => handleSendSuggestion("🗓️ What class is next?")} 
                className="ai-chip"
                disabled={sendingChat}
              >
                Next Class?
              </button>
              <button 
                onClick={() => handleSendSuggestion("📝 What assignments are due?")} 
                className="ai-chip"
                disabled={sendingChat}
              >
                Due Tasks?
              </button>
              <button 
                onClick={() => handleSendSuggestion("📊 Summary of attendance")} 
                className="ai-chip"
                disabled={sendingChat}
              >
                Attendance?
              </button>
              <button 
                onClick={() => handleSendSuggestion("🎓 Calculate my GPA")} 
                className="ai-chip"
                disabled={sendingChat}
              >
                GPA?
              </button>
              <button 
                onClick={() => handleSendSuggestion("💡 Personal study tips")} 
                className="ai-chip"
                disabled={sendingChat}
              >
                Study Advice
              </button>
            </div>

            {/* Input Box */}
            <div className="ai-chat-input-area">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }} 
                className="d-flex gap-2 align-items-center"
              >
                <input
                  type="text"
                  className="form-control form-control-sm py-2 flex-grow-1"
                  placeholder="Ask about timetable, grades..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={sendingChat}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || sendingChat}
                  className="ai-send-btn"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ELSE IF STAFF: Render dedicated staff workspace
  if (isStaff) {
    const isRestricted = isPending || isRejected;

    // Filters for Upload History
    const filteredHistory = staffFiles
      .filter(f => f.uploader_id === user?.id)
      .filter(f => f.filename.toLowerCase().includes(historySearch.toLowerCase()) || 
                   (f.description && f.description.toLowerCase().includes(historySearch.toLowerCase())));

    // Helper to render active tab content
    const renderTabContent = () => {
      switch (staffTab) {
        case 'upload_center':
          return (
            <div className="cc-card p-4 animated-fade-in">
              <h3 className="h4 font-heading text-gold mb-3 d-flex align-items-center gap-2">
                <UploadCloud size={20} /> Academic Upload Center
              </h3>
              <p className="text-muted small mb-4">
                Upload syllabus copies, lecture notes, assignments, or study guides. Files uploaded by staff are auto-approved.
              </p>

              {uploadSuccess && <div className="alert alert-success py-2.5 px-3 mb-4 text-center">{uploadSuccess}</div>}
              {uploadError && <div className="alert alert-cc-error py-2.5 px-3 mb-4">{uploadError}</div>}

              <form onSubmit={handleFileUploadSubmit}>
                {/* Drag & Drop File Zone */}
                <div 
                  className={`mb-4 file-drag-zone d-flex flex-column align-items-center justify-content-center p-5 rounded border border-dashed border-secondary ${dragOver ? 'border-gold bg-navy-light' : 'opacity-90'}`}
                  style={{ 
                    cursor: isRestricted ? 'not-allowed' : 'pointer', 
                    transition: 'all 0.2s ease', 
                    backgroundColor: 'rgba(7, 17, 30, 0.3)' 
                  }}
                  onDragOver={isRestricted ? undefined : handleDragOver}
                  onDragLeave={isRestricted ? undefined : handleDragLeave}
                  onDrop={isRestricted ? undefined : handleDrop}
                  onClick={() => {
                    if (!isRestricted) {
                      document.getElementById('file-picker-input').click();
                    }
                  }}
                >
                  <input
                    type="file"
                    id="file-picker-input"
                    className="d-none"
                    disabled={isRestricted}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                  />
                  <UploadCloud size={48} className={`mb-3 ${dragOver ? 'text-gold' : 'text-muted'}`} />
                  {uploadFile ? (
                    <div className="text-center">
                      <p className="text-light fw-medium mb-1 small">{uploadFile.name}</p>
                      <span className="text-gold small">{formatBytes(uploadFile.size)}</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="mb-1 text-light opacity-90 small">
                        {isRestricted ? 'Upload center restricted' : 'Drag & drop file here, or click to browse'}
                      </p>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        PDF, DOCX, PPTX, ZIP, MP4, MP3 or TXT up to 50MB
                      </span>
                    </div>
                  )}
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label text-light opacity-95 small">Resource Category</label>
                    <select
                      className="form-control"
                      disabled={isRestricted}
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
                  <div className="col-md-6">
                    <label className="form-label text-light opacity-95 small">File Info</label>
                    <div className="form-control bg-navy-main border-secondary border-opacity-25 text-muted small py-2 d-flex align-items-center justify-content-between">
                      <span>Uploader: <strong>{user?.username}</strong></span>
                      <span className="badge bg-success">Auto-Approved</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-light opacity-95 small">Short Description</label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    disabled={isRestricted}
                    className="form-control"
                    placeholder="Provide context about what this file is for (syllabus, notes, etc.)"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                  />
                </div>

                <div className="d-flex justify-content-end">
                  <button
                    type="submit"
                    disabled={isRestricted || uploadingFile || !uploadFile}
                    className="btn btn-primary d-flex align-items-center gap-2 py-2 px-4"
                  >
                    {uploadingFile ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} /> Publish Resource
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          );

        case 'history':
          return (
            <div className="cc-card p-4 animated-fade-in">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                  <h3 className="h4 font-heading text-gold mb-1 d-flex align-items-center gap-2">
                    <History size={20} /> Personal Upload History
                  </h3>
                  <p className="text-muted small mb-0">Manage materials and post version updates.</p>
                </div>
                <div className="position-relative" style={{ maxWidth: '280px' }}>
                  <input
                    type="text"
                    className="form-control form-control-sm py-2 ps-4"
                    placeholder="Search history..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                  <Clock className="position-absolute top-50 start-2.5 translate-middle text-muted" size={14} style={{ left: '15px' }} />
                </div>
              </div>

              {loadingHistory ? (
                <div className="text-center py-5">
                  <span className="spinner-border text-gold" role="status"></span>
                </div>
              ) : filteredHistory.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-dark table-borderless align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                    <thead>
                      <tr className="border-bottom border-secondary border-opacity-35 text-muted" style={{ fontSize: '0.85rem' }}>
                        <th className="pb-3" style={{ background: 'transparent' }}>File Name</th>
                        <th className="pb-3" style={{ background: 'transparent' }}>Category</th>
                        <th className="pb-3" style={{ background: 'transparent' }}>Uploaded Date</th>
                        <th className="pb-3" style={{ background: 'transparent' }}>Size</th>
                        <th className="pb-3" style={{ background: 'transparent' }}>Version</th>
                        <th className="pb-3 text-end" style={{ background: 'transparent' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((file) => (
                        <tr key={file.id} className="border-bottom border-secondary border-opacity-10">
                          <td className="py-3" style={{ background: 'transparent' }}>
                            <div className="d-flex align-items-center gap-2">
                              {getFileTypeIcon(file.file_type)}
                              <div>
                                <span className="text-light fw-medium small d-block">{file.filename}</span>
                                {file.description && <span className="text-muted small opacity-75" style={{ fontSize: '0.75rem' }}>{file.description}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 small text-gold fw-medium" style={{ background: 'transparent' }}>{file.category}</td>
                          <td className="py-3 text-muted small" style={{ background: 'transparent' }}>
                            {file.created_at ? new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="py-3 text-muted small" style={{ background: 'transparent' }}>
                            {file.latest_version?.file_size ? formatBytes(file.latest_version.file_size) : 'N/A'}
                          </td>
                          <td className="py-3" style={{ background: 'transparent' }}>
                            <span className="badge bg-secondary small">v{file.versions_count}</span>
                          </td>
                          <td className="py-3 text-end" style={{ background: 'transparent' }}>
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                onClick={() => handleDownloadFile(file.latest_version?.id, file.filename)}
                                disabled={!file.latest_version?.id}
                                className="btn btn-sm btn-outline-primary p-2"
                                title="Download Material"
                                style={{ borderRadius: '50%', width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Download size={14} />
                              </button>
                              <button
                                onClick={() => openVersionModal(file.id)}
                                disabled={isRestricted}
                                className="btn btn-sm btn-outline-gold p-2"
                                title="Upload New Version"
                                style={{ borderRadius: '50%', width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderColor: 'var(--cc-gold-metallic)', color: 'var(--cc-gold-metallic)' }}
                              >
                                <RefreshCw size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5 border border-dashed rounded border-secondary border-opacity-35">
                  <History size={40} className="text-muted opacity-50 mb-2" />
                  <p className="text-muted mb-0">No upload history records found matching your query.</p>
                </div>
              )}
            </div>
          );

        case 'approvals':
          return (
            <div className="cc-card p-4 animated-fade-in">
              <h3 className="h4 font-heading text-gold mb-2 d-flex align-items-center gap-2">
                <FileCheck size={20} /> Pending Approvals Queue
              </h3>
              <p className="text-muted small mb-4">Moderate resources uploaded by students and campus club leaders.</p>

              {loadingPending ? (
                <div className="text-center py-5">
                  <span className="spinner-border text-gold" role="status"></span>
                </div>
              ) : pendingFiles.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-dark table-borderless align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                    <thead>
                      <tr className="border-bottom border-secondary border-opacity-35 text-muted" style={{ fontSize: '0.85rem' }}>
                        <th className="pb-3" style={{ background: 'transparent' }}>Uploader</th>
                        <th className="pb-3" style={{ background: 'transparent' }}>File Details</th>
                        <th className="pb-3" style={{ background: 'transparent' }}>Category</th>
                        <th className="pb-3" style={{ background: 'transparent' }}>Size</th>
                        <th className="pb-3" style={{ background: 'transparent' }}>Date</th>
                        <th className="pb-3 text-end" style={{ background: 'transparent' }}>Moderate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingFiles.map((file) => (
                        <tr key={file.id} className="border-bottom border-secondary border-opacity-10">
                          <td className="py-3 text-gold fw-medium small" style={{ background: 'transparent' }}>
                            {file.uploader_name}
                          </td>
                          <td className="py-3" style={{ background: 'transparent' }}>
                            <div className="d-flex align-items-center gap-2">
                              {getFileTypeIcon(file.file_type)}
                              <div>
                                <span className="text-light fw-medium small d-block">{file.filename}</span>
                                {file.description && <span className="text-muted small opacity-75 d-block" style={{ fontSize: '0.75rem' }}>{file.description}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 small" style={{ background: 'transparent' }}>{file.category}</td>
                          <td className="py-3 text-muted small" style={{ background: 'transparent' }}>
                            {file.latest_version?.file_size ? formatBytes(file.latest_version.file_size) : 'N/A'}
                          </td>
                          <td className="py-3 text-muted small" style={{ background: 'transparent' }}>
                            {file.created_at ? new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="py-3 text-end" style={{ background: 'transparent' }}>
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                onClick={() => handleApproveFile(file.id)}
                                disabled={isRestricted}
                                className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 py-1.5 px-3"
                                title="Approve Upload"
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                onClick={() => openRejectModal(file.id)}
                                disabled={isRestricted}
                                className="btn btn-sm btn-danger d-inline-flex align-items-center gap-1 py-1.5 px-3"
                                title="Reject Upload"
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
              ) : (
                <div className="text-center py-5 border border-dashed rounded border-success border-opacity-35">
                  <Check size={40} className="text-success mb-2 opacity-50" />
                  <p className="text-success fw-medium mb-1">Queue is Clear!</p>
                  <p className="text-muted small mb-0">No resources require approval at this time.</p>
                </div>
              )}
            </div>
          );

        case 'analytics':
          return (
            <div className="animated-fade-in">
              {loadingAnalytics || !analyticsData ? (
                <div className="cc-card p-5 text-center">
                  <span className="spinner-border text-gold" role="status"></span>
                </div>
              ) : (
                <div>
                  {/* Summary Cards */}
                  <div className="row g-4 mb-4">
                    <div className="col-md-3 col-6">
                      <div className="dashboard-card p-4 h-100" style={{ borderLeft: '3px solid var(--cc-gold-metallic)' }}>
                        <span className="text-muted small uppercase fw-medium d-block mb-1">Total Files</span>
                        <h3 className="font-heading text-light mb-0">{analyticsData.total_files}</h3>
                        <span className="text-muted small" style={{ fontSize: '0.7rem' }}>All formats combined</span>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="dashboard-card p-4 h-100" style={{ borderLeft: '3px solid #E74C3C' }}>
                        <span className="text-muted small uppercase fw-medium d-block mb-1">Pending Review</span>
                        <h3 className="font-heading text-light mb-0">{analyticsData.pending_files}</h3>
                        <span className="text-danger small" style={{ fontSize: '0.7rem' }}>Moderation queue</span>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="dashboard-card p-4 h-100" style={{ borderLeft: '3px solid #2ECC71' }}>
                        <span className="text-muted small uppercase fw-medium d-block mb-1">Approved Files</span>
                        <h3 className="font-heading text-light mb-0">{analyticsData.approved_files}</h3>
                        <span className="text-success small" style={{ fontSize: '0.7rem' }}>Available to students</span>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="dashboard-card p-4 h-100" style={{ borderLeft: '3px solid #9B59B6' }}>
                        <span className="text-muted small uppercase fw-medium d-block mb-1">Total Storage</span>
                        <h3 className="font-heading text-light mb-0">{formatBytes(analyticsData.total_bytes)}</h3>
                        <span className="text-muted small" style={{ fontSize: '0.7rem' }}>Storage space occupied</span>
                      </div>
                    </div>
                  </div>

                  {/* Graphs Section */}
                  <div className="row g-4 mb-4">
                    {/* Category Distribution */}
                    <div className="col-md-6">
                      <div className="cc-card p-4 h-100">
                        <h4 className="h5 font-heading text-gold mb-4 d-flex align-items-center gap-2">
                          <BarChart2 size={18} /> Category Distribution
                        </h4>
                        <div className="d-flex flex-column gap-3">
                          {Object.entries(analyticsData.categories || {}).map(([cat, count]) => {
                            const pct = analyticsData.total_files > 0 
                              ? Math.round((count / analyticsData.total_files) * 100) 
                              : 0;
                            return (
                              <div key={cat}>
                                <div className="d-flex justify-content-between mb-1 text-light small">
                                  <span>{cat}</span>
                                  <span>{count} files ({pct}%)</span>
                                </div>
                                <div className="progress" style={{ height: '8px', backgroundColor: 'var(--cc-navy-main)' }}>
                                  <div 
                                    className="progress-bar bg-gold" 
                                    style={{ width: `${pct}%`, borderRadius: '4px', backgroundColor: 'var(--cc-gold-metallic)' }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* File Types Grid */}
                    <div className="col-md-6">
                      <div className="cc-card p-4 h-100">
                        <h4 className="h5 font-heading text-gold mb-4 d-flex align-items-center gap-2">
                          <HardDrive size={18} /> File Formats
                        </h4>
                        
                        {Object.keys(analyticsData.file_types || {}).length > 0 ? (
                          <div className="row g-3">
                            {Object.entries(analyticsData.file_types || {}).map(([type, count]) => (
                              <div className="col-6 col-sm-4" key={type}>
                                <div className="p-3 rounded text-center border border-secondary border-opacity-15 bg-navy-main">
                                  <div className="d-flex justify-content-center mb-1">
                                    {getFileTypeIcon(type)}
                                  </div>
                                  <span className="text-light fw-medium d-block small mt-1">{type}</span>
                                  <span className="text-gold fw-bold mt-1" style={{ fontSize: '1.1rem' }}>{count}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <span className="text-muted small">No file formats logged.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Log */}
                  <div className="cc-card p-4">
                    <h4 className="h5 font-heading text-gold mb-4 d-flex align-items-center gap-2">
                      <Clock size={18} /> Recent Upload Activity Log
                    </h4>
                    {analyticsData.recent_activities && analyticsData.recent_activities.length > 0 ? (
                      <div className="d-flex flex-column gap-3">
                        {analyticsData.recent_activities.map((act, i) => {
                          const isApproved = act.status === 'approved';
                          const isRejected = act.status === 'rejected';
                          
                          let statusBadge = <span className="badge bg-warning text-dark">Pending</span>;
                          if (isApproved) statusBadge = <span className="badge bg-success">Approved</span>;
                          if (isRejected) statusBadge = <span className="badge bg-danger">Rejected</span>;

                          return (
                            <div key={i} className="d-flex align-items-center justify-content-between pb-3 border-bottom border-secondary border-opacity-15 last-border-none">
                              <div className="d-flex align-items-center gap-2">
                                <File size={16} className="text-gold" />
                                <div>
                                  <span className="text-light fw-medium small d-block">{act.filename}</span>
                                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    Uploaded by <strong>{act.uploader_name}</strong> in category <strong>{act.category}</strong>
                                  </span>
                                </div>
                              </div>
                              <div>
                                {statusBadge}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted small text-center mb-0 py-3">No activity logs recorded.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="container py-5 animated-fade-in">
        {/* Verification Warning Banners */}
        {isPending && (
          <div className="alert alert-cc py-3 px-4 mb-4 d-flex align-items-center gap-3">
            <AlertCircle size={28} className="text-gold flex-shrink-0" />
            <div>
              <h5 className="font-heading fw-bold mb-1 text-gold">Registration Pending Verification</h5>
              <p className="mb-0 text-light opacity-90 small">
                Your staff account is currently pending administrator verification. Content uploads, approvals, and posts are restricted until your account is approved.
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
                Your staff verification request has been rejected by the administrator. You cannot post or moderate content. Please contact administrative support.
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Welcome Header */}
        <div className="cc-card p-4 mb-4 animate-fade-in" style={{ position: 'relative', overflow: 'hidden', borderLeft: '4px solid var(--cc-gold-metallic)' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="p-3 rounded bg-navy-light text-gold">
              <UploadCloud size={40} />
            </div>
            <div>
              <h2 className="font-heading mb-1 text-gold">Staff Control Center</h2>
              <p className="text-light opacity-75 mb-0 small">
                Manage upload center, moderate student requests, and track academic resource distribution.
              </p>
            </div>
          </div>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05, transform: 'scale(1.3)' }}>
            <HardDrive size={150} />
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="d-flex flex-wrap gap-2 mb-4 p-1 rounded border" style={{ backgroundColor: 'var(--cc-navy-main)', borderColor: 'var(--cc-navy-light)' }}>
          <button
            onClick={() => setStaffTab('upload_center')}
            className={`btn flex-fill py-2.5 px-4 font-heading small d-flex align-items-center justify-content-center gap-2 border-0 ${staffTab === 'upload_center' ? 'btn-primary text-light animate-pulse' : 'text-light opacity-75'}`}
            style={staffTab !== 'upload_center' ? { background: 'transparent', boxShadow: 'none' } : {}}
          >
            <UploadCloud size={16} /> Upload Center
          </button>
          <button
            onClick={() => setStaffTab('history')}
            className={`btn flex-fill py-2.5 px-4 font-heading small d-flex align-items-center justify-content-center gap-2 border-0 ${staffTab === 'history' ? 'btn-primary text-light animate-pulse' : 'text-light opacity-75'}`}
            style={staffTab !== 'history' ? { background: 'transparent', boxShadow: 'none' } : {}}
          >
            <History size={16} /> Upload History
          </button>
          <button
            onClick={() => setStaffTab('approvals')}
            className={`btn flex-fill py-2.5 px-4 font-heading small d-flex align-items-center justify-content-center gap-2 border-0 position-relative ${staffTab === 'approvals' ? 'btn-primary text-light animate-pulse' : 'text-light opacity-75'}`}
            style={staffTab !== 'approvals' ? { background: 'transparent', boxShadow: 'none' } : {}}
          >
            <FileCheck size={16} /> Pending Approvals
            {pendingFiles.length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ zIndex: 10, fontSize: '0.7rem' }}>
                {pendingFiles.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setStaffTab('analytics')}
            className={`btn flex-fill py-2.5 px-4 font-heading small d-flex align-items-center justify-content-center gap-2 border-0 ${staffTab === 'analytics' ? 'btn-primary text-light animate-pulse' : 'text-light opacity-75'}`}
            style={staffTab !== 'analytics' ? { background: 'transparent', boxShadow: 'none' } : {}}
          >
            <BarChart2 size={16} /> Analytics
          </button>
        </div>

        {/* Tab Panel Content */}
        {renderTabContent()}

        {/* Reject Rejection Reason Modal overlay */}
        {showRejectModal && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center shadow-lg" style={{ backgroundColor: 'rgba(7, 17, 30, 0.85)', zIndex: 1050, backdropFilter: 'blur(6px)' }}>
            <div className="cc-card w-100 m-3 p-4" style={{ maxWidth: '450px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="font-heading text-gold mb-0 d-flex align-items-center gap-2">
                  <ShieldAlert className="text-danger" size={20} /> Reject File Request
                </h4>
                <button onClick={() => setShowRejectModal(false)} className="btn btn-link p-0 text-light opacity-75 hover-opacity-100">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleRejectSubmit}>
                <div className="mb-4">
                  <label className="form-label text-light opacity-95 small">Reason for Rejection</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    required
                    placeholder="Provide details about why this student file upload is being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                <div className="d-flex gap-2 justify-content-end">
                  <button type="button" onClick={() => setShowRejectModal(false)} className="btn btn-outline-primary">Cancel</button>
                  <button type="submit" className="btn btn-danger d-flex align-items-center gap-1" disabled={moderating}>
                    {moderating ? 'Rejecting...' : 'Reject File'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload New Version Modal overlay */}
        {showVersionModal && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center shadow-lg" style={{ backgroundColor: 'rgba(7, 17, 30, 0.85)', zIndex: 1050, backdropFilter: 'blur(6px)' }}>
            <div className="cc-card w-100 m-3 p-4 animate-fade-in" style={{ maxWidth: '480px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="font-heading text-gold mb-0 d-flex align-items-center gap-2">
                  <RefreshCw size={18} /> Upload New File Version
                </h4>
                <button onClick={() => setShowVersionModal(false)} className="btn btn-link p-0 text-light opacity-75 hover-opacity-100" disabled={uploadingVersion}>
                  <X size={20} />
                </button>
              </div>
              
              {versionSuccess && <div className="alert alert-success py-2 px-3 mb-3 text-center">{versionSuccess}</div>}
              {versionError && <div className="alert alert-cc-error py-2 px-3 mb-3">{versionError}</div>}
              
              <form onSubmit={handleNewVersionSubmit}>
                <div className="mb-3">
                  <label className="form-label text-light opacity-95 small">Select Updated File</label>
                  <input
                    type="file"
                    required
                    disabled={uploadingVersion}
                    className="form-control"
                    onChange={(e) => setVersionFile(e.target.files[0])}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label text-light opacity-95 small">Changelog / Release Notes</label>
                  <input
                    type="text"
                    disabled={uploadingVersion}
                    className="form-control"
                    placeholder="e.g. Updated slide deck, added page 14 solutions"
                    value={versionChangelog}
                    onChange={(e) => setVersionChangelog(e.target.value)}
                  />
                </div>
                <div className="d-flex gap-2 justify-content-end">
                  <button type="button" onClick={() => setShowVersionModal(false)} className="btn btn-outline-primary" disabled={uploadingVersion}>Cancel</button>
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-1" disabled={uploadingVersion || !versionFile}>
                    {uploadingVersion ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Uploading...
                      </>
                    ) : 'Upload Version'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ELSE: Original Live Feed & Content upload dashboard (for Staff/Admins)
  const feedItems = data?.feed || [
    { id: 1, title: 'Orientation Week Meetup', category: 'Events', date: 'Aug 5, 2026', author: 'Alumni Association' },
    { id: 2, title: 'Introduction to Web Dev Workshop', category: 'Clubs', date: 'Aug 8, 2026', author: 'Computer Science Club' },
    { id: 3, title: 'Textbook Exchange - CS101 & EE202', category: 'Marketplace', date: 'Aug 10, 2026', author: 'Sarah Jenkins' },
  ];

  const announcements = data?.announcements || [
    'Main Library will be closed on Sunday for maintenance.',
    'Enrollment for Fall Semester ends in 3 days.',
  ];

  return (
    <div className="container py-5 animated-fade-in">
      {/* Verification Warning Banners */}
      {isStaff && isPending && (
        <div className="alert alert-cc py-3 px-4 mb-4 d-flex align-items-center gap-3">
          <AlertCircle size={28} className="text-gold flex-shrink-0" />
          <div>
            <h5 className="font-heading fw-bold mb-1 text-gold">Registration Pending Verification</h5>
            <p className="mb-0 text-light opacity-90 small">
              Your staff account is currently pending administrator verification. Content uploads, announcements, and posts are restricted until your account is approved.
            </p>
          </div>
        </div>
      )}

      {isStaff && isRejected && (
        <div className="alert alert-cc-error py-3 px-4 mb-4 d-flex align-items-center gap-3">
          <AlertCircle size={28} className="text-danger flex-shrink-0" />
          <div>
            <h5 className="font-heading fw-bold mb-1 text-danger">Verification Rejected</h5>
            <p className="mb-0 text-light opacity-90 small">
              Your staff verification request has been rejected by the administrator. You cannot post or upload content on the portal. Please contact administrative support.
            </p>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Left Side: Overview and Announcements */}
        <div className="col-lg-8">
          <div className="cc-card mb-4 p-4">
            <h2 className="font-heading mb-2 text-gold">Welcome back, {user?.full_name || user?.username || 'User'}!</h2>
            <p className="text-light opacity-75 mb-0">
              Here is what has been happening on campus since your last visit.
            </p>
          </div>

          <h3 className="font-heading mb-4 text-gold d-flex align-items-center gap-2">
            <Radio size={24} /> Live Campus Feed
          </h3>

          {error && (
            <div className="alert alert-cc py-2 px-3 mb-4 d-flex align-items-center gap-2">
              <AlertCircle size={16} />
              <span>Offline Mode: Displaying mock updates. ({error})</span>
            </div>
          )}

          <div className="d-flex flex-column gap-3">
            {feedItems.map((item) => (
              <div key={item.id} className="dashboard-card p-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="badge bg-gold text-dark font-heading fw-bold px-2 py-1" style={{ fontSize: '0.75rem', backgroundColor: 'var(--cc-gold-metallic)' }}>
                    {item.category}
                  </span>
                  <small className="text-muted">{item.date}</small>
                </div>
                <h4 className="h5 font-heading text-light mb-2">{item.title}</h4>
                {item.content && <p className="text-light opacity-75 small mb-3">{item.content}</p>}
                {item.price !== null && item.price !== undefined && (
                  <div className="mb-2">
                    <span className="text-gold fw-bold">Price: ${item.price.toFixed(2)}</span>
                  </div>
                )}
                <p className="text-muted small mb-0">Posted by <span className="text-gold">{item.author}</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Quick Links, Actions or Sidebar announcements */}
        <div className="col-lg-4">
          {/* Quick Upload / Post Action */}
          <div className="cc-card mb-4 p-4" style={{ borderTop: '2px solid var(--cc-gold-metallic)' }}>
            <h3 className="h5 font-heading mb-3 d-flex align-items-center gap-2 text-gold">
              <Plus size={20} /> Publish Content
            </h3>
            <p className="text-muted small mb-3">Share a text post, school announcement, or campus event with others.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={isStaff && (isPending || isRejected)}
              className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
            >
              <Plus size={16} /> Share New Content
            </button>
            {isStaff && (isPending || isRejected) && (
              <p className="text-danger small mt-2 mb-0 text-center fw-medium">
                {isPending ? 'Awaiting Admin Approval' : 'Verification Rejected'}
              </p>
            )}
          </div>

          {/* Announcements Card */}
          <div className="cc-card mb-4 p-4">
            <h3 className="h5 font-heading mb-3 d-flex align-items-center gap-2 text-gold">
              <Bell size={20} /> Announcements
            </h3>
            <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
              {announcements.map((ann, i) => (
                <li key={i} className="pb-3 border-bottom border-secondary last-border-none">
                  <p className="mb-0 text-light opacity-90 small">{ann}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Actions Card */}
          <div className="cc-card p-4">
            <h3 className="h5 font-heading mb-3 d-flex align-items-center gap-2 text-gold">
              <Compass size={20} /> Navigation Shortcuts
            </h3>
            <div className="d-flex flex-column gap-2">
              <button className="btn btn-outline-primary btn-sm text-start py-2 d-flex align-items-center gap-2">
                <Calendar size={16} className="text-gold" /> Check Events Calendar
              </button>
              <button className="btn btn-outline-primary btn-sm text-start py-2 d-flex align-items-center gap-2">
                <Users size={16} className="text-gold" /> Join Campus Club
              </button>
              <button className="btn btn-outline-primary btn-sm text-start py-2 d-flex align-items-center gap-2">
                <MessageSquare size={16} className="text-gold" /> Discussion Forum
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Creation Modal overlay */}
      {showCreateModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(7, 17, 30, 0.85)', zIndex: 1050, backdropFilter: 'blur(6px)' }}>
          <div className="cc-card w-100 m-3 p-4" style={{ maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="h4 font-heading text-gold mb-0">Create Content</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-link p-0 text-light opacity-75 hover-opacity-100">
                <X size={24} />
              </button>
            </div>

            {successMessage && (
              <div className="alert alert-success py-2 px-3 mb-3 text-center">
                {successMessage}
              </div>
            )}

            {submitError && (
              <div className="alert alert-cc-error py-2 px-3 mb-3">
                {submitError}
              </div>
            )}

            {/* Type selector */}
            <div className="mb-4">
              <label className="form-label">Select Content Type</label>
              <div className="d-flex gap-2 p-1 rounded border" style={{ backgroundColor: 'var(--cc-navy-main)', borderColor: 'var(--cc-navy-light)' }}>
                <button
                  type="button"
                  onClick={() => { setContentType('post'); setSubmitError(null); }}
                  className={`btn btn-sm flex-fill py-1 ${contentType === 'post' ? 'btn-primary' : 'text-light opacity-75'}`}
                  style={contentType !== 'post' ? { background: 'transparent', boxShadow: 'none' } : {}}
                >
                  Feed Post
                </button>
                {/* Announcements restricted to staff or admin roles */}
                {(user?.role === 'staff' || user?.role === 'admin') && (
                  <button
                    type="button"
                    onClick={() => { setContentType('announcement'); setSubmitError(null); }}
                    className={`btn btn-sm flex-fill py-1 ${contentType === 'announcement' ? 'btn-primary' : 'text-light opacity-75'}`}
                    style={contentType !== 'announcement' ? { background: 'transparent', boxShadow: 'none' } : {}}
                  >
                    Announcement
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setContentType('event'); setSubmitError(null); }}
                  className={`btn btn-sm flex-fill py-1 ${contentType === 'event' ? 'btn-primary' : 'text-light opacity-75'}`}
                  style={contentType !== 'event' ? { background: 'transparent', boxShadow: 'none' } : {}}
                >
                  Campus Event
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitContent}>
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Help needed with CS projects or Hackathon details"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {contentType === 'post' && (
                <div className="row g-3 mb-3">
                  <div className="col-md-7">
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Discussions">Discussions</option>
                      <option value="Clubs">Clubs</option>
                      <option value="Events">Events</option>
                      <option value="Volunteer">Volunteer</option>
                      <option value="Marketplace">Marketplace</option>
                    </select>
                  </div>
                  {category === 'Marketplace' && (
                    <div className="col-md-5">
                      <label className="form-label">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="form-control"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {contentType === 'event' && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. Tech Hall Room 402"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Event Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-control"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>
                  <div className="mb-4 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input border-secondary"
                      id="volCheckbox"
                      checked={volunteerNeeded}
                      onChange={(e) => setVolunteerNeeded(e.target.checked)}
                      style={{ backgroundColor: 'var(--cc-navy-main)' }}
                    />
                    <label className="form-check-label text-light opacity-90 small" htmlFor="volCheckbox">
                      Volunteers needed for this event
                    </label>
                  </div>
                </>
              )}

              <div className="mb-4">
                <label className="form-label">
                  {contentType === 'event' ? 'Event Description' : 'Content / Message'}
                </label>
                <textarea
                  required
                  rows={4}
                  className="form-control"
                  placeholder="Share details here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary d-flex align-items-center gap-2"
                >
                  {submitting ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : 'Publish Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
