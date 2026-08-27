import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyMenus } from '../../features/menu/menuSlice';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ArrowLeftStartOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const dispatch = useDispatch();
  const { menus, loading, isLoaded, facilityType } = useSelector((state) => state.menu);
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});

  useEffect(() => {
    if (user && !isLoaded && !loading) {
      dispatch(fetchMyMenus());
    }
  }, [user, isLoaded, loading, dispatch]);

  const isMcFacility = user?.roleName === 'MC Facility' || 
                       user?.roleName?.toLowerCase()?.includes('mc') || 
                       facilityType === 'MC Facility' || 
                       facilityType === 'MC' || 
                       user?.facilityType === 'MC Facility' ||
                       user?.facilityType === 'MC' ||
                       user?.emailId === 'admink@gnail.com';

  const isCmeUser = user?.roleName === 'CME' || 
                    user?.roleName === 'DME' || 
                    user?.roleName?.toUpperCase()?.includes('CME') || 
                    user?.roleName?.toUpperCase()?.includes('DME') || 
                    isMcFacility;

  const hardcodedModules = [
    {
      moduleId: 'local_purchase_module',
      moduleName: 'Local Purchase',
      screens: [
        { screenId: 'lp_mas_budget', screenUrl: '/local-purchase/mas-budget', screenName: 'LP Fund Receipt', canView: true },
        { screenId: 'lp_supplier_master', screenUrl: '/local-purchase/supplier-master', screenName: 'Local Supplier Master', canView: true },
        { screenId: 'lp_tender_entry', screenUrl: '/local-purchase/tenders', screenName: 'Tender/Quotation Entry', canView: true },
        { screenId: 'lp_contracts', screenUrl: '/local-purchase/contracts', screenName: 'Contracts', canView: true },
        { screenId: 'lp_supply_orders', screenUrl: '/local-purchase/supply-orders', screenName: 'Supply Orders', canView: true },
        { screenId: 'lp_ayush_local_purchase', screenUrl: '/local-purchase/ayush-local-purchase', screenName: 'Ayush Local Purchase', canView: true },
        { screenId: 'lp_receipts_from_supplier', screenUrl: '/local-purchase/receipts-from-supplier', screenName: 'Receipts from Supplier', canView: true },
        { screenId: 'lp_local_items', screenUrl: '/local-purchase/local-items', screenName: 'Local Items Master', canView: true },
        { screenId: 'lp_noc_cancellation', screenUrl: '/local-purchase/noc-cancellation', screenName: 'NOC Cancellation', canView: true },
        { screenId: 'lp_noc_details', screenUrl: '/local-purchase/noc-lp-details', screenName: 'NOC/LP Details', canView: true },
        { screenId: 'lp_po_against_noc', screenUrl: '/local-purchase/po-against-noc', screenName: 'PO Against NOC', canView: true }
      ]
    },
    {
      moduleId: 'annual_indent_module',
      moduleName: 'Annual Indent',
      screens: [
        { screenId: 'ai_download_format', screenUrl: '/annual-indent/download-format', screenName: 'Download AI Format', canView: true },
        ...(isCmeUser ? [
          { screenId: 'ai_upload_forward', screenUrl: '/annual-indent/upload-forward', screenName: 'Upload and Forward Indent for Approval', canView: true },
          { screenId: 'ai_mc_ai', screenUrl: '/annual-indent/medical-college-ai', screenName: 'Medical College AI', canView: true },
          { screenId: 'ai_mc_vs_issuance', screenUrl: '/annual-indent/mc-hospital-ai-vs-issuance', screenName: 'Medical College/Hospital AI vs Issuance', canView: true }
        ] : [])
      ]
    },
    ...(isMcFacility ? [{
      moduleId: 'reagent_indent_module',
      moduleName: 'Reagent Indent',
      screens: [
        { screenId: 'reagent_indent_wh', screenUrl: '/reagent-indent/warehouse-indent', screenName: 'Reagent Indent(Proprietary)', canView: true },
        { screenId: 'reagent_freez_rc', screenUrl: '/reagent-indent/freez-rc-details', screenName: 'Proprietary Reagent Freez RC Details', canView: true }
      ]
    }] : []),
    {
      moduleId: 'reports_module',
      moduleName: 'Reports',
      screens: [
        { screenId: 'rpt_cgmsc_drug_wise', screenUrl: '/reports/cgmsc-receipt-drug-wise', screenName: 'Receipt from CGMSC - Drug wise', canView: true },
        { screenId: 'rpt_cgmsc_batch_wise', screenUrl: '/reports/cgmsc-receipt-batch-wise', screenName: 'Receipt from CGMSC - Batch-wise', canView: true },
        { screenId: 'rpt_date_wise_issue', screenUrl: '/reports/date-wise-facility-issue', screenName: 'Date Wise Facility Issue', canView: true }
      ]
    }
  ];

  const allModules = useMemo(() => {
    const combined = [...(menus || []), ...hardcodedModules];
    const moduleMap = new Map();

    combined.forEach((module) => {
      if (!module) return;
      const name = module.moduleName ? String(module.moduleName).trim() : '';
      if (!name) return;

      if (!moduleMap.has(name)) {
        moduleMap.set(name, {
          ...module,
          moduleName: name,
          screens: [...(module.screens || [])]
        });
      } else {
        const existing = moduleMap.get(name);
        const existingUrls = new Set((existing.screens || []).map((s) => s?.screenUrl).filter(Boolean));
        (module.screens || []).forEach((screen) => {
          if (screen && screen.screenUrl && !existingUrls.has(screen.screenUrl)) {
            existing.screens.push(screen);
            existingUrls.add(screen.screenUrl);
          }
        });
      }
    });

    return Array.from(moduleMap.values());
  }, [menus, hardcodedModules]);

  useEffect(() => {
    // Keep parent menu open when navigating to one of its sub-items
    if (allModules.length > 0) {
      const activeParents = {};
      allModules.forEach((module) => {
        if (!module || !module.moduleName) return;
        const hasActive = (module.screens || []).some(
          (sub) => sub?.screenUrl && (location.pathname === sub.screenUrl || location.pathname.startsWith(sub.screenUrl + '/'))
        );
        if (hasActive) {
          activeParents[module.moduleName] = true;
        }
      });
      if (Object.keys(activeParents).length > 0) {
        setOpenMenus((prev) => {
          let needsUpdate = false;
          for (const key in activeParents) {
            if (!prev[key]) {
              needsUpdate = true;
              break;
            }
          }
          if (!needsUpdate) return prev;
          return { ...prev, ...activeParents };
        });
      }
    }
  }, [location.pathname, allModules]);

  const toggleMenu = (label) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleMainMenuClick = (label) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenMenus(prev => ({ ...prev, [label]: true }));
    } else {
      toggleMenu(label);
    }
  };

  const active = (path) =>
    path ? (location.pathname === path || location.pathname.startsWith(path + '/')) : false;

  // Hardcoded essentials
  const baseMenus = [
    { path: '/dashboard', label: 'Dashboard', Icon: HomeIcon },
    { path: '/return-to-warehouse', label: 'Return to Warehouse', Icon: ClipboardDocumentListIcon },
    { path: '/Facility/Reports/FacHoldBatchReport.aspx', label: 'Hold Batches Report', Icon: ClipboardDocumentListIcon }
  ];

  return (
    <aside
      className={`relative flex-shrink-0 bg-[#0f172a] text-white h-full flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-56'}`}
    >
      {/* Toggle button inside sidebar - only shown at top when collapsed */}
      {collapsed && (
        <div className="flex items-center justify-center p-3 border-b border-white/10">
          <button
            onClick={() => setCollapsed(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors focus:outline-none"
            title="Expand sidebar"
          >
            <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* User avatar and Toggle button (when expanded) */}
      {user && (
        <div className={`flex items-center gap-3 px-3 py-4 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-blue-700 border border-blue-400/40 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-sm font-semibold text-white truncate">
                  {user.firstName} {user.lastName}
                </span>
                <button
                  onClick={() => setCollapsed(true)}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors focus:outline-none flex-shrink-0"
                  title="Collapse sidebar"
                >
                  <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-400 truncate mt-0.5">{user.emailId || ''}</p>
            </div>
          )}
        </div>
      )}

      {/* Nav links */}
      <nav className="flex flex-col gap-1 px-2 pt-3 pb-4 flex-1 overflow-y-auto">
        {/* Base Menus */}
        {baseMenus.map((item) => {
          const Icon = item.Icon;
          const isActive = active(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {/* Loading State */}
        {loading && !collapsed && (
          <div className="px-3 py-4 text-xs text-gray-500 animate-pulse">Loading menus...</div>
        )}

        {/* Dynamic Menus from DB & Hardcoded Modules (Only showing those with 'View' permission) */}
        {!loading && allModules.map((module) => {
          if (!module || !module.moduleName) return null;
          // Filter screens that user can view, or show all if user is admink@gnail.com
          const viewableScreens = (module.screens || []).filter(s => s && (s.canView || user?.emailId === 'admink@gnail.com'));
          
          // If no screens are viewable in this module, hide it
          if (viewableScreens.length === 0) return null;

          const isOpen = openMenus[module.moduleName];
          const isSubActive = viewableScreens.some(sub => active(sub?.screenUrl));
          const Icon = ClipboardDocumentListIcon; // Default icon for dynamic modules
          
          return (
            <div key={module.moduleId || module.moduleName} className="flex flex-col mt-1">
              <button
                onClick={() => handleMainMenuClick(module.moduleName)}
                title={collapsed ? module.moduleName : undefined}
                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none
                  ${isSubActive 
                    ? 'text-white bg-white/5' 
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{module.moduleName}</span>}
                </div>
                {!collapsed && (
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {/* Submenu items */}
              {isOpen && !collapsed && (
                <div className="pl-6 flex flex-col gap-1 mt-1 mb-2 transition-all duration-300">
                  {viewableScreens.map((sub) => {
                    if (!sub || !sub.screenUrl) return null;
                    const isActive = active(sub.screenUrl);
                    return (
                      <Link
                        key={sub.screenId || sub.screenUrl}
                        to={sub.screenUrl}
                        className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all duration-150
                          ${isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                      >
                        <span className="truncate">{sub.screenName}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

      </nav>
    </aside>
  );
}