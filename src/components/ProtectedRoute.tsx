import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/lib/offline/useOnlineStatus';
import { findSupabaseAuthEntry } from '@/lib/offline/device-auth';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const online = useOnlineStatus();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // With no internet the token cannot be refreshed against the server. A member
  // who is signed in on this device must never be thrown out to the login
  // screen just because they lost connection.
  if (!user && !online && findSupabaseAuthEntry()) {
    return <>{children}</>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
