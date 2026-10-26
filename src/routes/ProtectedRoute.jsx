import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMyMenus } from '../features/menu/menuSlice';
import { checkPendingDeliveredStatus } from '../utils/deliveredReceiptRestriction';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { permissions, loading, isLoaded } = useSelector((state) => state.menu);

  const [checkingDelivered, setCheckingDelivered] = useState(false);
  const [isDeliveredRestricted, setIsDeliveredRestricted] = useState(false);
  const [deliveredWarningInfo, setDeliveredWarningInfo] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoaded && !loading) {
      dispatch(fetchMyMenus());
    }
  }, [isAuthenticated, isLoaded, loading, dispatch]);

  const path = location.pathname;

  // Check if current route is one of the target features:
  // ward issue, indent to warehouse, indent to other facility, inter facility issue, and shc indent issue
  const isRestrictedFeaturePath =
    path === '/ward-issues' ||
    path.startsWith('/ward-issues/') ||
    path === '/ayush-ward-issue' ||
    path.startsWith('/ayush-ward-issue/') ||
    path === '/indent/warehouse' ||
    path.startsWith('/indent/warehouse/') ||
    path === '/indent-to-other-facility' ||
    path.startsWith('/indent-to-other-facility/') ||
    path === '/inter-facility-issue' ||
    path.startsWith('/inter-facility-issue/') ||
    path === '/inter-facility-issue-against-online-indent' ||
    path.startsWith('/inter-facility-issue-online/') ||
    path === '/inter-facility-shc-transfer' ||
    path.startsWith('/inter-facility-shc-transfer/') ||
    path === '/indent/shc-approval' ||
    path.startsWith('/indent/shc-approval/');

  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && isRestrictedFeaturePath && user?.facilityId) {
      setCheckingDelivered(true);
      checkPendingDeliveredStatus(user).then((status) => {
        if (!isMounted) return;
        setCheckingDelivered(false);
        if (status.isRestricted) {
          setIsDeliveredRestricted(true);
          setDeliveredWarningInfo(false);
        } else if (status.hasAnyDeliveredPending) {
          // Delivered exists, but within 2 working days -> show warning info modal
          setIsDeliveredRestricted(false);
          setDeliveredWarningInfo(true);
        } else {
          setIsDeliveredRestricted(false);
          setDeliveredWarningInfo(false);
        }
      });
    } else {
      setIsDeliveredRestricted(false);
      setDeliveredWarningInfo(false);
      setCheckingDelivered(false);
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isRestrictedFeaturePath, user, path]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin override: admink@gnail.com has access to everything
  if (user?.emailId?.toLowerCase() === 'admink@gnail.com') {
    return children;
  }

  // If menus are still loading
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user is trying to access a restricted feature and has overdue delivered indents (> 2 working days)
  if (isDeliveredRestricted) {
    return (
      <div className="relative w-full h-full min-h-screen">
        {/* Render child page in background so active tab / selected page layout is visible */}
        <div className="pointer-events-none select-none opacity-40 filter blur-[1px]">
          {children}
        </div>

        {/* Modal Prompt on top of the selected page - ACCESS RESTRICTED */}
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border-t-4 border-red-500 relative transform transition-all text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              Access Restricted / सुविधा बाधित है
            </h3>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed mb-6 bg-red-50 dark:bg-red-950/40 p-4 rounded-xl border border-red-200 dark:border-red-900/50">
              Warehouse से Issue किए गए Items/Indent की Delivery हो चुकी है , उन Items/Indent का Receipt (inwards) दर्ज होने के बाद ही इस Feature का उपयोग किया जा सकेगा।
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/indent/warehouse-receipts')}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                Go to Warehouse Receipts (Inwards)
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg shadow-sm transition-all focus:outline-none"
              >
                Close / बंद करें
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If delivered indents exist but <= 2 working days: allow user to see page, but show advisory warning notice popup
  if (deliveredWarningInfo) {
    return (
      <div className="relative w-full h-full min-h-screen">
        {/* Active Page rendered and interactive */}
        {children}

        {/* Advisory Warning Modal */}
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border-t-4 border-amber-500 relative transform transition-all text-center">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              महत्वपूर्ण सूचना / Important Notice
            </h3>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed text-center mb-6 bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50">
              Warehouse से Issue किए गए Items/Indent की Delivery हो चुकी है , उन Items/Indent का Receipt (inwards) दर्ज करने का कष्ट करे ,अन्यथा भविष्य में कुछ Features का उपयोग बाधित हो जाएगा।
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/indent/warehouse-receipts')}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:outline-none"
              >
                Go to Warehouse Receipts (Inwards)
              </button>
              <button
                onClick={() => setDeliveredWarningInfo(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg shadow-sm transition-all focus:outline-none"
              >
                Continue / जारी रखें
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Always allow access to application routes if authenticated
  if (
    path === '/dashboard' ||
    path.startsWith('/return-to-warehouse') ||
    path.startsWith('/Facility') ||
    path.startsWith('/local-purchase') ||
    path.startsWith('/reagent-indent') ||
    path.startsWith('/annual-indent') ||
    path.startsWith('/reports') ||
    path.startsWith('/indent') ||
    path.startsWith('/inter-facility') ||
    path.startsWith('/ward-issues') ||
    path.startsWith('/masters') ||
    path.startsWith('/stock') ||
    path.startsWith('/store') ||
    path.startsWith('/breakage-voucher') ||
    path.startsWith('/noc-approval') ||
    path.startsWith('/annual-indent-distribution')
  ) {
    return children;
  }

  const permKey = Object.keys(permissions || {}).find(
    (key) => key && (path === key || path.startsWith(key + '/') || key.startsWith(path + '/'))
  );

  if (permKey) {
    const screenPerm = permissions[permKey];
    if (screenPerm && screenPerm.canView === false) {
      return <Navigate to="/unauthorized" replace />;
    }
    return children;
  }

  // Allow access for authenticated users
  return children;
}
