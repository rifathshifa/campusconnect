import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import Navbar from './components/Common/Navbar';
import Footer from './components/Common/Footer';
import PrivateRoute from './components/Auth/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminPanel from './pages/AdminPanel';
import FileManager from './pages/FileManager';
import StudyAssistant from './pages/StudyAssistant';


function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <div className="d-flex flex-column min-vh-100 bg-navy-deep">
                <Navbar />
                <main className="flex-grow-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route 
                      path="/dashboard" 
                      element={
                        <PrivateRoute>
                          <Dashboard />
                        </PrivateRoute>
                      } 
                    />
                    <Route 
                      path="/files" 
                      element={
                        <PrivateRoute>
                          <FileManager />
                        </PrivateRoute>
                      } 
                    />
                    <Route 
                      path="/admin/panel" 
                      element={
                        <PrivateRoute>
                          <AdminPanel />
                        </PrivateRoute>
                      } 
                    />
                    <Route 
                      path="/study-assistant" 
                      element={
                        <PrivateRoute>
                          <StudyAssistant />
                        </PrivateRoute>
                      } 
                    />
                  </Routes>
                </main>
                <Footer />
              </div>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

