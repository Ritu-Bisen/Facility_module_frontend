import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ArrowLeftStartOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', Icon: HomeIcon },
  { path: '/users',     label: 'Users',     Icon: UsersIcon },
  {
    label: 'Issue',
    Icon: ClipboardDocumentListIcon,
    subItems: [
      { path: '/ward-issues', label: 'Ward Issue' }
    ]
  },
  {
    label: 'Inter Facility',
    Icon: ClipboardDocumentListIcon,
    subItems: [
      { path: '/inter-facility-issue', label: 'Inter Facility Issue' },
      { path: '/inter-facility-receipt', label: 'Inter Facility Receipt' }
    ]
  },
  {
    label: 'Indent',
    Icon: ShoppingCartIcon,
    subItems: [
      { path: '/indent/warehouse', label: 'Indent to Warehouse' },
      { path: '/indent/warehouse-receipts', label: 'Receipts from Warehouse' }
    ]
  },
  {
    label: 'Store',
    Icon: BuildingStorefrontIcon,
    subItems: [
      { path: '/store/facility-stock-item-wise', label: 'Facility Stock - Item Wise' },
      { path: '/store/facility-stock-batch-wise', label: 'Facility Stock - Batch Wise' },
      { path: '/store/warehouse-stock', label: 'Warehouse Stock' }
    ]
  },
  { path: '/reports',   label: 'Reports',   Icon: ChartBarIcon },
  { path: '/indent/shc-approval', label: 'SHC Indent Approval', Icon: ClipboardDocumentCheckIcon },
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Build initial open state: any parent whose sub-item matches current route should be open
  const getInitialOpenMenus = () => {
    const menus = {};
    NAV_ITEMS.forEach(item => {
      if (item.subItems) {
        const hasActive = item.subItems.some(sub =>
          location.pathname === sub.path || location.pathname.startsWith(sub.path + '/')
        );
        if (hasActive) menus[item.label] = true;
      }
    });
    return menus;
  };

  const [openMenus, setOpenMenus] = useState(getInitialOpenMenus);

  // Keep parent menu open when navigating to one of its sub-items
  useEffect(() => {
    NAV_ITEMS.forEach(item => {
      if (item.subItems) {
        const hasActive = item.subItems.some(sub =>
          location.pathname === sub.path || location.pathname.startsWith(sub.path + '/')
        );
        if (hasActive) {
          setOpenMenus(prev => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleMenu = (label) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleMainMenuClick = (item) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenMenus(prev => ({ ...prev, [item.label]: true }));
    } else {
      toggleMenu(item.label);
    }
  };

  const active = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

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
      <nav className="flex flex-col gap-1 px-2 pt-3 flex-1">
        {NAV_ITEMS.map((item) => {
          if (item.subItems) {
            const isOpen = openMenus[item.label];
            const isSubActive = item.subItems.some(sub => active(sub.path));
            const Icon = item.Icon;
            return (
              <div key={item.label} className="flex flex-col">
                <button
                  onClick={() => handleMainMenuClick(item)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none
                    ${isSubActive 
                      ? 'text-white bg-white/5' 
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
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
                  <div className="pl-6 flex flex-col gap-1 mt-1 transition-all duration-300">
                    {item.subItems.map((sub) => {
                      const isActive = active(sub.path);
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all duration-150
                            ${isActive
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          } else {
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
          }
        })}
      </nav>
    </aside>
  );
}