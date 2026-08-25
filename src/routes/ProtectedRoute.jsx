import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchMyMenus } from '../features/menu/menuSlice';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const dispatch = useDispatch();
  const { permissions, loading, isLoaded } = useSelector(state => state.menu);

  useEffect(() => {
    if (isAuthenticated && !isLoaded && !loading) {
      dispatch(fetchMyMenus());
    }
  }, [isAuthenticated, isLoaded, loading, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin override: admink@gnail.com has access to everything
  if (user?.emailId?.toLowerCase() === 'admink@gnail.com') {
    return children;
  }

  // If menus are still loading, show a simple spinner
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const path = location.pathname;

  // Always allow access to static base menus if authenticated
  if (
    path === '/dashboard' ||
    path.startsWith('/return-to-warehouse') ||
    path.startsWith('/Facility/Reports/FacHoldBatchReport.aspx') ||
    path.startsWith('/Facility/Reports/WHBatchBlockRport.aspx') ||
    path.startsWith('/local-purchase') ||
    path.startsWith('/reagent-indent') ||
    path.startsWith('/annual-indent') ||
    path.startsWith('/reports')
  ) {
    return children;
  }

  const permKey = Object.keys(permissions).find(key => path === key || path.startsWith(key + '/'));

  if (permKey) {
    const screenPerm = permissions[permKey];
    if (screenPerm && !screenPerm.canView) {
      return <Navigate to="/unauthorized" replace />;
    }
    return children;
  }

  // Block access if no permission matches
  return <Navigate to="/unauthorized" replace />;
}