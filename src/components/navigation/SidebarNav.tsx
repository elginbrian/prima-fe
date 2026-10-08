import {
  LayoutDashboard,
  ListTodo,
  FileSearch,
  ShieldAlert,
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

const navItems: any[] = [
  { key: "documents", label: "Dokumen", icon: FileSearch },
  { key: "overview", label: "Pekerjaan", icon: LayoutDashboard },
  { key: "next-action", label: "Tindakan", icon: ListTodo },
  { key: "guarantees", label: "Jaminan", icon: ShieldAlert },
  { key: "notifications", label: "Notifikasi", icon: Bell },
  { key: "settings", label: "Pengaturan", icon: Settings },
];

export function SidebarNav() {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { data: notifications = [] } = useNotifications();
  const { data: actions = [] } = useActions();
  const pathname = usePathname();
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const pendingActionsCount = actions.filter(a => a.status === 'Pending').length;

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
    effectiveCollapsed ? "lg:w-20" : "lg:w-52",
    "w-[280px]",
    mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
    "lg:translate-x-0 lg:static lg:shadow-none"
  );

  const navItemClasses = (active: boolean) =>
    cn(
      "flex w-full items-center gap-3 rounded-[12px] border-none px-3 py-3 text-left text-sm font-medium transition-all duration-200",
      active
        ? "bg-[#eaf3ff] text-[#0a4d8c] shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      effectiveCollapsed ? "lg:justify-center lg:px-2" : "lg:justify-start lg:px-4"
    );

  const childItemClasses = () =>
    cn(
      "flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-slate-700 hover:bg-slate-100",
      effectiveCollapsed ? "justify-center px-2" : "pl-8"
    );

  return (
    <aside className={containerClasses}>
      <div className="flex h-20 lg:h-23 items-center justify-center border-b border-slate-200 px-4 relative">
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
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 items-center justify-center rounded-full bg-[#0a4d8c] text-white hover:bg-[#093e6f] transition-colors z-10 shadow-md"
          aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => toggleCollapsed()}
        >
          {effectiveCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-2 py-4 overflow-y-auto",
          effectiveCollapsed ? 'px-2 hide-scrollbar' : 'px-3'
        )}
        aria-label="Sidebar navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon ?? LayoutDashboard;
          const isActive = pathname?.startsWith(`/dashboard/${item.key}`);

          return (
            <div key={item.key}>
              <Link
                href={`/dashboard/${item.key}`}
                className={navItemClasses(isActive || false)}
                onClick={() => setMobileOpen(false)}
                aria-expanded={item.children ? false : undefined}
                aria-current={isActive ? "page" : undefined}
                title={effectiveCollapsed ? item.label : undefined}
              >
                <Icon size={18} className="transition-colors" />
                {!effectiveCollapsed && (
                  <span className={`ml-2 transition-all duration-200 flex-1 flex items-center justify-between`}>
                    {item.label}
                    {item.key === "notifications" && unreadCount > 0 && (
                      <span className="bg-[#0a4d8c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    {item.key === "next-action" && pendingActionsCount > 0 && (
                      <span className="bg-[#0a4d8c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        {pendingActionsCount > 99 ? '99+' : pendingActionsCount}
                      </span>
                    )}
                  </span>
                )}
                {effectiveCollapsed && item.key === "notifications" && unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#0a4d8c] rounded-full"></span>
                )}
                {effectiveCollapsed && item.key === "next-action" && pendingActionsCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#0a4d8c] rounded-full"></span>
                )}
              </Link>

              {!effectiveCollapsed && item.children && (
                <div className="mt-1 flex flex-col gap-1 px-1">
                  {item.children.map((child: any) => (
                    <Link key={child.key} href={`/dashboard/${child.key}`} className={childItemClasses()} onClick={() => setMobileOpen(false)}>
                      <span className="text-[13px]">{child.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 px-3 py-4">
        <Link
          href="/login"
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-[12px] border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600",
            !effectiveCollapsed && "justify-start"
          )}
          onClick={() => setMobileOpen(false)}
        >
          <LogOut size={16} />
          {!effectiveCollapsed && <span>Keluar</span>}
        </Link>
      </div>
    </aside>
  );
}
