import { Navigate, Route, Routes } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import useSessionHistory from './hooks/useSessionHistory';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SessionPage from './pages/SessionPage';
import ReportPage from './pages/ReportPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-bg"><div className="h-6 w-6 rounded-full border-2 border-green border-t-transparent animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading, signOut } = useAuth();
  const { sessions, loading: sessionsLoading } = useSessionHistory(user?.uid ?? null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-6 w-6 rounded-full border-2 border-green border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage
              user={user!}
              sessions={sessions}
              loading={sessionsLoading}
              onSignOut={signOut}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/session"
        element={
          <ProtectedRoute>
            <SessionPage user={user!} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={
          <ProtectedRoute>
            <ReportPage user={user!} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
