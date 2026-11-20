import {
  LayoutDashboard,
  FileSearch,
  BookOpen,
  ShieldCheck,
  Clock,
  BarChart3,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useNotifications } from "@/lib/query/hooks/procurement/useNotifications";
import { useActions } from "@/lib/query/hooks/procurement/useActions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LogoutModal } from "@/components/ui/LogoutModal";
import { useLogout } from "@/lib/query/hooks/auth/useCurrentUser";

interface NavItemDef {
  id: string;
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  lens?: string;
}

interface NavGroupDef {
  title: string;
  items: NavItemDef[];
}

const NAV_GROUPS: NavGroupDef[] = [
  {
    title: "Dokumen & Standar",
    items: [
      { id: "documents", href: "/dashboard/documents", label: "Pemeriksaan Dokumen", icon: FileSearch },
      { id: "templates", href: "/dashboard/documents/templates", label: "Template & Tahapan", icon: BookOpen },
    ],
  },
  {
    title: "Pekerjaan & Jaminan",
    items: [
      { id: "overview-jobs", href: "/dashboard/overview", label: "Daftar Pekerjaan", icon: LayoutDashboard, lens: "jobs" },
      { id: "overview-guarantees", href: "/dashboard/overview?lens=guarantees", label: "Warkat Jaminan", icon: ShieldCheck, lens: "guarantees" },
      { id: "overview-sla", href: "/dashboard/overview?lens=sla-actions", label: "SLA & Tindak Lanjut", icon: Clock, lens: "sla-actions" },
      { id: "overview-analytics", href: "/dashboard/overview?lens=analytics", label: "Analitik & Performa", icon: BarChart3, lens: "analytics" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { id: "notifications", href: "/dashboard/notifications", label: "Notifikasi", icon: Bell },
      { id: "settings", href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
    ],
  },
];

interface SidebarNavProps {
  onLogout?: () => void;
}

export function SidebarNav({ onLogout }: SidebarNavProps = {}) {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { data: notifications = [] } = useNotifications();
  const { data: actions = [] } = useActions();
  const pathname = usePathname();
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [currentLens, setCurrentLens] = useState<string>("jobs");
  const defaultLogout = useLogout();
  const handleLogout = onLogout ?? defaultLogout;
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const pendingActionsCount = actions.filter(a => a.status === "Pending").length;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncLensFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const lens = params.get("lens") || "jobs";
      setCurrentLens(lens);
    };

    const handleLensEvent = (evt: Event) => {
      const custom = evt as CustomEvent<string>;
      if (custom.detail) {
        setCurrentLens(custom.detail);
      } else {
        syncLensFromUrl();
      }
    };

    syncLensFromUrl();
    window.addEventListener("prima-lens-change", handleLensEvent);
    window.addEventListener("popstate", syncLensFromUrl);
    return () => {
      window.removeEventListener("prima-lens-change", handleLensEvent);
      window.removeEventListener("popstate", syncLensFromUrl);
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const effectiveCollapsed = isMobileViewport ? false : collapsed;

  const containerClasses = cn(
    "fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-40 transition-all duration-300 ease-in-out flex flex-col",
    effectiveCollapsed ? "lg:w-20" : "lg:w-56",
    "w-[280px]",
    mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
    "lg:translate-x-0 lg:static lg:shadow-none"
  );

  const navItemClasses = (active: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-xl border-none px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-150 relative focus:outline-none",
      active
        ? "bg-[#eaf3ff] text-[#0a4d8c] shadow-2xs"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      effectiveCollapsed ? "lg:justify-center lg:px-2" : "lg:justify-start lg:px-3"
    );

  const isNavItemActive = (item: NavItemDef): boolean => {
    if (!pathname) return false;
    if (item.id === "templates") {
      return pathname.startsWith("/dashboard/documents/templates");
    }
    if (item.id === "documents") {
      return (
        pathname.startsWith("/dashboard/documents") &&
        !pathname.startsWith("/dashboard/documents/templates")
      );
    }
    if (item.lens) {
      if (pathname.startsWith("/dashboard/overview/guarantees")) {
        return item.lens === "guarantees";
      }
      if (!pathname.startsWith("/dashboard/overview")) return false;
      if (/^\/dashboard\/overview\/[^/]+/.test(pathname)) {
        return item.lens === "jobs";
      }
      return currentLens === item.lens;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <aside className={containerClasses}>
      <div className="flex h-20 lg:h-[84px] items-center justify-center border-b border-slate-200 px-4 relative shrink-0">
        <div
          className={`flex items-center ${effectiveCollapsed ? "justify-center" : "w-full justify-center"}`}
          aria-label="Pertamina Procurement logo"
        >
          {effectiveCollapsed ? (
            <img
              src="/pertamina-minimize.png"
              alt="Pertamina Procurement"
              className="h-8 w-8 object-contain"
            />
          ) : (
            <img
              src="/pertamina-full.png"
              alt="Pertamina Procurement"
              className="h-8 w-auto object-contain"
            />
          )}
        </div>

        <button
          type="button"
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 items-center justify-center rounded-full bg-[#0a4d8c] text-white hover:bg-[#093e6f] transition-colors z-10 shadow-sm focus:outline-none"
          aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => toggleCollapsed()}
        >
          {effectiveCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-4 py-4 overflow-y-auto",
          effectiveCollapsed ? "px-2 hide-scrollbar" : "px-3"
        )}
        aria-label="Sidebar navigation"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            {!effectiveCollapsed ? (
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </div>
            ) : (
              <div className="mx-3 my-1 border-t border-slate-100 first:hidden" />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(item);
              const showUnread = item.id === "notifications" && unreadCount > 0;
              const showPendingSla = item.id === "overview-sla" && pendingActionsCount > 0;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={navItemClasses(isActive)}
                  onClick={() => {
                    setMobileOpen(false);
                    if (item.lens && typeof window !== "undefined") {
                      setCurrentLens(item.lens);
                      window.dispatchEvent(
                        new CustomEvent("prima-lens-change", { detail: item.lens })
                      );
                    }
                  }}
                  aria-current={isActive ? "page" : undefined}
                  title={effectiveCollapsed ? item.label : undefined}
                >
                  <Icon size={17} className="transition-colors shrink-0" />
                  {!effectiveCollapsed && (
                    <span className="flex-1 flex items-center justify-between gap-2 min-w-0">
                      <span className="truncate">{item.label}</span>
                      {showUnread && (
                        <span className="bg-[#0a4d8c] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                      {showPendingSla && (
                        <span
                          title={`${pendingActionsCount} tindakan menunggu`}
                          className="bg-[#0a4d8c] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                        >
                          {pendingActionsCount > 99 ? "99+" : pendingActionsCount}
                        </span>
                      )}
                    </span>
                  )}
                  {effectiveCollapsed && (showUnread || showPendingSla) && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#0a4d8c] rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-200 px-3 py-4">
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            setLogoutOpen(true);
          }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-[12px] border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none",
            !effectiveCollapsed && "justify-start"
          )}
        >
          <LogOut size={16} />
          {!effectiveCollapsed && <span>Keluar</span>}
        </button>
      </div>

      <LogoutModal
        isOpen={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          handleLogout();
        }}
      />
    </aside>
  );
}
