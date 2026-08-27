import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSelector } from 'react-redux';
import DashboardCard from '../../components/dashboard/DashboardCard';
import { storeAPI } from '../store/storeAPI';
import { getFinancialYears, getWarehouseIndents } from '../../api/warehouseReceiptApi';
import { getIndentsToOtherFacility } from '../../api/indentToOtherFacilityApi';
import { getShcIndents } from '../../api/shcIndentApi';
import api from '../../api/axios';

export default function Dashboard() { 
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { menus } = useSelector((state) => state.menu);
  const [showToast, setShowToast] = useState(false);

  const hasMenuAccess = (url) => {
    if (user?.emailId === 'admink@gnail.com') return true;
    if (!Array.isArray(menus)) return false;
    
    for (const module of menus) {
      if (module && Array.isArray(module.screens)) {
        for (const screen of module.screens) {
          if (screen && screen.screenUrl === url && screen.canView) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const [nearExpiryData, setNearExpiryData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showList, setShowList] = useState(false);

  const [pendingReceiptsCount, setPendingReceiptsCount] = useState(0);
  const [loadingPendingReceipts, setLoadingPendingReceipts] = useState(true);

  const [pendingIndentsCount, setPendingIndentsCount] = useState(0);
  const [loadingPendingIndents, setLoadingPendingIndents] = useState(true);

  const [shcPendingIndentsCount, setShcPendingIndentsCount] = useState(0);
  const [loadingShcPendingIndents, setLoadingShcPendingIndents] = useState(true);

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

  useEffect(() => {
    if (user?.facilityId) {
      const fetchStats = async () => {
        try {
          const result = await storeAPI.getFacilityStockDrugWise(user.facilityId);
          if (Array.isArray(result)) {
            // Filter for <= 90 days
            const expiring = result.filter(item => item && ((item.EXPDAYSSTATUS || item.expdaysstatus) === '<=90 days'));
            setNearExpiryData(expiring);
          }
        } catch (e) {
          console.error('Failed to fetch stats', e);
        } finally {
          setLoadingStats(false);
        }
      };
      fetchStats();
    } else {
      setLoadingStats(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.facilityId) {
      const fetchPendingReceipts = async () => {
        try {
          const finRes = await getFinancialYears();
          if (finRes.success && Array.isArray(finRes.data) && finRes.data.length > 0) {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth(); // 0 = Jan, 3 = Apr
            let finYearString = currentMonth >= 3 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
            const defaultYearObj = finRes.data.find(y => 
              y && (y.year === finYearString || 
              y.year === finYearString.replace(/20/g, '') ||
              (y.year && y.year.includes(finYearString.split('-')[0].slice(-2) + '-' + finYearString.split('-')[1].slice(-2))))
            );
            const yearId = defaultYearObj ? defaultYearObj.id : finRes.data[0].id;

            const indentsRes = await getWarehouseIndents(yearId);
            if (indentsRes.success && Array.isArray(indentsRes.data)) {
              const pendingCount = indentsRes.data.filter(i => 
                i && (i.receiptStatus === 'Yet to be Received' || i.receiptStatus === 'Partial Receipt' || i.receiptStatus === 'Incomplete')
              ).length;
              setPendingReceiptsCount(pendingCount);
            }
          }
        } catch (error) {
          console.error("Failed to fetch pending receipts", error);
        } finally {
          setLoadingPendingReceipts(false);
        }
      };
      fetchPendingReceipts();
    }
  }, [user]);

  useEffect(() => {
    if (user?.facilityId) {
      const fetchPendingIndents = async () => {
        try {
          const res = await api.get('/shc-inter-facility-transfers/fin-years');
          const mappedYears = (res.data?.data || []).map(y => 
            Array.isArray(y) ? { AccYrSetID: y[0], SHAccYear: y[1] } : { AccYrSetID: y?.id || y?.ACCYRSETID, SHAccYear: y?.year || y?.AccYear }
          );
          if (mappedYears.length > 0) {
            const yearId = mappedYears[0].AccYrSetID;
            const indentsRes = await getIndentsToOtherFacility(yearId, 'I');
            if (indentsRes.success && Array.isArray(indentsRes.data)) {
              setPendingIndentsCount(indentsRes.data.length);
            }
          }
        } catch (error) {
          console.error("Failed to fetch pending indents", error);
        } finally {
          setLoadingPendingIndents(false);
        }
      };
      fetchPendingIndents();
    }
  }, [user]);

  useEffect(() => {
    if (user?.facilityId) {
      const fetchShcPendingIndents = async () => {
        try {
          const finRes = await getFinancialYears();
          if (finRes.success && Array.isArray(finRes.data) && finRes.data.length > 0) {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            let finYearString = currentMonth >= 3 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
            const defaultYearObj = finRes.data.find(y => 
              y && (y.year === finYearString || 
              y.year === finYearString.replace(/20/g, '') ||
              (y.year && y.year.includes(finYearString.split('-')[0].slice(-2) + '-' + finYearString.split('-')[1].slice(-2))))
            );
            const yearId = defaultYearObj ? defaultYearObj.id : finRes.data[0].id;

            const indentsRes = await getShcIndents(user.facilityId, yearId, 'I');
            if (indentsRes.success && Array.isArray(indentsRes.data)) {
              setShcPendingIndentsCount(indentsRes.data.length);
            }
          }
        } catch (error) {
          console.error("Failed to fetch AAM/SHC indents approval", error);
        } finally {
          setLoadingShcPendingIndents(false);
        }
      };
      fetchShcPendingIndents();
    }
  }, [user]);

  const welcomeName = user 
    ? `${user.firstName} ${user.lastName}` 
    : 'User';

  return (
    <>
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

      <div className="flex flex-col gap-4 relative min-h-[calc(100vh-100px)]">
        {/* Sleek Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-2">
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
      <div className={`grid grid-cols-1 md:grid-cols-2 ${user?.roleName !== 'DHFAC' && hasMenuAccess('/indent/shc-approval') ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-6`}>
        <div 
          onClick={() => setShowList(!showList)}
          className="bg-white dark:bg-[#1a1d24] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-red-200 transition-all group"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Expiring &lt;= 90 Days</h3>
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="mt-4">
            {loadingStats ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {nearExpiryData.length}
              </span>
            )}
          </div>
        </div>

        <div 
          onClick={() => navigate('/indent/warehouse-receipts', { state: { filterPending: true } })}
          className="bg-white dark:bg-[#1a1d24] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-orange-200 transition-all group"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Pending Receipts</h3>
            <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
          </div>
          <div className="mt-4">
            {loadingPendingReceipts ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {pendingReceiptsCount}
              </span>
            )}
          </div>
        </div>

        <div 
          onClick={() => navigate('/indent-to-other-facility', { state: { statusFilter: 'I' } })}
          className="bg-white dark:bg-[#1a1d24] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Pending Indents</h3>
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            </div>
          </div>
          <div className="mt-4">
            {loadingPendingIndents ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {pendingIndentsCount}
              </span>
            )}
          </div>
        </div>

        {user?.roleName !== 'DHFAC' && hasMenuAccess('/indent/shc-approval') && (
          <div 
            onClick={() => navigate('/indent/shc-approval', { state: { statusFilter: 'I' } })}
            className="bg-white dark:bg-[#1a1d24] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-purple-200 transition-all group"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">AAM/SHC Indents Approval</h3>
              <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
            </div>
            <div className="mt-4">
              {loadingShcPendingIndents ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {shcPendingIndentsCount}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expired Items List */}
      {showList && (
        <div className="bg-white dark:bg-[#1a1d24] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 dark:text-white">Items Expiring in &lt;= 90 Days</h3>
            <button onClick={() => setShowList(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {nearExpiryData.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-xs uppercase">Item Code</th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase">Item Name</th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase">Exp Date</th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase">Batch No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {nearExpiryData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-3 font-mono text-xs">{item.ITEMCODE || item.itemcode}</td>
                      <td className="px-6 py-3 font-medium">{item.ITEMNAME || item.itemname}</td>
                      <td className="px-6 py-3 text-red-600 font-bold">{item.EXPDATEDDMMYY || item.expdateddmmyy || item.expdate}</td>
                      <td className="px-6 py-3 font-mono text-xs text-gray-500">{item.BATCHNO || item.batchno}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">No items expiring within 90 days.</div>
            )}
          </div>
        </div>
      )}

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
    </>
  );
}