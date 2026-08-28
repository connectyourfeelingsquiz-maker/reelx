// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLinks } from './pages/admin/AdminLinks';
import { AdminLinkDetail } from './pages/admin/AdminLinkDetail';
import { AdminEvents } from './pages/admin/AdminEvents';
import { AdminEventDetail } from './pages/admin/AdminEventDetail';
import { AdminSettings } from './pages/admin/AdminSettings';
import { SafetyPage } from './pages/SafetyPage';

import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public safety link route */}
          <Route path="/s/:token" element={<SafetyPage />} />

          {/* Admin login (public) */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected admin routes */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/links" element={<ProtectedRoute><AdminLinks /></ProtectedRoute>} />
          <Route path="/admin/links/:id" element={<ProtectedRoute><AdminLinkDetail /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute><AdminEvents /></ProtectedRoute>} />
          <Route path="/admin/events/:id" element={<ProtectedRoute><AdminEventDetail /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
