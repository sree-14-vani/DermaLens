import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/layouts/DashboardLayout';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import AnalysisPage from '@/pages/dashboard/AnalysisPage';
import EnhancePage from '@/pages/dashboard/EnhancePage';
import RoutinePage from '@/pages/dashboard/RoutinePage';
import TipsPage from '@/pages/dashboard/TipsPage';
import DietPage from '@/pages/dashboard/DietPage';
import ChatbotPage from '@/pages/dashboard/ChatbotPage';
import HistoryPage from '@/pages/dashboard/HistoryPage';
import ProfilePage from '@/pages/dashboard/ProfilePage';
import SettingsPage from '@/pages/dashboard/SettingsPage';
import LegalPage from '@/pages/LegalPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
      </div>
    );
  }
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/legal/:slug" element={<LegalPage />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPasswordPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="analysis" element={<AnalysisPage />} />
            <Route path="enhance" element={<EnhancePage />} />
            <Route path="routine" element={<RoutinePage />} />
            <Route path="tips" element={<TipsPage />} />
            <Route path="diet" element={<DietPage />} />
            <Route path="chatbot" element={<ChatbotPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
