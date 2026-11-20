import {
  Compass,
  MessageSquare,
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

interface SubNavItemDef {
  id: string;
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  lens?: string;
}

interface MainNavItemDef {
  id: "onboarding" | "documents" | "overview" | "notifications" | "settings";
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  subItems?: SubNavItemDef[];
}

const MAIN_NAV_ITEMS: MainNavItemDef[] = [
  {
    id: "onboarding",
    href: "/dashboard/onboarding",
    label: "Beranda",
    icon: Compass,
    subItems: [
      {
        id: "onboarding-chat",
        href: "/dashboard/onboarding/chat",
        label: "Diskusi AI",
        icon: MessageSquare,
      },
    ],
  },
  {
    id: "documents",
    href: "/dashboard/documents",
    label: "Pemeriksaan Dokumen",
    icon: FileSearch,
    subItems: [
      {
        id: "templates",
        href: "/dashboard/documents/templates",
        label: "Template & Tahapan",
        icon: BookOpen,
      },
    ],
  },
  {
    id: "overview",
    href: "/dashboard/overview",
    label: "Daftar Pekerjaan",
    icon: LayoutDashboard,
    subItems: [
      {
        id: "overview-guarantees",
        href: "/dashboard/overview?lens=guarantees",
        label: "Warkat Jaminan",
        icon: ShieldCheck,
        lens: "guarantees",
      },
      {
        id: "overview-sla",
        href: "/dashboard/overview?lens=sla-actions",
        label: "SLA & Tindak Lanjut",
        icon: Clock,
        lens: "sla-actions",
      },
      {
        id: "overview-analytics",
        href: "/dashboard/overview?lens=analytics",
        label: "Analitik & Performa",
        icon: BarChart3,
        lens: "analytics",
      },
    ],
  },
  {
    id: "notifications",
    href: "/dashboard/notifications",
    label: "Notifikasi",
    icon: Bell,
  },
  {
    id: "settings",
    href: "/dashboard/settings",
    label: "Pengaturan",
    icon: Settings,
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
    effectiveCollapsed ? "lg:w-20" : "lg:w-60",
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

  const isParentOpen = (itemId: MainNavItemDef["id"]): boolean => {
    if (!pathname) return false;
    if (itemId === "onboarding") {
      return pathname.startsWith("/dashboard/onboarding");
    }
    if (itemId === "documents") {
      return pathname.startsWith("/dashboard/documents");
    }
    if (itemId === "overview") {
      return (
        pathname.startsWith("/dashboard/overview") ||
        pathname.startsWith("/dashboard/guarantees") ||
        pathname.startsWith("/dashboard/next-action") ||
        pathname.startsWith("/dashboard/tracker")
      );
    }
    return pathname.startsWith(`/dashboard/${itemId}`);
  };

  const isParentPrimaryActive = (itemId: MainNavItemDef["id"]): boolean => {
    if (!pathname) return false;
    if (itemId === "onboarding") {
      return (
        pathname.startsWith("/dashboard/onboarding") &&
        !pathname.startsWith("/dashboard/onboarding/chat")
      );
    }
    if (itemId === "documents") {
      return (
        pathname.startsWith("/dashboard/documents") &&
        !pathname.startsWith("/dashboard/documents/templates")
      );
    }
    if (itemId === "overview") {
      if (pathname.startsWith("/dashboard/overview/guarantees")) return false;
      if (!pathname.startsWith("/dashboard/overview")) return false;
      if (/^\/dashboard\/overview\/[^/]+/.test(pathname)) return true;
      return currentLens === "jobs";
    }
    return pathname.startsWith(`/dashboard/${itemId}`);
  };

  const isSubItemActive = (sub: SubNavItemDef): boolean => {
    if (!pathname) return false;
    if (sub.id === "onboarding-chat") {
      return pathname.startsWith("/dashboard/onboarding/chat");
    }
    if (sub.id === "templates") {
      return pathname.startsWith("/dashboard/documents/templates");
    }
    if (sub.lens) {
      if (pathname.startsWith("/dashboard/overview/guarantees")) {
        return sub.lens === "guarantees";
      }
      if (!pathname.startsWith("/dashboard/overview")) return false;
      if (/^\/dashboard\/overview\/[^/]+/.test(pathname)) return false;
      return currentLens === sub.lens;
    }
    return pathname.startsWith(sub.href);
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
          "flex flex-1 flex-col gap-1.5 py-4 overflow-y-auto",
          effectiveCollapsed ? "px-2 hide-scrollbar" : "px-3"
        )}
        aria-label="Sidebar navigation"
      >
        {MAIN_NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const groupOpen = isParentOpen(item.id);
          const primaryActive = isParentPrimaryActive(item.id);
          const showUnread = item.id === "notifications" && unreadCount > 0;

          return (
            <div key={item.id}>
              {idx === 3 && (
                <div className="my-2 border-t border-slate-100 mx-1" />
              )}

              <Link
                href={item.href}
                className={cn(
                  navItemClasses(primaryActive || (groupOpen && effectiveCollapsed)),
                  !primaryActive && groupOpen && !effectiveCollapsed &&
                    "bg-[#f4f8fd] text-[#0a4d8c] font-semibold"
                )}
                onClick={() => {
                  setMobileOpen(false);
                  if (item.id === "overview" && typeof window !== "undefined") {
                    setCurrentLens("jobs");
                    window.dispatchEvent(
                      new CustomEvent("prima-lens-change", { detail: "jobs" })
                    );
                  }
                }}
                aria-current={primaryActive ? "page" : undefined}
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
                  </span>
                )}
                {effectiveCollapsed && (showUnread || (item.id === "overview" && pendingActionsCount > 0)) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#0a4d8c] rounded-full" />
                )}
              </Link>

              {/* Sub-tabs always stay visible under their parent module */}
              {!effectiveCollapsed && item.subItems && (
                <div className="mt-1 ml-4 pl-2.5 border-l-2 border-slate-200/80 space-y-0.5">
                  {item.subItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const subActive = isSubItemActive(sub);
                    const showPendingSla =
                      sub.id === "overview-sla" && pendingActionsCount > 0;

                    return (
                      <Link
                        key={sub.id}
                        href={sub.href}
                        onClick={() => {
                          setMobileOpen(false);
                          if (sub.lens && typeof window !== "undefined") {
                            setCurrentLens(sub.lens);
                            window.dispatchEvent(
                              new CustomEvent("prima-lens-change", {
                                detail: sub.lens,
                              })
                            );
                          }
                        }}
                        aria-current={subActive ? "page" : undefined}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                          subActive
                            ? "bg-[#eaf3ff] text-[#0a4d8c] font-semibold shadow-2xs"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        )}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <SubIcon size={14} className="shrink-0" />
                          <span className="truncate">{sub.label}</span>
                        </span>
                        {showPendingSla && (
                          <span className="bg-[#0a4d8c] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0">
                            {pendingActionsCount > 99 ? "99+" : pendingActionsCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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
