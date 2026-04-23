import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar          from './components/Navbar';
import Login           from './pages/Login';
import Register        from './pages/Register';
import HRDashboard     from './pages/HRDashboard';
import PostJob         from './pages/PostJob';
import Applicants      from './pages/Applicants';
import JobStatus       from './pages/JobStatus';
import ApplyForm       from './pages/ApplyForm';
import CandidateDash   from './pages/CandidateDash';
import CandidateProfile from './pages/CandidateProfile';
import CandidateInbox  from './pages/CandidateInbox';
import Inbox           from './pages/Inbox';
import NotFound        from './pages/NotFound';

function AppRoutes() {
  const { hrUser, candidate, authMode, loading } = useAuth();
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spin" style={{ width: 44, height: 44 }} />
    </div>
  );

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/apply/:token"              element={<ApplyForm />} />
        <Route path="/login"                     element={authMode ? <Navigate to={authMode === 'hr' ? '/hr' : '/candidate'} /> : <Login />} />
        <Route path="/register"                  element={authMode ? <Navigate to={authMode === 'hr' ? '/hr' : '/candidate'} /> : <Register />} />

        {/* HR */}
        <Route path="/hr"                        element={hrUser ? <HRDashboard />    : <Navigate to="/login" />} />
        <Route path="/hr/post-job"               element={hrUser ? <PostJob />        : <Navigate to="/login" />} />
        <Route path="/hr/job/:jobId/applicants"  element={hrUser ? <Applicants />     : <Navigate to="/login" />} />
        <Route path="/hr/job/:jobId/status"      element={hrUser ? <JobStatus />      : <Navigate to="/login" />} />
        <Route path="/hr/inbox"                  element={hrUser ? <Inbox />          : <Navigate to="/login" />} />

        {/* Candidate */}
        <Route path="/candidate"                 element={candidate ? <CandidateDash />     : <Navigate to="/login" />} />
        <Route path="/candidate/profile"         element={candidate ? <CandidateProfile />  : <Navigate to="/login" />} />
        <Route path="/candidate/inbox"           element={candidate ? <CandidateInbox />    : <Navigate to="/login" />} />

        <Route path="/" element={<Navigate to={authMode === 'hr' ? '/hr' : authMode === 'candidate' ? '/candidate' : '/login'} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} theme="dark"
          toastStyle={{ background: '#0f1628', border: '1px solid #1c2640', color: '#eef2ff', borderRadius: '10px', fontSize: '.85rem' }} />
      </Router>
    </AuthProvider>
  );
}
