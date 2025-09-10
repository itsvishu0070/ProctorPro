

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import InterviewPage from './pages/InterviewPage';
import AdminDashboard from './pages/AdminDashboard';
import ReportPage from './pages/ReportPage';
import './assets/index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/interview/:sessionId" element={<InterviewPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/report/:sessionId" element={<ReportPage />} />
      </Routes>
    </Router>
  );
}

export default App;