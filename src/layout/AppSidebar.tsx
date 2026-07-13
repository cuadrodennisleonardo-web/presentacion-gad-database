import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation } from "react-router";
import { useSidebar } from "@/context/SidebarContext";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/config/supabase";

// ─── Icons (inline SVG) ─────────────────────────────────────
const DashboardIcon = () => (
  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const ResidentsIcon = () => (
  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);



const BarangaysIcon = () => (
  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const SocialDevIcon = () => (
  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);



const UsersIcon = () => (
  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const AuditLogIcon = () => (
  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ApprovalsIcon = () => (
  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4" />
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
  </svg>
);

const TableIcon = () => (
  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="9" x2="9" y2="21" />
    <line x1="15" y1="9" x2="15" y2="21" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DotsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || "size-6"} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

// ─── Navigation Types ───────────────────────────────────────
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
  badge?: boolean;
};

// ─── Sidebar Component ──────────────────────────────────────
const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const {
    isSuperAdmin,
    canManageUsers,
    canViewAuditLog,
    canAccessModule,
    role,
    department,
  } = useRole();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "admin";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  useEffect(() => {
    if (isSuperAdmin) {
      const fetchPendingCount = async () => {
        const { count } = await supabase
          .from('data_approvals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        setPendingApprovalsCount(count || 0);
      };
      
      fetchPendingCount();
      
      const channel = supabase.channel('approvals_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'data_approvals' }, fetchPendingCount)
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isSuperAdmin]);

  // Build role-aware navigation
  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [];
    const isDeptUser = role?.startsWith("dept_");

    const getDeptPath = (dept?: string | null) => {
      if (!dept) return "";
      if (dept === "Institutional GAD") return "gad";
      if (dept === "Demographics & Population") return "demographics";
      if (dept === "Justice & Safety") return "justice-safety";
      if (dept === "Local Governance") return "governance";
      return dept.toLowerCase().replace(" ", "-");
    };

    if (isDeptUser) {
      // --- DEPARTMENT VIEW (Flat structure, ordered) ---
      const deptPath = getDeptPath(department);

      // 1. Dept Dashboard
      items.push({
        icon: <SocialDevIcon />,
        name: "Dept Dashboard",
        path: `/dashboard/${deptPath}`,
      });

      // 2. Data Entry / View Data
      items.push({
        icon: <ResidentsIcon />,
        name: (role === 'dept_viewer') ? "View Data" : "Data Entry",
        path: `/data-entry/${deptPath}`,
      });

      // 3. Barangays
      items.push({
        icon: <BarangaysIcon />,
        name: "Barangays",
        path: "/barangays",
      });
    } else {
      // --- SUPERADMIN / OTHER VIEW (Hierarchical) ---
      
      // Main Dashboard
      items.push({
        icon: <DashboardIcon />,
        name: "Dashboard",
        path: "/dashboard",
      });

      // Barangays
      items.push({
        icon: <BarangaysIcon />,
        name: "Barangays",
        path: "/barangays",
      });

      // Data Entry Hub with sub-items
      if (isSuperAdmin || canAccessModule("Demographics & Population") || canAccessModule("Social Development") || canAccessModule("Economic Development") || canAccessModule("Infrastructure") || canAccessModule("Local Governance") || canAccessModule("Justice & Safety") || canAccessModule("Institutional GAD")) {
        const dataEntrySubItems = [];
        
        if (canAccessModule("Demographics & Population")) dataEntrySubItems.push({ name: "Demographics & Population", path: "/data-entry/demographics" });
        if (canAccessModule("Social Development")) dataEntrySubItems.push({ name: "Social Development", path: "/data-entry/social-development" });
        if (canAccessModule("Economic Development")) dataEntrySubItems.push({ name: "Economic Development", path: "/data-entry/economic-development" });
        if (canAccessModule("Infrastructure")) dataEntrySubItems.push({ name: "Infrastructure", path: "/data-entry/infrastructure" });
        if (canAccessModule("Local Governance")) dataEntrySubItems.push({ name: "Local Governance", path: "/data-entry/governance" });
        if (canAccessModule("Justice & Safety")) dataEntrySubItems.push({ name: "Justice & Safety", path: "/data-entry/justice-safety" });
        if (canAccessModule("Institutional GAD")) dataEntrySubItems.push({ name: "Institutional GAD", path: "/data-entry/gad" });

        if (dataEntrySubItems.length > 0) {
          items.push({
            icon: <ResidentsIcon />,
            name: (role === 'viewer' || role === 'senior_viewer') ? "View Data" : "Data Entry",
            subItems: dataEntrySubItems,
          });
        }
      }

      // Dept Dashboards Hub with sub-items
      const dashboardSubItems = [];
      if (canAccessModule("Demographics & Population")) dashboardSubItems.push({ name: "Demographics & Population", path: "/dashboard/demographics" });
      if (canAccessModule("Social Development")) dashboardSubItems.push({ name: "Social Development", path: "/dashboard/social-development" });
      if (canAccessModule("Economic Development")) dashboardSubItems.push({ name: "Economic Development", path: "/dashboard/economic-development" });
      if (canAccessModule("Infrastructure")) dashboardSubItems.push({ name: "Infrastructure", path: "/dashboard/infrastructure" });
      if (canAccessModule("Local Governance")) dashboardSubItems.push({ name: "Local Governance", path: "/dashboard/governance" });
      if (canAccessModule("Justice & Safety")) dashboardSubItems.push({ name: "Justice & Safety", path: "/dashboard/justice-safety" });
      if (canAccessModule("Institutional GAD")) dashboardSubItems.push({ name: "Institutional GAD", path: "/dashboard/gad" });

      if (dashboardSubItems.length > 0) {
        items.push({
          icon: <SocialDevIcon />,
          name: "Dept Dashboards",
          subItems: dashboardSubItems,
        });
      }
    }

    return items;
  }, [canAccessModule, isSuperAdmin, role, department]);

  // Admin-only items
  const adminItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [];

    if (canManageUsers) {
      items.push({
        icon: <UsersIcon />,
        name: "User Management",
        path: "/users",
      });
      if (isSuperAdmin) {
        items.push({
          icon: <TableIcon />,
          name: "Dynamic Tables",
          path: "/settings/dynamic-tables",
        });
      }
      items.push({
        icon: <ApprovalsIcon />,
        name: "Data Approvals",
        path: "/approvals",
        badge: pendingApprovalsCount > 0,
      });
    } else if (role === 'dept_admin') {
      items.push({
        icon: <ApprovalsIcon />,
        name: "My Submissions",
        path: "/approvals",
      });
    }
    if (canViewAuditLog) {
      items.push({
        icon: <AuditLogIcon />,
        name: "Audit Log",
        path: "/audit-logs",
      });
    }

    if (isSuperAdmin) {
      items.push({
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
        name: "Data Management",
        path: "/settings/data-management",
      });
    }

    items.push({
      icon: <SettingsIcon />,
      name: "Settings",
      path: "/settings",
    });

    return items;
  }, [canManageUsers, canViewAuditLog, pendingApprovalsCount]);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const isSubmenuActive = useCallback(
    (subItems: { path: string }[]) =>
      subItems.some((sub) => location.pathname.startsWith(sub.path)),
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    (["main", "admin"] as const).forEach((menuType) => {
      const items = menuType === "main" ? navItems : adminItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (location.pathname.startsWith(subItem.path)) {
              setOpenSubmenu({ type: menuType, index });
              submenuMatched = true;
            }
          });
        }
      });
    });
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, navItems, adminItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "admin") => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "admin") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                (openSubmenu?.type === menuType && openSubmenu?.index === index) ||
                isSubmenuActive(nav.subItems)
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  (openSubmenu?.type === menuType && openSubmenu?.index === index) ||
                  isSubmenuActive(nav.subItems)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <div className="flex flex-1 items-center justify-between">
                    <span className="menu-item-text">{nav.name}</span>
                    {nav.badge && (
                      <span className="flex h-2 w-2 rounded-full bg-error-500"></span>
                    )}
                  </div>
                )}
                {/* Mobile/Collapsed Badge */}
                {nav.badge && (!isExpanded && !isHovered && !isMobileOpen) && (
                  <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-error-500"></span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        location.pathname.startsWith(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src="/logo.png" alt="Presentacion Logo" className="h-10 w-10 shrink-0 object-contain" />
          {(isExpanded || isHovered || isMobileOpen) && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90 leading-tight">
                Presentacion
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                GAD Database
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Scrollable Nav */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Main Menu */}
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <DotsIcon className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            {/* Admin Section */}
            {adminItems.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    isSuperAdmin ? "Administration" : "Account"
                  ) : (
                    <DotsIcon className="size-6" />
                  )}
                </h2>
                {renderMenuItems(adminItems, "admin")}
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
