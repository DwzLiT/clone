import { Fragment } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PageLoader() {
  return (
    <div className="page-loader" role="status">
      <div className="spinner" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// Only logged-in users can see these pages.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    // Remember where the user wanted to go, so we can send them back after login.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // The key makes React throw away all page state if a different user logs in.
  return <Fragment key={user.id}>{children}</Fragment>;
}

// Login / register pages: logged-in users are sent to the app instead.
export function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (user) {
    const redirectTo = location.state?.from?.pathname || '/';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
