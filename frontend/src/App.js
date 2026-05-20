import React, { useState } from 'react';

import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';

import ChatLogPage from './pages/ChatLogPage';
import OCRPage from './pages/OCRPage';

export default function App() {

  const [user, setUser] = useState(null);
  const [page, setPage] = useState('login');

  // LOGIN PAGE
  if (page === 'login' || !user) {
    return (
      <LoginPage
        onLogin={(u) => {
          setUser(u);
          setPage('chat');
        }}
      />
    );
  }

  // DASHBOARD PAGE
  if (page === 'dashboard') {
    return (
      <DashboardPage
        user={user}
        onBack={() => setPage('chat')}
      />
    );
  }

  // CHAT LOG ANALYSIS PAGE
  if (page === 'chatlog') {
    return (
      <ChatLogPage
        onBack={() => setPage('chat')}
      />
    );
  }

  // OCR PAGE
  if (page === 'ocr') {
    return (
      <OCRPage
        onBack={() => setPage('chat')}
      />
    );
  }

  // MAIN CHAT PAGE
  return (
    <ChatPage
      user={user}
      onLogout={() => {
        setUser(null);
        setPage('login');
      }}
      onDashboard={() => setPage('dashboard')}
      onNavigate={setPage}
    />
  );
}