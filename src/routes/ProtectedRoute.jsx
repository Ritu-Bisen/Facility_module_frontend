import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const { permissions, loading } = useSelector(state => state.menu);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin override: admink@gnail.com has access to everything
  if (user?.emailId?.toLowerCase() === 'admink@gnail.com') {
    return children;
  }

  // If menus are still loading, you could show a spinner here,
  // but to keep it simple, we just allow render, or maybe show loading if needed.
  // We'll trust the Sidebar loads the menus in the background.

  // Normalize path to check against permissions
  // e.g. /ward-issues/add might match /ward-issues if we strip the sub-routes, 
  // but for exact match:
  const path = location.pathname;

  const permKey = Object.keys(permissions).find(key => path === key || path.startsWith(key + '/'));

  if (permKey) {
    const screenPerm = permissions[permKey];
    if (screenPerm && !screenPerm.canView) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}