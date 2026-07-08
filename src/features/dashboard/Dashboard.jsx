import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DashboardCard from '../../components/dashboard/DashboardCard';
import StatsCard from '../../components/dashboard/StatsCard';

export default function Dashboard() { 
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Check if we navigated here with the showWelcome state
    if (location.state?.showWelcome) {
      setShowToast(true);
      // Clear the state so it doesn't show again on manual page refresh
      navigate('.', { replace: true, state: {} });
      
      // Auto-hide toast after 5 seconds
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  const welcomeName = user 
    ? `${user.firstName} ${user.lastName}` 
    : 'User';

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-100px)]">
      
      {/* Toast Notification Popup */}
      <div 
        className={`fixed top-24 right-6 z-50 transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex items-center gap-3 bg-white dark:bg-[#1a1d24] border-l-4 border-emerald-500 shadow-2xl rounded-r-xl rounded-l-sm p-4 ${
          showToast ? 'translate-x-0 opacity-100' : 'translate-x-[150%] opacity-0'
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">Login Successful!</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Welcome back, {welcomeName}</p>
        </div>
        <button onClick={() => setShowToast(false)} className="ml-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Sleek Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
         <div>
           <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
             Dashboard Overview
           </h1>
           <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
             Monitor your facility metrics, recent requests, and system activity.
           </p>
         </div>
         <div className="flex-shrink-0">
           <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
             System Online
           </span>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Total Users" stat="1,234" />
        <StatsCard title="Active Facilities" stat="56" />
        <StatsCard title="Pending Requests" stat="12" />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Left Column (Wider) */}
         <div className="lg:col-span-2 space-y-6">
           <DashboardCard title="Recent Activity">
             <div className="py-12 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center">
               <div className="w-16 h-16 mb-4 rounded-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                 <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <p className="font-medium text-gray-500 dark:text-gray-400">No recent activity detected.</p>
               <p className="text-xs mt-1">Actions performed across facilities will appear here.</p>
             </div>
           </DashboardCard>
         </div>
         
         {/* Right Column (Narrower) */}
         <div className="space-y-6">
            <DashboardCard title="Quick Actions">
              <div className="flex flex-col gap-3">
                 <button className="group flex items-center gap-3 p-3 text-sm font-medium rounded-xl text-left bg-white dark:bg-[#252830] border border-gray-100 dark:border-gray-800 shadow-sm hover:border-blue-300 hover:shadow-md dark:hover:border-blue-500/50 transition-all duration-200">
                   <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                   </div>
                   <span className="text-gray-700 dark:text-gray-200">New Facility Request</span>
                 </button>
                 
                 <button className="group flex items-center gap-3 p-3 text-sm font-medium rounded-xl text-left bg-white dark:bg-[#252830] border border-gray-100 dark:border-gray-800 shadow-sm hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-500/50 transition-all duration-200">
                   <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                   </div>
                   <span className="text-gray-700 dark:text-gray-200">Generate Report</span>
                 </button>
              </div>
            </DashboardCard>
         </div>
      </div>
    </div>
  ) 
}