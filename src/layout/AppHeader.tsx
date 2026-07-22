import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { cn, getRelativeTime } from "@/lib/utils";
import { useSidebar } from "@/context/SidebarContext";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { ROLE_LABELS } from "@/lib/constants";
import type { Department } from "@/types";
import { useNotifications } from "@/context/NotificationContext";

const AppHeader: React.FC = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { user, signOut } = useAuth();
  const { role, isSuperAdmin, canManageUsers, canViewAuditLog, canAccessModule, department } = useRole();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    setIsNotificationsOpen(false);
    if (notification.type?.startsWith('approval_')) {
      navigate('/approvals');
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchItems = useMemo(() => {
    const items: { name: string; path: string; category: string; keywords?: string }[] = [];
    const isDeptUser = role?.startsWith("dept_");

    const getDeptPath = (dept?: string | null) => {
      if (!dept) return "";
      if (dept === "Institutional GAD") return "gad";
      return dept.toLowerCase().replace("& ", "").replace(/\s+/g, "-");
    };

    const isAuthorizedForDept = (deptName: Department) => {
      if (isSuperAdmin) return true;
      if (isDeptUser && department === deptName) return true;
      return canAccessModule(deptName);
    };

    if (!isDeptUser || isSuperAdmin) {
      items.push({ name: "Main Overview Dashboard", path: "/dashboard", category: "Menu", keywords: "home main dashboard overview summary" });
    }
    items.push({ name: "Barangays List", path: "/barangays", category: "Menu", keywords: "barangay list locations directory" });

    const ALL_DEPARTMENTS: { name: Department; indicators: { name: string; keywords: string }[] }[] = [
      {
        name: "Demographics & Population",
        indicators: [
          { name: "Total Population & Household Heads", keywords: "population household heads demographics residents census" }
        ]
      },
      {
        name: "Social Development",
        indicators: [
          { name: "Education & Student Enrollment", keywords: "student enrollment dropouts osy school education" },
          { name: "Health & Malnourished Children", keywords: "health malnourished nutrition teenage pregnancy maternal mortality" },
          { name: "Social Welfare (PWD, 4Ps, Senior Citizens, Solo Parents)", keywords: "pwd 4ps senior citizens solo parents welfare disability" }
        ]
      },
      {
        name: "Economic Development",
        indicators: [
          { name: "Labor Force & Employment", keywords: "employment labor employed unemployed jobs work" },
          { name: "Agriculture & Fisheries (Farmers, Fisherfolks)", keywords: "farmers fisherfolks agriculture fishing crops fish" },
          { name: "Commerce & Trade (Business Owners, Vendors)", keywords: "business owners ambulant vendors commerce trade market stores" }
        ]
      },
      {
        name: "Infrastructure",
        indicators: [
          { name: "Utilities & Housing (Safe Water, Sanitary Toilets, Informal Settlers)", keywords: "safe water sanitary toilets informal settlers utilities housing infrastructure water toilet" }
        ]
      },
      {
        name: "Local Governance",
        indicators: [
          { name: "Local Governance & Officials (Elected, Appointed Heads)", keywords: "elected officials appointed department heads governance leadership barangay officials" }
        ]
      },
      {
        name: "Justice & Safety",
        indicators: [
          { name: "Justice & Protection (VAWC, CICL, Sexual Assault)", keywords: "vawc cicl sexual assault justice protection cases police safety crime" }
        ]
      },
      {
        name: "Institutional GAD",
        indicators: [
          { name: "Institutional GAD Budget & Trainings", keywords: "gad budget allocated utilized trainings participants institutional" }
        ]
      }
    ];

    ALL_DEPARTMENTS.forEach((deptObj) => {
      if (isAuthorizedForDept(deptObj.name)) {
        const pathSlug = getDeptPath(deptObj.name);
        const nameSuffix = (role === 'viewer' || role === 'senior_viewer' || role === 'dept_viewer') ? "View Data" : "Data Entry";
        
        items.push({ 
          name: `${deptObj.name} (${nameSuffix})`, 
          path: `/data-entry/${pathSlug}`, 
          category: (role === 'viewer' || role === 'senior_viewer' || role === 'dept_viewer') ? "View Data" : "Data Entry",
          keywords: `${deptObj.name} data entry view input grid table` 
        });
        
        items.push({ 
          name: `${deptObj.name} Dashboard`, 
          path: `/dashboard/${pathSlug}`, 
          category: "Dashboards",
          keywords: `${deptObj.name} dashboard charts overview analytics` 
        });

        deptObj.indicators.forEach(ind => {
          items.push({
            name: ind.name,
            path: `/data-entry/${pathSlug}`,
            category: "Indicators",
            keywords: `${deptObj.name} ${ind.keywords}`
          });
        });
      }
    });

    if (canManageUsers) {
      items.push({ name: "User Management", path: "/users", category: "Administration", keywords: "users accounts roles superadmin admin viewers create user password email" });
      items.push({ name: "Data Approvals", path: "/approvals", category: "Administration", keywords: "approvals pending submissions requests review approve reject" });
      items.push({ name: "Dynamic Tables", path: "/settings/dynamic-tables", category: "Administration", keywords: "dynamic tables schema custom fields tabs create table" });
      items.push({ name: "Data Management", path: "/settings/data-management", category: "Administration", keywords: "data management delete reset tables wipe clear remove data" });
    } else if (role === 'dept_admin') {
      items.push({ name: "My Submissions & Approvals", path: "/approvals", category: "Menu", keywords: "approvals submissions status pending" });
    }
    
    if (canViewAuditLog) {
      items.push({ name: "Audit Log & System Activity", path: "/audit-logs", category: "Administration", keywords: "audit log activity events history logins data changes updates" });
    }
    
    items.push({ name: "Profile & Account Settings", path: "/settings", category: "Account", keywords: "profile settings account password email name theme" });

    return items;
  }, [role, isSuperAdmin, canManageUsers, canViewAuditLog, canAccessModule, department]);

  const filteredSearchItems = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase().trim();
    return searchItems.filter((item) => 
      item.name.toLowerCase().includes(q) || 
      item.category.toLowerCase().includes(q) ||
      (item.keywords && item.keywords.toLowerCase().includes(q))
    );
  }, [searchQuery, searchItems]);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut();
  };

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-40 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          {/* Sidebar Toggle */}
          <button
            className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-40 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor" />
              </svg>
            )}
          </button>

          {/* Mobile Logo */}
          <Link to="/dashboard" className="lg:hidden flex items-center gap-2">
            <img src="/logo.png" alt="Presentacion Logo" className="h-8 w-8 shrink-0 object-contain" />
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Presentacion
            </span>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden lg:block flex-1 max-w-md relative">
            <div className="relative">
              <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search menu, pages, etc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            
            {/* Universal Search Dropdown */}
            {isSearchFocused && searchQuery && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 z-50 overflow-hidden">
                {filteredSearchItems.length > 0 ? (
                  <ul className="max-h-80 overflow-y-auto p-2">
                    {filteredSearchItems.map((item, idx) => (
                      <li key={idx}>
                        <Link 
                          to={item.path}
                          onClick={() => {
                             setSearchQuery("");
                             setIsSearchFocused(false);
                          }}
                          className="flex flex-col rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{item.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{item.category}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu toggle (dots) */}
          <div className="lg:hidden relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z" fill="currentColor" />
              </svg>
            </button>
            
            {/* Mobile Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                      {user?.profile?.full_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between px-3 py-2 mb-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
                    <ThemeToggleButton />
                  </div>

                  <button
                    onClick={() => { setIsUserMenuOpen(false); setIsNotificationsOpen(true); }}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg border-b border-gray-100 dark:border-gray-800 mb-1"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Notifications
                    </div>
                    {unreadCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-error-500 px-1.5 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <Link
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    My Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
          {/* Notifications Dropdown Container (Mobile Absolute / Desktop Relative) */}
          {/* We must render this dropdown so it works when opened from mobile OR desktop */}
          {isNotificationsOpen && (
            <div className="lg:hidden">
              <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
              <div className="absolute right-4 top-[70px] z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-brand-500 hover:text-brand-600 font-medium">Mark all as read</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                        {notifications.map(notification => (
                          <li key={notification.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition ${!notification.is_read ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`} onClick={() => handleNotificationClick(notification)}>
                            <div className="flex gap-3">
                              <div className={cn(
                                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                                notification.type === 'approval_approved' ? "bg-success-50 border-success-100 text-success-600 dark:bg-success-900/20 dark:border-success-800 dark:text-success-500" :
                                notification.type === 'approval_rejected' ? "bg-error-50 border-error-100 text-error-600 dark:bg-error-900/20 dark:border-error-800 dark:text-error-500" :
                                "bg-brand-50 border-brand-100 text-brand-600 dark:bg-brand-900/20 dark:border-brand-800 dark:text-brand-500"
                              )}>
                                {notification.type === 'approval_approved' ? (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                ) : notification.type === 'approval_rejected' ? (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                ) : (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{notification.title}</p>
                                  {!notification.is_read && (
                                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-wrap">{notification.message}</p>
                                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-2">
                                  {getRelativeTime(notification.created_at)}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-sm text-gray-500">No notifications yet</p>
                      </div>
                    )}
                  </div>
                  {isSuperAdmin && (
                    <Link to="/approvals" onClick={() => setIsNotificationsOpen(false)} className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition block">
                      View Data Approvals
                    </Link>
                  )}
              </div>
            </div>
          )}

        </div>

        {/* Right side - Theme toggle + Notifications + User dropdown */}
        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggleButton />

          {/* Notifications Dropdown (Desktop) */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-900">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40 lg:block hidden" onClick={() => setIsNotificationsOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-brand-500 hover:text-brand-600 font-medium">Mark all as read</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                        {notifications.map(notification => (
                          <li key={notification.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition ${!notification.is_read ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`} onClick={() => handleNotificationClick(notification)}>
                            <div className="flex gap-3">
                              {/* Notification Icon */}
                              <div className={cn(
                                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                                notification.type === 'approval_approved' ? "bg-success-50 border-success-100 text-success-600 dark:bg-success-900/20 dark:border-success-800 dark:text-success-500" :
                                notification.type === 'approval_rejected' ? "bg-error-50 border-error-100 text-error-600 dark:bg-error-900/20 dark:border-error-800 dark:text-error-500" :
                                "bg-brand-50 border-brand-100 text-brand-600 dark:bg-brand-900/20 dark:border-brand-800 dark:text-brand-500"
                              )}>
                                {notification.type === 'approval_approved' ? (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                ) : notification.type === 'approval_rejected' ? (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                ) : (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{notification.title}</p>
                                  {!notification.is_read && (
                                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-wrap">{notification.message}</p>
                                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-2">
                                  {getRelativeTime(notification.created_at)}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-sm text-gray-500">No notifications yet</p>
                      </div>
                    )}
                  </div>
                  {isSuperAdmin && (
                    <Link to="/approvals" onClick={() => setIsNotificationsOpen(false)} className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition block">
                      View Data Approvals
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="hidden xl:block text-left max-w-[120px]">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                  {user?.profile?.full_name || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {role ? ROLE_LABELS[role] : "—"}
                </p>
              </div>
              <svg
                className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  strokeWidth="1.67"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {user?.profile?.full_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    My Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
