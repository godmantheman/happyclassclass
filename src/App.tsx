import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Board from './components/Board';
import PostDetail from './components/PostDetail';
import Chat from './components/Chat';
import FileShare from './components/FileShare';
import AdminPanel from './components/AdminPanel';
import AuthPage from './components/AuthPage';
import { PostType } from './types';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">로딩 중...</div>;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
}

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-[#fcfaf7] text-[#333]">
        {user && <Navbar />}
        <main className="max-w-5xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/notices" element={<ProtectedRoute><Board type={PostType.NOTICE} title="공지사항" /></ProtectedRoute>} />
            <Route path="/freeboard" element={<ProtectedRoute><Board type={PostType.FREE} title="자유게시판" /></ProtectedRoute>} />
            <Route path="/classroom" element={<ProtectedRoute><Board type={PostType.CLASSROOM} title="수업 자료실" /></ProtectedRoute>} />
            <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><FileShare /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
