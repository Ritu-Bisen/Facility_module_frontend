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
import { isMedicalCollegeOrDmeFacility } from '../../utils/reagentIndentHelper';

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

  const localFacType = (localStorage.getItem('facilityType') || '').trim().toUpperCase();
  const localFacTypeId = (localStorage.getItem('facilityTypeId') || '').trim();
  const localRoleName = (localStorage.getItem('roleName') || '').trim().toUpperCase();

  const userFacTypeCode = (user?.facilityTypeCode || '').trim().toUpperCase();
  const userFacTypeName = (user?.facilityTypeName || user?.facilityType || '').trim().toUpperCase();
  const userRoleName = (user?.roleName || '').trim().toUpperCase();

  // Facility check for DH, DME, DME MC / MC logins
  const isDhDmeMcFacility = 
    ['DH', 'DME', 'DME MC', 'MC', '364', '378'].includes(localFacType) ||
    ['DH', 'DME', 'DME MC', 'MC', '364', '378'].includes(userFacTypeCode) ||
    localFacType.includes('DH') || localFacType.includes('DME') || localFacType.includes('MEDICAL COLLEGE') ||
    userFacTypeName.includes('DH') || userFacTypeName.includes('DME') || userFacTypeName.includes('MEDICAL COLLEGE') ||
    localRoleName.includes('DH') || localRoleName.includes('DME') || localRoleName.includes('CME') || localRoleName.includes('MC') ||
    userRoleName.includes('DH') || userRoleName.includes('DME') || userRoleName.includes('CME') || userRoleName.includes('MC') ||
    ['364', '378'].includes(localFacTypeId) || ['364', '378'].includes(user?.facilityTypeId) || ['364', '378'].includes(user?.facilityTypeID) ||
    user?.emailId === 'admink@gnail.com';

  const isMcFacility = isMedicalCollegeOrDmeFacility(user);
  const isCmeUser = isDhDmeMcFacility;

  const userRoleId = Number(user?.roleId || user?.roleID || localStorage.getItem('roleId') || 0);
  const isDaoAyushFac = 
    userRoleId === 475 ||
    userRoleName === 'DAO AYUSH FAC' ||
    localRoleName === 'DAO AYUSH FAC' ||
    userRoleName.includes('DAO AYUSH FAC') ||
    localRoleName.includes('DAO AYUSH FAC') ||
    (userRoleName.includes('DAO') && userRoleName.includes('AYUSH')) ||
    (localRoleName.includes('DAO') && localRoleName.includes('AYUSH'));

  const isAyushUser = (userRoleName.includes('AYUSH') || 
                      localRoleName.includes('AYUSH') || 
                      userFacTypeName.includes('AYUSH') || 
                      localFacType.includes('AYUSH')) && !isDaoAyushFac;

  // CMHO role or facility check
  const isCmhoUser = userRoleName.includes('CMHO') || 
                     localRoleName.includes('CMHO') || 
                     userFacTypeCode.includes('CMHO') || 
                     localFacType.includes('CMHO') || 
                     userFacTypeName.includes('CHIEF MEDICAL') || 
                     localFacTypeId === '353' || 
                     String(user?.facilityTypeId) === '353';

  // HOD ID check:
  // In MASHODS: 2 = DHS, 3 = DME, 7 = AYUSH (or 3 as requested for AYUSH)
  const rawHodId = localStorage.getItem('hodId') || localStorage.getItem('hodid') || user?.hodId || user?.hodid;
  const currentHodId = rawHodId !== null && rawHodId !== undefined && rawHodId !== '' ? Number(rawHodId) : null;
  const isAyushHod = currentHodId === 7 || currentHodId === 3 || isAyushUser;
  const isDmeHod = currentHodId === 3 || currentHodId === 2;
  const isHod2Or3 = currentHodId === 2 || currentHodId === 3 || currentHodId === 7 || isAyushUser;

  const hardcodedModules = [
    ...(isAyushUser ? [
      {
        moduleId: 'ayush_issue_module',
        moduleName: 'Issue',
        screens: [
          { screenId: 'ayush_ward_issue', screenUrl: '/ayush-ward-issue', screenName: 'Ayush Ward Issue', canView: true }
        ]
      },
      {
        moduleId: 'program_indent_module',
        moduleName: 'Indent',
        screens: [
          { screenId: 'program_indent_list', screenUrl: '/program-indent/list', screenName: 'Program Indent', canView: true }
        ]
      }
    ] : []),
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
        ...(isDaoAyushFac ? [
          {
            screenId: 'ai_dao_approval',
            screenUrl: '/annual-indent/dao-approval',
            screenName: 'Approval Of Forwarded Indent(DAO)',
            canView: true
          },
          {
            screenId: 'ai_dao_status_report',
            screenUrl: '/annual-indent/dao-status-report',
            screenName: 'Status Report for Uploaded and Forwarded Indents(Only for DAO)',
            canView: true
          },
          {
            screenId: 'ai_dao_item_wise_ai',
            screenUrl: '/annual-indent/dao-item-wise-ai',
            screenName: 'Item Wise AI Details(DAO)',
            canView: true
          }
        ] : [
          ...(isAyushUser || currentHodId === 7 ? [
            { screenId: 'ai_upload_forward', screenUrl: '/annual-indent/upload-forward', screenName: 'Ayush Upload and Forward Indent for Approval', canView: true }
          ] : [
            { screenId: 'ai_download_format', screenUrl: '/annual-indent/download-format', screenName: 'Download AI Format', canView: true }
          ]),
          ...(isHod2Or3 && !isAyushUser && currentHodId !== 7 ? [
            { screenId: 'ai_upload_forward_dh', screenUrl: '/annual-indent/upload-forward-dh', screenName: 'Upload and Forward Annual Indent', canView: true }
          ] : []),
          ...(isMcFacility ? [
            { screenId: 'ai_mc_ai', screenUrl: '/annual-indent/medical-college-ai', screenName: 'Medical College AI', canView: true },
            { screenId: 'ai_mc_vs_issuance', screenUrl: '/annual-indent/mc-hospital-ai-vs-issuance', screenName: 'Medical College/Hospital AI vs Issuance', canView: true }
          ] : [])
        ])
      ]
    },
    ...(isMcFacility ? [{
      moduleId: 'non_edl_annual_indent_module',
      moduleName: 'NON EDL Annual Indent',
      screens: [
        {
          screenId: 'non_edl_download_format',
          screenUrl: '/non-edl-annual-indent/download-format',
          screenName: 'Download Non EDL Indent Format',
          canView: true
        },
        {
          screenId: 'non_edl_upload_forward',
          screenUrl: '/non-edl-annual-indent/upload-forward',
          screenName: 'Upload and forward NON EDL indent for approval',
          canView: true
        },
        {
          screenId: 'non_edl_download_reagent_format',
          screenUrl: '/non-edl-annual-indent/download-reagent-format',
          screenName: 'Download Reagent/Non EDL Consumables and Kits Format',
          canView: true
        },
        {
          screenId: 'non_edl_upload_forward_reagent',
          screenUrl: '/non-edl-annual-indent/upload-forward-reagent',
          screenName: 'Upload and forward Reagent/Non EDL Consumables and Kits',
          canView: true
        }
      ]
    }] : []),
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
    // Collect URLs and names that are explicitly disabled (canView === false) from dynamic menus
    const disabledUrls = new Set();
    (menus || []).forEach(m => {
      (m?.screens || []).forEach(s => {
        if (s?.canView === false) {
          if (s?.screenUrl) disabledUrls.add(s.screenUrl.toLowerCase());
          if (s?.screenName) disabledUrls.add(s.screenName.toLowerCase());
        }
      });
    });

    // Filter dynamic backend menus based on permissions (canView, HOD, and CMHO)
    const filteredMenus = (menus || []).filter(m => {
      const modName = (m?.moduleName || '').toLowerCase();
      if (!isMedicalCollegeOrDmeFacility(user) && (modName.includes('reagent') || modName.includes('reagent indent') || modName.includes('non edl') || modName.includes('non-edl'))) {
        return false;
      }
      return true;
    }).map(m => {
      if (!m || !m.screens) return m;
      return {
        ...m,
        screens: m.screens.filter(s => {
          // If screen is explicitly deselected/disallowed
          if (s.canView === false) return false;

          const url = (s?.screenUrl || '').toLowerCase();
          const name = (s?.screenName || '').toLowerCase();

          // Reagent Indent screens: show ONLY to Medical College and DME facilities
          if (!isMedicalCollegeOrDmeFacility(user) && (url.includes('reagent-indent') || name.includes('reagent indent') || url.includes('freez-rc-details') || name.includes('reagent') || url.includes('non-edl') || name.includes('non edl') || name.includes('non-edl') || url.includes('medical-college') || name.includes('medical college') || url.includes('mc-hospital') || name.includes('mc/hospital'))) {
            return false;
          }

          // Annual Indent Distribution only allowed for CMHO
          if (!isCmhoUser && (url.includes('distribution') || name.includes('distribution'))) {
            return false;
          }

          // DAO specific screens: show ONLY if isDaoAyushFac
          const isDaoScreen = url.includes('daoapproval') || 
                              url.includes('ayushdaoannualindentstatus') || 
                              url.includes('ayushdrugwiseaireport') ||
                              url.includes('dao-approval') ||
                              url.includes('dao-status-report') ||
                              url.includes('dao-item-wise-ai') ||
                              name.includes('approval of forwarded indent(dao)') ||
                              name.includes('status report for uploaded and forwarded indents(only for dao)') ||
                              name.includes('item wise ai details(dao)') ||
                              (name.includes('(dao)') && (name.includes('approval') || name.includes('status') || name.includes('ai details')));

          if (!isDaoAyushFac && isDaoScreen) {
            return false;
          }

          // If DAO user, under annual indent don't show regular facility upload/download screens
          if (isDaoAyushFac && (url.includes('upload-forward') || url.includes('download-format') || name.includes('upload and forward') || name.includes('download ai format'))) {
            return false;
          }

          // If user's HOD is not 2 or 3 or 7, filter out upload-forward
          if (!isHod2Or3) {
            if (url.includes('upload-forward') || name.includes('upload and forward') || name.includes('forward indent')) {
              return false;
            }
          }
          return true;
        })
      };
    }).filter(m => (m?.screens?.length || 0) > 0);

    // Filter hardcoded modules so they don't resurrect screens that were deselected
    const cleanedHardcoded = hardcodedModules.map(m => ({
      ...m,
      screens: (m.screens || []).filter(s => {
        const url = (s?.screenUrl || '').toLowerCase();
        const name = (s?.screenName || '').toLowerCase();
        return !disabledUrls.has(url) && !disabledUrls.has(name);
      })
    })).filter(m => (m?.screens?.length || 0) > 0);

    const combined = [...filteredMenus, ...cleanedHardcoded];
    const moduleMap = new Map();

    combined.forEach((module) => {
      if (!module) return;
      const name = module.moduleName ? String(module.moduleName).trim() : '';
      if (!name) return;

      const normalizedScreens = (module.screens || []).map(s => {
        if (!s) return s;
        const sUrl = (s.screenUrl || '').toLowerCase();
        const sName = (s.screenName || '').toLowerCase();
        if (sUrl.includes('anualindentdownloadexcelregeant') || sName.includes('download reagent/non edl')) {
          return { ...s, screenUrl: '/non-edl-annual-indent/download-reagent-format' };
        }
        if (sUrl.includes('reagentanualindentmain') || sName.includes('upload and forward reagent') || sUrl.includes('reagentanualitemindent')) {
          return { ...s, screenUrl: '/non-edl-annual-indent/upload-forward-reagent' };
        }
        if (sUrl.includes('daoapproval') || sName.includes('approval of forwarded indent(dao)')) {
          return { ...s, screenName: 'Approval Of Forwarded Indent(DAO)', screenUrl: '/annual-indent/dao-approval' };
        }
        if (sUrl.includes('ayushdaoannualindentstatus') || sName.includes('status report for uploaded and forwarded indents(only for dao)')) {
          return { ...s, screenName: 'Status Report for Uploaded and Forwarded Indents(Only for DAO)', screenUrl: '/annual-indent/dao-status-report' };
        }
        if (sUrl.includes('ayushdrugwiseaireport') || sName.includes('item wise ai details(dao)')) {
          return { ...s, screenName: 'Item Wise AI Details(DAO)', screenUrl: '/annual-indent/dao-item-wise-ai' };
        }
        if (sUrl.includes('spfacilityreceiptsother') || sUrl.includes('spfacilityreceiptother') || sName.toLowerCase() === 'special receipt') {
          return { ...s, screenName: 'Special Receipt', screenUrl: '/special-receipt' };
        }
        if (sUrl.includes('expiresfac') || sUrl.includes('expirefac') || sName.toLowerCase().includes('expire items list') || sName.toLowerCase().includes('expiry voucher') || sName.toLowerCase() === 'expired') {
          return { ...s, screenName: 'Expiry Voucher', screenUrl: '/expiry-voucher' };
        }
        return s;
      });

      if (!moduleMap.has(name)) {
        moduleMap.set(name, {
          ...module,
          moduleName: name,
          screens: [...normalizedScreens]
        });
      } else {
        const existing = moduleMap.get(name);
        const existingUrls = new Set((existing.screens || []).map((s) => s?.screenUrl).filter(Boolean));
        normalizedScreens.forEach((screen) => {
          if (screen && screen.screenUrl && !existingUrls.has(screen.screenUrl)) {
            existing.screens.push(screen);
            existingUrls.add(screen.screenUrl);
          }
        });
      }
    });

    return Array.from(moduleMap.values());
  }, [menus, hardcodedModules, isHod2Or3, isCmhoUser, isDaoAyushFac]);

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
    { path: '/opening-stock', label: 'Opening Stock', Icon: ClipboardDocumentListIcon },
    { path: '/special-receipt', label: 'Special Receipt', Icon: ClipboardDocumentListIcon },
    { path: '/expiry-voucher', label: 'Expiry Voucher', Icon: ClipboardDocumentListIcon },
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
                onDoubleClick={() => {
                  if (!collapsed) {
                    setOpenMenus(prev => ({ ...prev, [module.moduleName]: false }));
                  }
                }}
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