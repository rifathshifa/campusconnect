import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  MessageSquare, Sparkles, FileText, Code, GraduationCap, 
  Award, Send, Copy, Download, Key, Info, Loader2, 
  X, RotateCcw, AlertTriangle, User, Bot, 
  FileUp, CheckCircle, ChevronRight
} from 'lucide-react';

const StudyAssistant = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // State: Selected Tab
  const [activeTab, setActiveTab] = useState('chat'); // chat, notes, pdf, code, quiz, interview

  // State: User Gemini API Key (stored in localStorage)
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Toast Notification handler
  const showNotification = (message, type = 'success') => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else if (type === 'warning') toast.warning(message);
    else toast.info(message);
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      showNotification('Gemini API Key saved locally for this browser session!');
      setShowKeyInput(false);
    } else {
      localStorage.removeItem('gemini_api_key');
      showNotification('Custom API Key cleared. Backend default will be used.', 'info');
      setShowKeyInput(false);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    showNotification('Gemini API Key removed.', 'info');
  };

  // Helper for Headers
  const getHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    const localKey = localStorage.getItem('gemini_api_key');
    if (localKey) {
      headers['X-Gemini-API-Key'] = localKey.trim();
    }
    return headers;
  };

  // ==========================================
  // TAB 1: STUDY CHAT BUDDY
  // ==========================================
  const [chatMessages, setChatMessages] = useState([
    { 
      sender: 'bot', 
      text: `Hello ${user?.full_name || user?.username}! I'm your AI Study Buddy. Ask me to explain concepts, check your timetable, list upcoming assignments, or suggest study strategies!` 
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatHistoryRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatMessages, sendingChat]);

  const handleSendChat = async (textToSend) => {
    const messageText = textToSend || chatInput;
    if (!messageText.trim() || sendingChat) return;

    setChatMessages(prev => [...prev, { sender: 'user', text: messageText }]);
    if (!textToSend) setChatInput('');
    setSendingChat(true);

    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: messageText })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { sender: 'bot', text: data.response }]);
      } else {
        throw new Error(data.message || 'Error communicating with Study Buddy.');
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: `⚠️ Error: ${err.message}` }]);
    } finally {
      setSendingChat(false);
    }
  };

  // Direct injection prompts
  const handleInjectContext = async (type) => {
    if (sendingChat) return;
    setSendingChat(true);
    let prompt = '';
    
    if (type === 'timetable') {
      prompt = "Can you review my class timetable and give me advice on scheduling my daily study blocks?";
    } else if (type === 'assignments') {
      prompt = "Which of my pending assignments should I prioritize, and how do I tackle them?";
    } else if (type === 'attendance') {
      prompt = "Can you summarize my attendance status and let me know if I need to improve anywhere?";
    }

    setChatMessages(prev => [...prev, { sender: 'user', text: prompt }]);
    
    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: prompt })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { sender: 'bot', text: data.response }]);
      } else {
        throw new Error(data.message || 'Failed to fetch contextual review.');
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: `⚠️ Error: ${err.message}` }]);
    } finally {
      setSendingChat(false);
    }
  };


  // ==========================================
  // TAB 2: NOTES GENERATOR
  // ==========================================
  const [notesTopic, setNotesTopic] = useState('');
  const [notesSubject, setNotesSubject] = useState('');
  const [notesTone, setNotesTone] = useState('Academic');
  const [notesFocus, setNotesFocus] = useState('');
  const [notesOutput, setNotesOutput] = useState('');
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [notesFontSize, setNotesFontSize] = useState(16);

  const handleGenerateNotes = async (e) => {
    e.preventDefault();
    if (!notesTopic.trim()) return;

    setGeneratingNotes(true);
    setNotesOutput('');

    try {
      const res = await fetch(`${API_URL}/ai/notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          topic: notesTopic,
          subject: notesSubject || 'General',
          tone: notesTone,
          focus: notesFocus
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNotesOutput(data.notes);
        showNotification('Notes generated successfully!');
      } else {
        throw new Error(data.message || 'Failed to generate notes.');
      }
    } catch (err) {
      setNotesOutput(`### ⚠️ Error generating notes\n\n${err.message}`);
    } finally {
      setGeneratingNotes(false);
    }
  };

  const handleCopyNotes = () => {
    if (!notesOutput) return;
    navigator.clipboard.writeText(notesOutput);
    showNotification('Notes copied to clipboard!');
  };

  const handleDownloadNotes = () => {
    if (!notesOutput) return;
    const element = document.createElement("a");
    const file = new Blob([notesOutput], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${notesTopic.toLowerCase().replace(/\s+/g, '_')}_notes.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification('Notes downloaded as markdown (.md)');
  };


  // ==========================================
  // TAB 3: PDF SUMMARIZER & FLASHCARDS
  // ==========================================
  const [approvedFiles, setApprovedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [summarizingPdf, setSummarizingPdf] = useState(false);
  
  // Summary outputs
  const [pdfSummary, setPdfSummary] = useState('');
  const [pdfTakeaways, setPdfTakeaways] = useState([]);
  const [pdfFlashcards, setPdfFlashcards] = useState([]);
  
  // Flashcard controls
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [cardScores, setCardScores] = useState({}); // { cardIdx: 'easy' | 'review' }

  // PDF direct upload states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Academic');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Load user files list
  const fetchUserFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch(`${API_URL}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        // filter for PDF files only
        const pdfs = data.files.filter(f => f.file_type === 'PDF');
        setApprovedFiles(pdfs);
      }
    } catch (err) {
      console.error("Error loading files list:", err);
    } finally {
      setLoadingFiles(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    if (activeTab === 'pdf') {
      fetchUserFiles();
    }
  }, [activeTab, fetchUserFiles]);

  // Handle summarization
  const handleSummarizePdf = async (fileId) => {
    const idToUse = fileId || selectedFileId;
    if (!idToUse) return;

    setSummarizingPdf(true);
    setPdfSummary('');
    setPdfTakeaways([]);
    setPdfFlashcards([]);
    setCurrentCardIdx(0);
    setIsCardFlipped(false);
    setCardScores({});

    try {
      const res = await fetch(`${API_URL}/ai/summarize-pdf`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ file_id: parseInt(idToUse) })
      });
      const data = await res.json();
      if (res.ok) {
        setPdfSummary(data.summary || '');
        setPdfTakeaways(data.takeaways || []);
        setPdfFlashcards(data.flashcards || []);
        showNotification('PDF Summarized & Flashcards created!');
      } else {
        throw new Error(data.message || 'Summarization failed.');
      }
    } catch (err) {
      showNotification(`Summarization failed: ${err.message}`, 'error');
    } finally {
      setSummarizingPdf(false);
    }
  };

  // Direct PDF Upload & Summarize Flow
  const handleDirectUploadPdf = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('description', uploadDescription || 'Uploaded via AI Assistant');
    formData.append('category', uploadCategory);

    try {
      const res = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('File uploaded successfully! Running summary...');
        setUploadFile(null);
        setUploadDescription('');
        await fetchUserFiles();
        // Trigger summary automatically
        setSelectedFileId(data.file.id.toString());
        await handleSummarizePdf(data.file.id);
      } else {
        throw new Error(data.message || 'Upload failed.');
      }
    } catch (err) {
      showNotification(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleScoreCard = (status) => {
    setCardScores(prev => ({ ...prev, [currentCardIdx]: status }));
    // Auto advance to next card after brief delay
    if (currentCardIdx < pdfFlashcards.length - 1) {
      setTimeout(() => {
        setIsCardFlipped(false);
        setCurrentCardIdx(prev => prev + 1);
      }, 300);
    } else {
      showNotification('Quiz finished for all flashcards!');
    }
  };


  // ==========================================
  // TAB 4: PROGRAMMING MENTOR
  // ==========================================
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('Python');
  const [codeMode, setCodeMode] = useState('Explain'); // Explain, Debug, Optimize, Refactor
  const [codeOutput, setCodeOutput] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  const handleGenerateCodeHelp = async (e) => {
    e.preventDefault();
    if (!codeSnippet.trim()) return;

    setGeneratingCode(true);
    setCodeOutput('');

    const prompt = `You are a Senior Coding Mentor. Please help me with the following task:\n` +
      `Language: ${codeLanguage}\n` +
      `Request Mode: ${codeMode} Code\n` +
      `Code Snippet:\n\`\`\`${codeLanguage.toLowerCase()}\n${codeSnippet}\n\`\`\`\n` +
      `Provide a detailed, helpful response in Markdown. Include debugging explanations, performance analyses, or revised codes with clear headers.`;

    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: prompt })
      });
      const data = await res.json();
      if (res.ok) {
        setCodeOutput(data.response);
        showNotification('Analysis completed!');
      } else {
        throw new Error(data.message || 'Code mentoring failed.');
      }
    } catch (err) {
      setCodeOutput(`### ⚠️ Mentor Connection Error\n\n${err.message}`);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyCodeOutput = () => {
    if (!codeOutput) return;
    navigator.clipboard.writeText(codeOutput);
    showNotification('Code output copied!');
  };


  // ==========================================
  // TAB 5: QUIZ STUDIO
  // ==========================================
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState('Medium');
  const [quizType, setQuizType] = useState('mcq'); // mcq or tf
  const [quizNum, setQuizNum] = useState(3);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({}); // { questionIdx: optionIdx }
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!quizTopic.trim()) return;

    setGeneratingQuiz(true);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);

    try {
      const res = await fetch(`${API_URL}/ai/quiz`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          topic: quizTopic,
          num_questions: quizNum,
          difficulty: quizDifficulty,
          quiz_type: quizType
        })
      });
      const data = await res.json();
      if (res.ok) {
        setQuizQuestions(data.questions || []);
        showNotification('Quiz created! Good luck!');
      } else {
        throw new Error(data.message || 'Failed to create quiz.');
      }
    } catch (err) {
      showNotification(`Quiz generation error: ${err.message}`, 'error');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSelectQuizAnswer = (qIdx, optIdx) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitQuiz = () => {
    if (quizSubmitted || quizQuestions.length === 0) return;
    
    let correctCount = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct_index) {
        correctCount++;
      }
    });

    setQuizScore(correctCount);
    setQuizSubmitted(true);
    showNotification(`Quiz completed! Score: ${correctCount}/${quizQuestions.length}`);
  };


  // ==========================================
  // TAB 6: MOCK INTERVIEW PREP
  // ==========================================
  const [interviewRole, setInterviewRole] = useState('Software Engineer');
  const [interviewType, setInterviewType] = useState('Technical');
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [activeInterviewIdx, setActiveInterviewIdx] = useState(0);
  const [interviewAnswer, setInterviewAnswer] = useState('');
  const [interviewFeedbacks, setInterviewFeedbacks] = useState({}); // { qIdx: {grade, feedback, sample_answer} }
  const [generatingInterview, setGeneratingInterview] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const handleStartInterview = async (e) => {
    e.preventDefault();
    setGeneratingInterview(true);
    setInterviewQuestions([]);
    setActiveInterviewIdx(0);
    setInterviewAnswer('');
    setInterviewFeedbacks({});

    try {
      const res = await fetch(`${API_URL}/ai/interview`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          role: interviewRole,
          type: interviewType
        })
      });
      const data = await res.json();
      if (res.ok) {
        setInterviewQuestions(data.questions || []);
        showNotification('Mock Interview questions compiled! Answer to begin.');
      } else {
        throw new Error(data.message || 'Failed to compile interview questions.');
      }
    } catch (err) {
      showNotification(`Interview error: ${err.message}`, 'error');
    } finally {
      setGeneratingInterview(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!interviewAnswer.trim() || submittingAnswer) return;

    setSubmittingAnswer(true);
    const qText = interviewQuestions[activeInterviewIdx];

    try {
      const res = await fetch(`${API_URL}/ai/interview`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          role: interviewRole,
          type: interviewType,
          current_question: qText,
          user_answer: interviewAnswer
        })
      });
      const data = await res.json();
      if (res.ok) {
        setInterviewFeedbacks(prev => ({
          ...prev,
          [activeInterviewIdx]: {
            grade: data.grade,
            feedback: data.feedback,
            sample_answer: data.sample_answer
          }
        }));
        showNotification(`Evaluation complete. Grade: ${data.grade}`);
      } else {
        throw new Error(data.message || 'Failed to grade answer.');
      }
    } catch (err) {
      showNotification(`Grading failed: ${err.message}`, 'error');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleNextInterviewQuestion = () => {
    if (activeInterviewIdx < interviewQuestions.length - 1) {
      setActiveInterviewIdx(prev => prev + 1);
      setInterviewAnswer('');
    }
  };


  // ==========================================
  // RENDER INTERFACE
  // ==========================================
  return (
    <div className="container py-4 animated-fade-in text-light">
      
      {/* Toast notifications are handled globally */}

      {/* Main Header Card */}
      <div className="cc-card mb-4 p-4 p-lg-5" style={{ minHeight: 'auto', background: 'rgba(15, 25, 44, 0.8)' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Sparkles className="text-gold" size={24} />
              <h1 className="h2 mb-0 font-heading text-gold">AI Study Assistant</h1>
            </div>
            <p className="text-muted mb-0 font-body">
              Your personalized, Gemini-powered student helper workspace. Generates study notes, summaries, practice quizzes, and mock interviews.
            </p>
          </div>
          
          {/* Key configuration button */}
          <div>
            <button 
              className={`btn btn-sm d-flex align-items-center gap-2 py-2 px-3 ${
                localStorage.getItem('gemini_api_key') 
                  ? 'btn-success text-light' 
                  : 'btn-outline-primary'
              }`}
              onClick={() => setShowKeyInput(!showKeyInput)}
            >
              <Key size={14} />
              {localStorage.getItem('gemini_api_key') ? 'Custom API Key Saved' : 'Configure Gemini API Key'}
            </button>
          </div>
        </div>

        {/* API Key Modal/Collapse Panel */}
        {showKeyInput && (
          <div className="mt-4 p-4 rounded bg-navy-main border border-navy-light position-relative">
            <button 
              className="position-absolute top-2 end-2 btn btn-link p-1 text-light" 
              onClick={() => setShowKeyInput(false)}
            >
              <X size={16} />
            </button>
            <h5 className="font-heading mb-2 text-gold">Gemini API Configuration</h5>
            <p className="text-muted small mb-3">
              Your API key will be saved locally in this browser. To use the shared default or system-provided key, leave this blank.
            </p>
            <form onSubmit={handleSaveApiKey} className="d-flex flex-column flex-md-row gap-2">
              <input 
                type="password"
                className="form-control flex-grow-1 font-body text-light"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">Save Key</button>
                {localStorage.getItem('gemini_api_key') && (
                  <button type="button" className="btn btn-danger" onClick={handleClearApiKey}>Clear Key</button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {[
          { id: 'chat', label: 'Study Chat', icon: MessageSquare },
          { id: 'notes', label: 'Notes Maker', icon: FileText },
          { id: 'pdf', label: 'PDF Summarizer', icon: FileUp },
          { id: 'code', label: 'Code Mentor', icon: Code },
          { id: 'quiz', label: 'Quiz Studio', icon: GraduationCap },
          { id: 'interview', label: 'Mock Interview', icon: Award }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`cc-day-tab d-flex align-items-center gap-2 py-2 px-3 ${isActive ? 'active' : ''}`}
              style={{ minWidth: '130px', justifyContent: 'center' }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="cc-card p-4" style={{ minHeight: '500px', background: 'rgba(21, 36, 56, 0.4)' }}>
        
        {/* ============================================================== */}
        {/* PANEL 1: CHAT BUDDY */}
        {/* ============================================================== */}
        {activeTab === 'chat' && (
          <div className="d-flex flex-column" style={{ height: '520px' }}>
            
            {/* Context Inject Chips */}
            <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
              <span className="small text-muted d-flex align-items-center gap-1 font-body">
                <Info size={13} />
                Inject Database Context:
              </span>
              <button 
                onClick={() => handleInjectContext('timetable')} 
                disabled={sendingChat}
                className="ai-chip text-light bg-navy-main border border-navy-light"
              >
                📅 Class Timetable
              </button>
              <button 
                onClick={() => handleInjectContext('assignments')} 
                disabled={sendingChat}
                className="ai-chip text-light bg-navy-main border border-navy-light"
              >
                📝 Pending Assignments
              </button>
              <button 
                onClick={() => handleInjectContext('attendance')} 
                disabled={sendingChat}
                className="ai-chip text-light bg-navy-main border border-navy-light"
              >
                📊 Attendance Summary
              </button>
            </div>

            {/* Chat History Panel */}
            <div 
              ref={chatHistoryRef}
              className="flex-grow-1 overflow-y-auto pr-2 d-flex flex-column gap-3 mb-3 p-3 rounded"
              style={{ background: 'rgba(11, 25, 44, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`d-flex gap-2 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-navy-light" style={{ width: '36px', height: '36px', border: '1px solid rgba(212,175,55,0.2)' }}>
                      <Bot size={18} className="text-gold" />
                    </div>
                  )}
                  <div 
                    className={`ai-message ${msg.sender === 'user' ? 'ai-message-user text-light' : 'ai-message-bot text-light'}`}
                    style={{ whiteSpace: 'pre-line', maxWidth: '75%' }}
                  >
                    {msg.text}
                  </div>
                  {msg.sender === 'user' && (
                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-navy-card" style={{ width: '36px', height: '36px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <User size={18} className="text-muted" />
                    </div>
                  )}
                </div>
              ))}

              {sendingChat && (
                <div className="d-flex gap-2 justify-content-start">
                  <div className="rounded-circle d-flex align-items-center justify-content-center bg-navy-light" style={{ width: '36px', height: '36px' }}>
                    <Bot size={18} className="text-gold animate-bounce" />
                  </div>
                  <div className="ai-message ai-message-bot d-flex align-items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-gold" />
                    <span>Study Buddy is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
              className="d-flex gap-2 align-items-center"
            >
              <input 
                type="text"
                className="form-control font-body text-light"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask your study buddy anything (e.g., 'Explain binary search tree')..."
                disabled={sendingChat}
              />
              <button 
                type="submit" 
                className="ai-send-btn flex-shrink-0"
                disabled={sendingChat || !chatInput.trim()}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}


        {/* ============================================================== */}
        {/* PANEL 2: NOTES GENERATOR */}
        {/* ============================================================== */}
        {activeTab === 'notes' && (
          <div className="row g-4">
            
            {/* Input side */}
            <div className="col-lg-5">
              <h4 className="font-heading mb-3 text-gold">Generate Study Notes</h4>
              <form onSubmit={handleGenerateNotes} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label font-heading text-muted">Topic *</label>
                  <input 
                    type="text"
                    required
                    className="form-control font-body text-light"
                    placeholder="e.g. Backpropagation, Dynamic Programming"
                    value={notesTopic}
                    onChange={(e) => setNotesTopic(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label font-heading text-muted">Subject / Course</label>
                  <input 
                    type="text"
                    className="form-control font-body text-light"
                    placeholder="e.g. Machine Learning, CS101"
                    value={notesSubject}
                    onChange={(e) => setNotesSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label font-heading text-muted">Notes Style/Format</label>
                  <select 
                    className="form-control font-body text-light"
                    value={notesTone}
                    onChange={(e) => setNotesTone(e.target.value)}
                  >
                    <option value="Academic">Detailed Academic Study Guide</option>
                    <option value="Simplified">ELI5 (Explain Like I'm 5)</option>
                    <option value="Summary">Bullet Points & Core Takeaways</option>
                    <option value="Outline">Syllabus Outline Structure</option>
                  </select>
                </div>
                <div>
                  <label className="form-label font-heading text-muted">Specific Focus / Custom guidelines</label>
                  <textarea 
                    className="form-control font-body text-light"
                    rows="3"
                    placeholder="e.g., Include python code block; focus heavily on weights update formulas..."
                    value={notesFocus}
                    onChange={(e) => setNotesFocus(e.target.value)}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                  disabled={generatingNotes || !notesTopic.trim()}
                >
                  {generatingNotes ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Drafting Notes...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate Notes
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Output preview side */}
            <div className="col-lg-7">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="font-heading mb-0 text-gold">Notes Document</h4>
                
                {/* Note font and actions buttons */}
                {notesOutput && (
                  <div className="d-flex align-items-center gap-2">
                    {/* Text Size Control */}
                    <div className="d-flex align-items-center gap-1 border border-navy-light rounded px-2 py-1 bg-navy-main">
                      <button 
                        className="btn btn-link p-1 text-light" 
                        style={{ textDecoration: 'none' }}
                        onClick={() => setNotesFontSize(prev => Math.max(12, prev - 2))}
                      >
                        A-
                      </button>
                      <span className="small text-muted font-body px-1">{notesFontSize}px</span>
                      <button 
                        className="btn btn-link p-1 text-light"
                        style={{ textDecoration: 'none' }}
                        onClick={() => setNotesFontSize(prev => Math.min(24, prev + 2))}
                      >
                        A+
                      </button>
                    </div>

                    <button className="btn btn-sm btn-outline-primary p-2" title="Copy to clipboard" onClick={handleCopyNotes}>
                      <Copy size={14} />
                    </button>
                    <button className="btn btn-sm btn-primary p-2" title="Download markdown" onClick={handleDownloadNotes}>
                      <Download size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Output render box */}
              <div 
                className="p-4 rounded border font-body overflow-y-auto"
                style={{ 
                  height: '420px', 
                  fontSize: `${notesFontSize}px`, 
                  background: 'rgba(11, 25, 44, 0.4)', 
                  borderColor: 'rgba(255,255,255,0.05)',
                  lineHeight: '1.6'
                }}
              >
                {generatingNotes ? (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 gap-2">
                    <Loader2 size={36} className="animate-spin text-gold" />
                    <span className="text-muted">Drafting structured notes via Gemini API...</span>
                  </div>
                ) : notesOutput ? (
                  <div className="notes-markdown" style={{ whiteSpace: 'pre-wrap' }}>
                    {notesOutput}
                  </div>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center text-muted">
                    <FileText size={48} className="mb-2 text-navy-light" />
                    <span>Fill in the details and click "Generate Notes" to display the study guide.</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}


        {/* ============================================================== */}
        {/* PANEL 3: PDF SUMMARIZER */}
        {/* ============================================================== */}
        {activeTab === 'pdf' && (
          <div className="row g-4">
            
            {/* Setup / File select panel */}
            <div className="col-lg-4 border-end border-navy-light pr-lg-4">
              <h4 className="font-heading mb-3 text-gold">Source Document</h4>
              
              {/* Option A: Select Existing approved PDF file */}
              <div className="mb-4">
                <label className="form-label font-heading text-muted small">Select PDF from your Uploads</label>
                {loadingFiles ? (
                  <div className="d-flex align-items-center gap-2 text-muted small py-2">
                    <Loader2 size={14} className="animate-spin text-gold" />
                    <span>Loading repository files...</span>
                  </div>
                ) : approvedFiles.length === 0 ? (
                  <div className="p-2 border border-dashed rounded text-center small text-muted">
                    No approved PDFs in your files directory. Upload a PDF below!
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    <select 
                      className="form-control font-body text-light"
                      value={selectedFileId}
                      onChange={(e) => setSelectedFileId(e.target.value)}
                    >
                      <option value="">-- Choose approved PDF --</option>
                      {approvedFiles.map(f => (
                        <option key={f.id} value={f.id}>{f.filename} ({f.category})</option>
                      ))}
                    </select>
                    <button 
                      className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                      disabled={summarizingPdf || !selectedFileId}
                      onClick={() => handleSummarizePdf()}
                    >
                      {summarizingPdf ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      Summarize Selected File
                    </button>
                  </div>
                )}
              </div>

              <div className="text-center text-muted small my-3 font-heading">— OR —</div>

              {/* Option B: Upload new PDF direct and Summarize */}
              <form onSubmit={handleDirectUploadPdf} className="p-3 rounded bg-navy-main border border-navy-light d-flex flex-column gap-3">
                <h5 className="font-heading mb-0 text-gold small">Direct PDF Upload & Summarize</h5>
                
                <div>
                  <label className="form-label text-muted small">Select PDF File *</label>
                  <input 
                    type="file" 
                    required 
                    accept=".pdf"
                    className="form-control form-control-sm font-body text-light"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                  />
                </div>
                
                <div>
                  <label className="form-label text-muted small">Subject Category</label>
                  <select 
                    className="form-control form-control-sm font-body text-light"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                  >
                    <option value="Academic">Academic Study Material</option>
                    <option value="General">General Reference</option>
                    <option value="Technology">Technology Documents</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                  disabled={uploadingFile || !uploadFile}
                >
                  {uploadingFile ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileUp size={14} />
                      Upload & Auto-Summarize
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Summarizer Result Outputs panel */}
            <div className="col-lg-8">
              {summarizingPdf ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 min-vh-50 gap-2 text-center">
                  <Loader2 size={42} className="animate-spin text-gold mb-2" />
                  <h5 className="font-heading text-gold">Extracting Text & Structuring Review...</h5>
                  <p className="text-muted small">Please hold on, standard files take 10-15 seconds to synthesize.</p>
                </div>
              ) : pdfSummary ? (
                <div className="d-flex flex-column gap-4">
                  
                  {/* Summary Box */}
                  <div className="p-3 rounded bg-navy-main border border-navy-light">
                    <h5 className="font-heading text-gold mb-2">Executive Summary</h5>
                    <p className="font-body text-light small mb-0" style={{ lineHeight: '1.6' }}>
                      {pdfSummary}
                    </p>
                  </div>

                  {/* Takeaways List */}
                  {pdfTakeaways.length > 0 && (
                    <div className="p-3 rounded bg-navy-main border border-navy-light">
                      <h5 className="font-heading text-gold mb-2">Key Takeaways & Core Points</h5>
                      <ul className="font-body text-light small mb-0 pl-3 d-flex flex-column gap-2">
                        {pdfTakeaways.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Flashcards flip study section */}
                  {pdfFlashcards.length > 0 && (
                    <div>
                      <h5 className="font-heading text-gold mb-3">Generated Interactive Study Flashcards</h5>
                      <div className="d-flex flex-column align-items-center gap-3">
                        
                        {/* Interactive Flip Container */}
                        <div 
                          className="w-100 position-relative cursor-pointer"
                          style={{ height: '180px', maxWidth: '460px', perspective: '1000px' }}
                          onClick={() => setIsCardFlipped(!isCardFlipped)}
                        >
                          <div 
                            className="w-100 h-100 position-absolute"
                            style={{
                              transformStyle: 'preserve-3d',
                              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                              transform: isCardFlipped ? 'rotateY(180deg)' : 'none'
                            }}
                          >
                            
                            {/* Card Front: Question */}
                            <div 
                              className="w-100 h-100 position-absolute rounded shadow-lg p-4 d-flex flex-column align-items-center justify-content-center text-center bg-navy-card border"
                              style={{ 
                                backfaceVisibility: 'hidden', 
                                border: '1px solid rgba(212,175,55,0.3)',
                                borderTop: '4px solid var(--cc-gold-metallic)'
                              }}
                            >
                              <span className="badge bg-secondary mb-2" style={{ fontSize: '0.65rem' }}>
                                Card {currentCardIdx + 1} of {pdfFlashcards.length}
                              </span>
                              <h5 className="font-heading text-light m-0 font-medium" style={{ fontSize: '1rem' }}>
                                {pdfFlashcards[currentCardIdx]?.question}
                              </h5>
                              <span className="text-muted small mt-3 font-body" style={{ fontSize: '0.75rem' }}>
                                Click to Flip / Show Answer
                              </span>
                            </div>

                            {/* Card Back: Answer */}
                            <div 
                              className="w-100 h-100 position-absolute rounded shadow-lg p-4 d-flex flex-column align-items-center justify-content-center text-center bg-navy-light border"
                              style={{ 
                                backfaceVisibility: 'hidden', 
                                transform: 'rotateY(180deg)',
                                border: '1px solid rgba(212,175,55,0.3)'
                              }}
                            >
                              <span className="badge bg-gold-metallic text-navy-deep mb-2" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                                Answer
                              </span>
                              <p className="font-body text-light small m-0" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                                {pdfFlashcards[currentCardIdx]?.answer}
                              </p>
                              <span className="text-muted small mt-3 font-body" style={{ fontSize: '0.75rem' }}>
                                Click to Flip back
                              </span>
                            </div>

                          </div>
                        </div>

                        {/* Grading buttons */}
                        <div className="d-flex gap-2">
                          <button 
                            className={`btn btn-sm py-1 px-3 ${cardScores[currentCardIdx] === 'review' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={(e) => { e.stopPropagation(); handleScoreCard('review'); }}
                          >
                            Study Again ❌
                          </button>
                          <button 
                            className={`btn btn-sm py-1 px-3 ${cardScores[currentCardIdx] === 'easy' ? 'btn-success text-light' : 'btn-outline-success'}`}
                            onClick={(e) => { e.stopPropagation(); handleScoreCard('easy'); }}
                          >
                            Got It! ✔
                          </button>
                        </div>

                        {/* Card controls */}
                        <div className="d-flex gap-4 align-items-center mt-2 small text-muted font-heading">
                          <button 
                            disabled={currentCardIdx === 0}
                            onClick={() => { setIsCardFlipped(false); setCurrentCardIdx(p => p - 1); }}
                            className="btn btn-link p-1 text-light"
                          >
                            ◀ Prev Card
                          </button>
                          <span>{currentCardIdx + 1} / {pdfFlashcards.length}</span>
                          <button 
                            disabled={currentCardIdx === pdfFlashcards.length - 1}
                            onClick={() => { setIsCardFlipped(false); setCurrentCardIdx(p => p + 1); }}
                            className="btn btn-link p-1 text-light"
                          >
                            Next Card ▶
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center text-muted">
                  <FileText size={56} className="mb-2 text-navy-light" />
                  <h4>Summarization Center</h4>
                  <p className="small max-w-lg">
                    Select an approved PDF from your dashboard upload list or submit a new PDF directly in the sidebar to review summaries and flashcards.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}


        {/* ============================================================== */}
        {/* PANEL 4: CODE MENTOR */}
        {/* ============================================================== */}
        {activeTab === 'code' && (
          <div className="row g-4">
            
            {/* Input code editor area */}
            <div className="col-lg-5">
              <h4 className="font-heading mb-3 text-gold">Code Mentor Input</h4>
              <form onSubmit={handleGenerateCodeHelp} className="d-flex flex-column gap-3">
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label text-muted small font-heading">Language</label>
                    <select 
                      className="form-control form-control-sm font-body text-light"
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value)}
                    >
                      <option value="Python">Python</option>
                      <option value="JavaScript">JavaScript</option>
                      <option value="Java">Java</option>
                      <option value="C++">C++</option>
                      <option value="HTML/CSS">HTML & CSS</option>
                      <option value="SQL">SQL DB Query</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label text-muted small font-heading">Request Focus</label>
                    <select 
                      className="form-control form-control-sm font-body text-light"
                      value={codeMode}
                      onChange={(e) => setCodeMode(e.target.value)}
                    >
                      <option value="Explain">Explain Code Logic</option>
                      <option value="Debug">Identify Bugs / Errors</option>
                      <option value="Optimize">Optimize Performance</option>
                      <option value="Refactor">Refactor Structure</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label text-muted small font-heading">Paste Code Snippet *</label>
                  <textarea 
                    required
                    className="form-control font-monospace text-light bg-navy-main border border-navy-light"
                    rows="10"
                    placeholder="paste your source code here..."
                    style={{ fontSize: '0.85rem', whiteSpace: 'pre', overflowX: 'auto' }}
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                  disabled={generatingCode || !codeSnippet.trim()}
                >
                  {generatingCode ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Analyzing code snippet...
                    </>
                  ) : (
                    <>
                      <Code size={16} />
                      Consult Code Mentor
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Output code mentor details */}
            <div className="col-lg-7">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="font-heading mb-0 text-gold font-medium">Mentor Response</h4>
                {codeOutput && (
                  <button className="btn btn-sm btn-outline-primary" onClick={handleCopyCodeOutput}>
                    <Copy size={14} /> Copy Advice
                  </button>
                )}
              </div>

              <div 
                className="p-4 rounded border font-body overflow-y-auto"
                style={{ 
                  height: '420px', 
                  background: 'rgba(11, 25, 44, 0.4)', 
                  borderColor: 'rgba(255,255,255,0.05)',
                  fontSize: '0.9rem',
                  lineHeight: '1.6'
                }}
              >
                {generatingCode ? (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 gap-2">
                    <Loader2 size={36} className="animate-spin text-gold" />
                    <span className="text-muted">Mentor is reading syntax and logic branches...</span>
                  </div>
                ) : codeOutput ? (
                  <div className="code-markdown" style={{ whiteSpace: 'pre-wrap' }}>
                    {codeOutput}
                  </div>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center text-muted">
                    <Code size={48} className="mb-2 text-navy-light" />
                    <span>Paste your code and select the query mode to display explanations and reviews.</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}


        {/* ============================================================== */}
        {/* PANEL 5: QUIZ STUDIO */}
        {/* ============================================================== */}
        {activeTab === 'quiz' && (
          <div className="row g-4">
            
            {/* Settings sidebar */}
            <div className="col-lg-4 border-end border-navy-light pr-lg-4">
              <h4 className="font-heading mb-3 text-gold">Quiz Config</h4>
              <form onSubmit={handleGenerateQuiz} className="d-flex flex-column gap-3">
                
                <div>
                  <label className="form-label text-muted small font-heading">Syllabus Topic *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control font-body text-light"
                    placeholder="e.g. SQL joins, cellular respiration"
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                  />
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label text-muted small font-heading">Question Count</label>
                    <select 
                      className="form-control font-body text-light"
                      value={quizNum}
                      onChange={(e) => setQuizNum(parseInt(e.target.value))}
                    >
                      <option value="3">3 Questions</option>
                      <option value="5">5 Questions</option>
                      <option value="10">10 Questions</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label text-muted small font-heading">Difficulty</label>
                    <select 
                      className="form-control font-body text-light"
                      value={quizDifficulty}
                      onChange={(e) => setQuizDifficulty(e.target.value)}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard / Exam Level</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label text-muted small font-heading">Question Structure</label>
                  <div className="d-flex gap-4 mt-1 font-body">
                    <label className="d-flex align-items-center gap-2 cursor-pointer text-light">
                      <input 
                        type="radio" 
                        name="quiz_type" 
                        value="mcq"
                        checked={quizType === 'mcq'} 
                        onChange={() => setQuizType('mcq')}
                      />
                      <span>MCQ (4 options)</span>
                    </label>
                    <label className="d-flex align-items-center gap-2 cursor-pointer text-light">
                      <input 
                        type="radio" 
                        name="quiz_type" 
                        value="tf"
                        checked={quizType === 'tf'} 
                        onChange={() => setQuizType('tf')}
                      />
                      <span>True / False</span>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                  disabled={generatingQuiz || !quizTopic.trim()}
                >
                  {generatingQuiz ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Generate Practice Quiz
                </button>
              </form>
            </div>

            {/* Quiz view panel */}
            <div className="col-lg-8">
              {generatingQuiz ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 gap-2">
                  <Loader2 size={42} className="animate-spin text-gold mb-2" />
                  <h5 className="font-heading text-gold">Generating Custom Practice Test...</h5>
                  <p className="text-muted small">Gemini is writing conceptual queries and explanations.</p>
                </div>
              ) : quizQuestions.length > 0 ? (
                <div className="d-flex flex-column gap-4">
                  <div className="d-flex justify-content-between align-items-center bg-navy-main p-3 rounded border border-navy-light">
                    <div>
                      <h5 className="font-heading text-gold mb-1">Practice Quiz: {quizTopic}</h5>
                      <span className="small text-muted font-body">Difficulty: {quizDifficulty} | Total: {quizQuestions.length} Questions</span>
                    </div>
                    {quizSubmitted && (
                      <div className="text-end">
                        <span className="h4 font-heading text-gold">{quizScore}/{quizQuestions.length}</span>
                        <p className="small text-muted font-body m-0">Final Grade: {Math.round((quizScore/quizQuestions.length)*100)}%</p>
                      </div>
                    )}
                  </div>

                  {/* Questions list */}
                  <div className="d-flex flex-column gap-3 overflow-y-auto pr-2" style={{ maxHeight: '350px' }}>
                    {quizQuestions.map((q, qIdx) => {
                      const isCorrect = quizAnswers[qIdx] === q.correct_index;

                      return (
                        <div key={qIdx} className="p-3 rounded border bg-navy-card" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                          <h6 className="font-heading mb-2 text-light">
                            {qIdx + 1}. {q.question}
                          </h6>
                          <div className="d-flex flex-column gap-2 font-body small">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = quizAnswers[qIdx] === optIdx;
                              const isCorrectOption = optIdx === q.correct_index;
                              
                              let btnClass = "btn-outline-primary border-navy-light text-light text-start";
                              if (isSelected) btnClass = "btn-primary text-navy-deep text-start";
                              
                              if (quizSubmitted) {
                                if (isCorrectOption) btnClass = "btn-success text-light text-start border-success";
                                else if (isSelected && !isCorrect) btnClass = "btn-danger text-light text-start border-danger";
                                else btnClass = "btn-outline-secondary text-muted text-start border-navy-light opacity-50";
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  className={`btn btn-sm py-2 px-3 ${btnClass}`}
                                  disabled={quizSubmitted}
                                  onClick={() => handleSelectQuizAnswer(qIdx, optIdx)}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation render */}
                          {quizSubmitted && (
                            <div className="mt-3 p-2 rounded small bg-navy-main border border-navy-light font-body" style={{ fontSize: '0.8rem' }}>
                              <strong className={isCorrect ? 'text-success' : 'text-danger'}>
                                {isCorrect ? '✔ Correct: ' : '❌ Incorrect: '}
                              </strong>
                              <span className="text-muted">{q.explanation}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit buttons */}
                  <div className="d-flex gap-3 justify-content-end font-heading">
                    {!quizSubmitted ? (
                      <button 
                        className="btn btn-primary px-4" 
                        disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                        onClick={handleSubmitQuiz}
                      >
                        Submit Practice Test
                      </button>
                    ) : (
                      <button 
                        className="btn btn-outline-primary d-flex align-items-center gap-2 px-4"
                        onClick={() => {
                          setQuizQuestions([]);
                          setQuizAnswers({});
                          setQuizSubmitted(false);
                          setQuizScore(0);
                        }}
                      >
                        <RotateCcw size={14} /> Re-configure
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center text-muted">
                  <GraduationCap size={56} className="mb-2 text-navy-light" />
                  <h4>Practice Test Studio</h4>
                  <p className="small max-w-md">
                    Set a course syllabus topic in the sidebar and choose quiz styles to test your learning comprehension dynamically.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}


        {/* ============================================================== */}
        {/* PANEL 6: MOCK INTERVIEW PREP */}
        {/* ============================================================== */}
        {activeTab === 'interview' && (
          <div className="row g-4">
            
            {/* Left sidebar: Interview setup */}
            <div className="col-lg-4 border-end border-navy-light pr-lg-4">
              <h4 className="font-heading mb-3 text-gold">Interview Setup</h4>
              <form onSubmit={handleStartInterview} className="d-flex flex-column gap-3 font-body">
                
                <div>
                  <label className="form-label text-muted small font-heading">Target Role</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control text-light"
                    placeholder="e.g. Software Engineer, Lab Intern, President"
                    value={interviewRole}
                    onChange={(e) => setInterviewRole(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label text-muted small font-heading">Interview Focus</label>
                  <select 
                    className="form-control text-light"
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                  >
                    <option value="Technical">Technical & Domain Knowledge</option>
                    <option value="Behavioral">Behavioral (STAR Method)</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                  disabled={generatingInterview || !interviewRole.trim()}
                >
                  {generatingInterview ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Start Mock Interview
                </button>
              </form>
            </div>

            {/* Right panel: Active interview screen */}
            <div className="col-lg-8">
              {generatingInterview ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 gap-2">
                  <Loader2 size={42} className="animate-spin text-gold mb-2" />
                  <h5 className="font-heading text-gold">Assembling Interview Committee...</h5>
                  <p className="text-muted small">Generating role-specific questions for your review.</p>
                </div>
              ) : interviewQuestions.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  
                  {/* Header metadata */}
                  <div className="bg-navy-main p-3 rounded border border-navy-light d-flex justify-content-between align-items-center font-heading">
                    <div>
                      <h5 className="text-gold mb-1">Role: {interviewRole}</h5>
                      <span className="small text-muted">{interviewType} Interview Panel</span>
                    </div>
                    <span className="badge bg-secondary font-body">Question {activeInterviewIdx + 1} of {interviewQuestions.length}</span>
                  </div>

                  {/* Question Box */}
                  <div className="p-4 rounded border bg-navy-card" style={{ borderColor: 'rgba(212,175,55,0.2)' }}>
                    <span className="text-gold font-heading small">INTERVIEWER QUESTION:</span>
                    <h5 className="font-heading text-light mt-1 mb-0" style={{ fontSize: '1.05rem', lineHeight: '1.5' }}>
                      "{interviewQuestions[activeInterviewIdx]}"
                    </h5>
                  </div>

                  {/* Assessment Box (if answered) */}
                  {interviewFeedbacks[activeInterviewIdx] ? (
                    <div className="p-3 rounded border bg-navy-main border-navy-light d-flex flex-column gap-3 font-body">
                      <div className="d-flex justify-content-between align-items-center border-bottom border-navy-light pb-2">
                        <span className="text-gold font-heading small">INTERVIEWER FEEDBACK:</span>
                        <span className="badge bg-gold-metallic text-navy-deep font-heading px-3 py-1 font-bold">
                          GRADE: {interviewFeedbacks[activeInterviewIdx].grade}
                        </span>
                      </div>
                      <div className="small text-muted" style={{ lineHeight: '1.5' }}>
                        <strong>Critique:</strong> {interviewFeedbacks[activeInterviewIdx].feedback}
                      </div>
                      <div className="small p-2 rounded bg-navy-card text-muted border border-navy-light" style={{ fontSize: '0.8rem' }}>
                        <strong>Senior Model Answer Example:</strong>
                        <p className="m-0 mt-1 italic">"{interviewFeedbacks[activeInterviewIdx].sample_answer}"</p>
                      </div>
                      
                      {/* Next button */}
                      <div className="d-flex justify-content-end">
                        {activeInterviewIdx < interviewQuestions.length - 1 ? (
                          <button className="btn btn-sm btn-primary d-flex align-items-center gap-1" onClick={handleNextInterviewQuestion}>
                            Next Question <ChevronRight size={14} />
                          </button>
                        ) : (
                          <span className="small text-gold font-heading">✔ Mock Interview Finished!</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Input response editor
                    <div className="d-flex flex-column gap-2">
                      <label className="form-label text-muted small font-heading">Type your response here *</label>
                      <textarea 
                        className="form-control text-light font-body"
                        rows="5"
                        placeholder="Structure your answer clearly, detail your actions, and output metric outcomes if behavioral..."
                        value={interviewAnswer}
                        onChange={(e) => setInterviewAnswer(e.target.value)}
                        disabled={submittingAnswer}
                      />
                      
                      <div className="d-flex gap-2 justify-content-end font-heading mt-1">
                        <button 
                          className="btn btn-outline-primary text-light"
                          onClick={() => setInterviewFeedbacks(prev => ({
                            ...prev,
                            [activeInterviewIdx]: {
                              grade: 'Skipped',
                              feedback: 'Skipped by candidate. Standard evaluation is unavailable.',
                              sample_answer: 'Review general interview questions online for reference examples.'
                            }
                          }))}
                          disabled={submittingAnswer}
                        >
                          Skip / Show Model Answer
                        </button>
                        <button 
                          className="btn btn-primary d-flex align-items-center gap-2"
                          onClick={handleSubmitAnswer}
                          disabled={submittingAnswer || !interviewAnswer.trim()}
                        >
                          {submittingAnswer ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Evaluating response...
                            </>
                          ) : (
                            <>
                              <Send size={14} />
                              Submit Answer for Review
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center text-muted">
                  <Award size={56} className="mb-2 text-navy-light" />
                  <h4>Mock Interview Prep Studio</h4>
                  <p className="small max-w-md">
                    Input your target career role or select focus themes in the left sidebar to generate interview questions and get real-time evaluations.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default StudyAssistant;
